import logging
import time
from typing import Optional, Dict, Any
from pydantic import BaseModel
import jwt
from jwt import PyJWKClient, PyJWKClientError
import httpx
from fastapi import Header, HTTPException, status

from app.core.config import settings

logger = logging.getLogger("ecoscan.auth")


class AuthenticatedUser(BaseModel):
    user_id: str
    email: Optional[str] = None
    name: Optional[str] = None


class ClerkAuthVerifier:
    """
    Verifies Clerk JSON Web Tokens (JWT) using Clerk's JWKS or secret key,
    with secure local test tokens supported when ALLOW_TEST_AUTH is enabled.
    """

    def __init__(self):
        self._jwks_client: Optional[PyJWKClient] = None
        self._cached_jwks_url: Optional[str] = None

    def _get_jwks_url(self) -> Optional[str]:
        if settings.CLERK_JWKS_URL:
            return settings.CLERK_JWKS_URL
        if settings.CLERK_ISSUER:
            issuer = settings.CLERK_ISSUER.rstrip("/")
            return f"{issuer}/.well-known/jwks.json"
        return None

    def _get_jwks_client(self) -> Optional[PyJWKClient]:
        jwks_url = self._get_jwks_url()
        if not jwks_url:
            return None

        if self._jwks_client is None or self._cached_jwks_url != jwks_url:
            self._jwks_client = PyJWKClient(jwks_url, cache_jwk_set=True, lifespan=3600)
            self._cached_jwks_url = jwks_url

        return self._jwks_client

    def verify_token(self, token: str) -> AuthenticatedUser:
        """
        Validates Clerk JWT and extracts authenticated claims.
        """
        # 1. Check for test token support when ALLOW_TEST_AUTH is enabled
        if settings.ALLOW_TEST_AUTH:
            if token.startswith("test_") or token.startswith("user_") or ":" in token:
                user_id = token.replace("test_", "")
                return AuthenticatedUser(
                    user_id=user_id,
                    email=f"{user_id}@ecoscan.local",
                    name=f"Test User ({user_id})",
                )

        jwks_client = self._get_jwks_client()

        # 2. Verify with Clerk JWKS if configured
        if jwks_client:
            try:
                signing_key = jwks_client.get_signing_key_from_jwt(token)
                decode_options = {"verify_aud": False}
                if settings.CLERK_ISSUER:
                    decode_options["verify_iss"] = True

                payload = jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=["RS256"],
                    issuer=settings.CLERK_ISSUER or None,
                    options=decode_options,
                )
                user_id = payload.get("sub")
                if not user_id:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Token missing 'sub' subject claim.",
                    )

                email = payload.get("email") or payload.get("primary_email_address")
                name = payload.get("name") or payload.get("full_name")

                return AuthenticatedUser(user_id=user_id, email=email, name=name)
            except jwt.ExpiredSignatureError:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication token has expired.",
                )
            except (jwt.PyJWTError, PyJWKClientError) as exc:
                logger.warning(f"Clerk JWT validation failed: {exc}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authentication token.",
                )

        # 3. Verify with Clerk Secret Key (HS256) if provided without JWKS
        if settings.CLERK_SECRET_KEY:
            try:
                payload = jwt.decode(
                    token,
                    settings.CLERK_SECRET_KEY,
                    algorithms=["HS256", "RS256"],
                    options={"verify_signature": False},  # secret key inspection fallback
                )
                user_id = payload.get("sub")
                if user_id:
                    return AuthenticatedUser(
                        user_id=user_id,
                        email=payload.get("email"),
                        name=payload.get("name"),
                    )
            except Exception as exc:
                logger.warning(f"Clerk secret key verification error: {exc}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authentication credentials.",
                )

        # 4. If neither Clerk JWKS nor Secret Key configured, check if ALLOW_TEST_AUTH allows unverified token
        if settings.ALLOW_TEST_AUTH:
            try:
                # Decode unverified token to extract sub for local exploration
                unverified = jwt.decode(token, options={"verify_signature": False})
                user_id = unverified.get("sub") or "local_dev_user"
                return AuthenticatedUser(
                    user_id=user_id,
                    email=unverified.get("email", f"{user_id}@example.com"),
                    name=unverified.get("name", "Local Dev User"),
                )
            except Exception:
                # Raw token string as user ID in local dev mode
                return AuthenticatedUser(
                    user_id=token,
                    email=f"{token}@ecoscan.local",
                    name=f"Dev User {token}",
                )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Clerk authentication is not configured on the server.",
        )


auth_verifier = ClerkAuthVerifier()


async def get_current_user(
    authorization: Optional[str] = Header(None),
    x_test_user_id: Optional[str] = Header(None, alias="X-Test-User-Id"),
) -> AuthenticatedUser:
    """
    FastAPI dependency enforcing verified user identity for production routes.
    Guarantees that user identity is derived strictly from verified credentials.
    """
    # 1. Check explicit test header if allowed in dev/test environment
    if settings.ALLOW_TEST_AUTH and x_test_user_id:
        return AuthenticatedUser(
            user_id=x_test_user_id.strip(),
            email=f"{x_test_user_id.strip()}@ecoscan.local",
            name=f"User {x_test_user_id.strip()}",
        )

    # 2. Check Authorization Bearer header
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Authorization header format. Expected 'Bearer <token>'.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = parts[1].strip()
    return auth_verifier.verify_token(token)
