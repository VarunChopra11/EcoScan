import logging
import time
from typing import Optional, Dict, Any
from pydantic import BaseModel
import jwt
from jwt import PyJWKClient, PyJWKClientError
from fastapi import Header, HTTPException, status

from app.core.config import settings

logger = logging.getLogger("ecoscan.auth")


class AuthenticatedUser(BaseModel):
    user_id: str
    email: Optional[str] = None
    name: Optional[str] = None


class ClerkAuthVerifier:
    """
    Verifies Clerk JSON Web Tokens (JWT) using Clerk's JWKS, PEM public key, or secret key.
    Enforces cryptographic signature verification, expiration checks, and claims validation.
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
        Enforces cryptographic signature verification, expiration validation,
        and subject (sub) claim extraction.
        """
        if not token or not token.strip():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Empty authentication token provided.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        token = token.strip()
        payload: Optional[Dict[str, Any]] = None

        # 1. Verify with Clerk PEM Public Key (RS256) if provided directly in config
        if settings.CLERK_PEM_PUBLIC_KEY:
            try:
                decode_options = {"verify_signature": True, "verify_exp": True, "verify_aud": False}
                if settings.CLERK_ISSUER:
                    decode_options["verify_iss"] = True

                payload = jwt.decode(
                    token,
                    settings.CLERK_PEM_PUBLIC_KEY,
                    algorithms=["RS256"],
                    issuer=settings.CLERK_ISSUER or None,
                    options=decode_options,
                )
            except jwt.ExpiredSignatureError:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication token has expired.",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            except jwt.PyJWTError as exc:
                logger.warning(f"Clerk PEM verification failed: {exc}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authentication token.",
                    headers={"WWW-Authenticate": "Bearer"},
                )

        # 2. Verify with Clerk JWKS client if JWKS URL or Issuer configured
        if payload is None:
            jwks_client = self._get_jwks_client()
            if jwks_client:
                try:
                    signing_key = jwks_client.get_signing_key_from_jwt(token)
                    decode_options = {"verify_signature": True, "verify_exp": True, "verify_aud": False}
                    if settings.CLERK_ISSUER:
                        decode_options["verify_iss"] = True

                    payload = jwt.decode(
                        token,
                        signing_key.key,
                        algorithms=["RS256"],
                        issuer=settings.CLERK_ISSUER or None,
                        options=decode_options,
                    )
                except jwt.ExpiredSignatureError:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Authentication token has expired.",
                        headers={"WWW-Authenticate": "Bearer"},
                    )
                except (jwt.PyJWTError, PyJWKClientError) as exc:
                    logger.warning(f"Clerk JWKS verification failed: {exc}")
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid authentication token.",
                        headers={"WWW-Authenticate": "Bearer"},
                    )

        # 3. Verify with Clerk Secret Key (HS256) if provided
        if payload is None and settings.CLERK_SECRET_KEY:
            try:
                payload = jwt.decode(
                    token,
                    settings.CLERK_SECRET_KEY,
                    algorithms=["HS256", "HS384", "HS512"],
                    options={"verify_signature": True, "verify_exp": True, "verify_aud": False},
                )
            except jwt.ExpiredSignatureError:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication token has expired.",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            except jwt.PyJWTError as exc:
                logger.warning(f"Clerk secret key verification failed: {exc}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authentication token.",
                    headers={"WWW-Authenticate": "Bearer"},
                )

        # 4. If no verification method succeeded or server is unconfigured
        if payload is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Clerk authentication is not configured on the server.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        # Validate that verified payload contains a non-empty subject identifier
        user_id = payload.get("sub")
        if not user_id or not str(user_id).strip():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token missing 'sub' subject claim.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        email = payload.get("email") or payload.get("primary_email_address")
        name = payload.get("name") or payload.get("full_name")

        return AuthenticatedUser(user_id=str(user_id).strip(), email=email, name=name)


auth_verifier = ClerkAuthVerifier()


async def get_current_user(
    authorization: Optional[str] = Header(None),
) -> AuthenticatedUser:
    """
    FastAPI dependency enforcing verified user identity for production routes.
    Guarantees that user identity is derived strictly from verified credentials,
    never from client-supplied IDs.
    """
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
