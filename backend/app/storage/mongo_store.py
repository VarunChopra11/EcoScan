import logging
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Optional, Any
from copy import deepcopy

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

from app.core.config import settings
from app.core.constants import INITIAL_OFFERS
from app.models.schemas import (
    ScanResponse,
    Offer,
    OfferRedemptionResponse,
    LifetimeStats,
    UserHistoryResponse,
)

logger = logging.getLogger("ecoscan.mongo")


class MongoStore:
    """
    MongoDB repository managing persistent user profiles, wallets,
    scan history, and partner voucher redemptions.
    Provides data isolation per verified user_id.
    """

    def __init__(self):
        self._client: Optional[AsyncIOMotorClient] = None
        self._db = None
        self._is_live_mongo: bool = False
        self._initialized: bool = False

        # In-memory persistent collections for local dev & offline testing
        self._mock_users: Dict[str, Dict[str, Any]] = {}
        self._mock_scans: List[Dict[str, Any]] = []
        self._mock_redemptions: List[Dict[str, Any]] = []
        self._offers_catalog: List[Dict[str, Any]] = deepcopy(INITIAL_OFFERS)

    async def initialize(self) -> None:
        """
        Connects to MongoDB if available. Attempts once.
        """
        if self._initialized:
            return
        self._initialized = True

        if not settings.MONGODB_URI:
            self._is_live_mongo = False
            return

        try:
            client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=500,
            )
            # Test ping
            await client.admin.command("ping")
            self._client = client
            self._db = client[settings.MONGODB_DB_NAME]
            self._is_live_mongo = True
            logger.info(f"Connected to live MongoDB at {settings.MONGODB_URI} (db: {settings.MONGODB_DB_NAME})")

            # Create indexes
            await self._db.users.create_index("user_id", unique=True)
            await self._db.scans.create_index([("user_id", 1), ("timestamp", -1)])
            await self._db.redemptions.create_index([("user_id", 1), ("offer_id", 1)])
        except (ConnectionFailure, ServerSelectionTimeoutError, Exception) as exc:
            logger.info(
                f"Live MongoDB not available at {settings.MONGODB_URI} ({exc}). "
                "Activating in-memory isolated persistence store."
            )
            self._is_live_mongo = False

    @property
    def is_live_mongo(self) -> bool:
        return self._is_live_mongo

    async def get_or_create_user(self, user_id: str, email: Optional[str] = None) -> Dict[str, Any]:
        """
        Retrieves or initializes a persistent user profile and wallet.
        """
        await self.initialize()

        if self._is_live_mongo and self._db is not None:
            user = await self._db.users.find_one({"user_id": user_id})
            if not user:
                user = {
                    "user_id": user_id,
                    "email": email or f"{user_id}@ecoscan.app",
                    "current_points": 50,  # 50 welcome points
                    "lifetime_points_earned": 50,
                    "total_points_spent": 0,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
                await self._db.users.insert_one(user)
            return user
        else:
            if user_id not in self._mock_users:
                self._mock_users[user_id] = {
                    "user_id": user_id,
                    "email": email or f"{user_id}@ecoscan.app",
                    "current_points": 50,
                    "lifetime_points_earned": 50,
                    "total_points_spent": 0,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
            return deepcopy(self._mock_users[user_id])

    async def get_user_stats(self, user_id: str) -> LifetimeStats:
        """
        Calculates lifetime carbon stats and current points for a specific user.
        """
        await self.initialize()
        user = await self.get_or_create_user(user_id)
        scans = await self.get_user_scans(user_id)

        total_items = sum(len(s.items) for s in scans)
        total_co2 = round(sum(s.total_co2_kg for s in scans), 2)
        total_co2_saved = round(sum(s.total_co2_saved_kg for s in scans), 2)

        return LifetimeStats(
            total_scans=len(scans),
            total_items_scanned=total_items,
            total_co2_kg=total_co2,
            total_co2_saved_kg=total_co2_saved,
            current_points=user["current_points"],
            lifetime_points_earned=user["lifetime_points_earned"],
            total_points_spent=user["total_points_spent"],
        )

    async def save_scan(self, user_id: str, scan: ScanResponse) -> None:
        """
        Persists a completed scan to the database and atomically awards EcoPoints to user wallet.
        """
        await self.initialize()
        scan_dict = scan.model_dump()
        scan_dict["user_id"] = user_id

        if self._is_live_mongo and self._db is not None:
            await self._db.scans.insert_one(scan_dict)
            await self._db.users.update_one(
                {"user_id": user_id},
                {
                    "$inc": {
                        "current_points": scan.points_awarded,
                        "lifetime_points_earned": scan.points_awarded,
                    },
                    "$set": {"updated_at": datetime.now(timezone.utc).isoformat()},
                },
                upsert=True,
            )
        else:
            self._mock_scans.insert(0, scan_dict)
            if user_id not in self._mock_users:
                await self.get_or_create_user(user_id)
            self._mock_users[user_id]["current_points"] += scan.points_awarded
            self._mock_users[user_id]["lifetime_points_earned"] += scan.points_awarded
            self._mock_users[user_id]["updated_at"] = datetime.now(timezone.utc).isoformat()

    async def get_user_scans(self, user_id: str, limit: int = 50) -> List[ScanResponse]:
        """
        Fetches chronological scans strictly belonging to this user.
        """
        await self.initialize()

        if self._is_live_mongo and self._db is not None:
            cursor = self._db.scans.find({"user_id": user_id}).sort("timestamp", -1).limit(limit)
            docs = await cursor.to_list(length=limit)
            results = []
            for d in docs:
                d.pop("_id", None)
                d.pop("user_id", None)
                results.append(ScanResponse(**d))
            return results
        else:
            user_docs = [s for s in self._mock_scans if s.get("user_id") == user_id]
            results = []
            for s in user_docs[:limit]:
                clean = {k: v for k, v in s.items() if k not in ["_id", "user_id"]}
                results.append(ScanResponse(**clean))
            return results

    async def get_user_offers(self, user_id: str) -> List[Offer]:
        """
        Returns catalog offers with user-specific unlock progress and redemption status.
        """
        await self.initialize()
        user = await self.get_or_create_user(user_id)
        current_points = user["current_points"]
        redemptions = await self.get_user_redemptions(user_id)
        redeemed_ids = {r.offer_id: r.code for r in redemptions}

        result: List[Offer] = []
        for item in self._offers_catalog:
            is_redeemed = item["id"] in redeemed_ids
            is_unlocked = current_points >= item["points_cost"]
            progress = min(100.0, round((current_points / item["points_cost"]) * 100.0, 1))

            result.append(
                Offer(
                    id=item["id"],
                    brand=item["brand"],
                    title=item["title"],
                    description=item["description"],
                    points_cost=item["points_cost"],
                    category=item["category"],
                    badge=item["badge"],
                    partner_url=item["partner_url"],
                    is_unlocked=is_unlocked,
                    is_redeemed=is_redeemed,
                    redemption_code=redeemed_ids.get(item["id"]),
                    progress_percent=progress,
                )
            )
        return result

    async def redeem_offer(self, user_id: str, offer_id: str) -> OfferRedemptionResponse:
        """
        Atomically redeems a partner voucher:
        - Validates sufficient balance
        - Prevents duplicate redemptions
        - Deducts points from user wallet
        - Generates unique voucher code
        """
        await self.initialize()
        user = await self.get_or_create_user(user_id)

        offer_meta = next((o for o in self._offers_catalog if o["id"] == offer_id), None)
        if not offer_meta:
            raise ValueError(f"Offer with ID '{offer_id}' not found.")

        # Check existing redemption
        redemptions = await self.get_user_redemptions(user_id)
        if any(r.offer_id == offer_id for r in redemptions):
            raise ValueError(f"Offer '{offer_meta['title']}' has already been redeemed.")

        cost = offer_meta["points_cost"]
        if user["current_points"] < cost:
            raise ValueError(
                f"Insufficient EcoPoints: Need {cost} pts, but current balance is {user['current_points']} pts."
            )

        unique_code = f"{offer_meta.get('code_prefix', 'ECO-')}{uuid.uuid4().hex[:6].upper()}"
        now_iso = datetime.now(timezone.utc).isoformat()
        remaining = user["current_points"] - cost

        redemption = OfferRedemptionResponse(
            offer_id=offer_id,
            brand=offer_meta["brand"],
            title=offer_meta["title"],
            code=unique_code,
            points_spent=cost,
            remaining_points=remaining,
            redeemed_at=now_iso,
        )

        redemption_doc = redemption.model_dump()
        redemption_doc["user_id"] = user_id

        if self._is_live_mongo and self._db is not None:
            await self._db.redemptions.insert_one(redemption_doc)
            await self._db.users.update_one(
                {"user_id": user_id},
                {
                    "$inc": {"current_points": -cost, "total_points_spent": cost},
                    "$set": {"updated_at": now_iso},
                },
            )
        else:
            self._mock_redemptions.append(redemption_doc)
            self._mock_users[user_id]["current_points"] -= cost
            self._mock_users[user_id]["total_points_spent"] += cost
            self._mock_users[user_id]["updated_at"] = now_iso

        return redemption

    async def get_user_redemptions(self, user_id: str) -> List[OfferRedemptionResponse]:
        """
        Fetches redeemed partner vouchers belonging exclusively to this user.
        """
        await self.initialize()

        if self._is_live_mongo and self._db is not None:
            cursor = self._db.redemptions.find({"user_id": user_id}).sort("redeemed_at", -1)
            docs = await cursor.to_list(length=100)
            results = []
            for d in docs:
                d.pop("_id", None)
                d.pop("user_id", None)
                results.append(OfferRedemptionResponse(**d))
            return results
        else:
            user_docs = [r for r in self._mock_redemptions if r.get("user_id") == user_id]
            results = []
            for r in user_docs:
                clean = {k: v for k, v in r.items() if k not in ["_id", "user_id"]}
                results.append(OfferRedemptionResponse(**clean))
            return results

    async def get_user_history(self, user_id: str) -> UserHistoryResponse:
        """
        Returns full history and stats for this verified user.
        """
        stats = await self.get_user_stats(user_id)
        scans = await self.get_user_scans(user_id)
        redemptions = await self.get_user_redemptions(user_id)

        return UserHistoryResponse(
            stats=stats,
            scans=scans,
            redeemed_offers=redemptions,
        )

    def reset_mock_data(self) -> None:
        """Helper for test suites."""
        self._mock_users.clear()
        self._mock_scans.clear()
        self._mock_redemptions.clear()


mongo_store = MongoStore()
