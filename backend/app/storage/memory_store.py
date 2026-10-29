import threading
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Optional, Any
from copy import deepcopy

from app.core.constants import INITIAL_OFFERS
from app.models.schemas import (
    ScanResponse,
    Offer,
    OfferRedemptionResponse,
    LifetimeStats,
    UserHistoryResponse,
)


class InMemoryStore:
    """
    Thread-safe in-memory store managing scans, user EcoPoints balance,
    and redeemed offer vouchers.
    """

    def __init__(self):
        self._lock = threading.Lock()
        self._scans: List[ScanResponse] = []
        self._redeemed_offers: List[OfferRedemptionResponse] = []
        self._current_points: int = 0  # Default initial balance starts at 0
        self._lifetime_points_earned: int = 0
        self._total_points_spent: int = 0
        self._offers_catalog: List[Dict[str, Any]] = deepcopy(INITIAL_OFFERS)

    def get_stats(self) -> LifetimeStats:
        with self._lock:
            total_items = sum(len(s.items) for s in self._scans)
            total_co2 = round(sum(s.total_co2_kg for s in self._scans), 2)
            total_co2_saved = round(sum(s.total_co2_saved_kg for s in self._scans), 2)
            return LifetimeStats(
                total_scans=len(self._scans),
                total_items_scanned=total_items,
                total_co2_kg=total_co2,
                total_co2_saved_kg=total_co2_saved,
                current_points=self._current_points,
                lifetime_points_earned=self._lifetime_points_earned,
                total_points_spent=self._total_points_spent,
            )

    def add_scan(self, scan: ScanResponse) -> None:
        with self._lock:
            self._scans.insert(0, scan)  # newest first
            self._current_points += scan.points_awarded
            self._lifetime_points_earned += scan.points_awarded

    def get_scans(self) -> List[ScanResponse]:
        with self._lock:
            return list(self._scans)

    def get_offers(self) -> List[Offer]:
        with self._lock:
            redeemed_ids = {r.offer_id for r in self._redeemed_offers}
            result: List[Offer] = []
            for item in self._offers_catalog:
                is_redeemed = item["id"] in redeemed_ids
                is_unlocked = self._current_points >= item["points_cost"]
                progress = min(100.0, round((self._current_points / item["points_cost"]) * 100.0, 1))

                # Look up redemption code if redeemed
                redemption_code = None
                for r in self._redeemed_offers:
                    if r.offer_id == item["id"]:
                        redemption_code = r.code
                        break

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
                        redemption_code=redemption_code,
                        progress_percent=progress,
                    )
                )
            return result

    def redeem_offer(self, offer_id: str) -> OfferRedemptionResponse:
        with self._lock:
            # Check offer exists
            offer_meta = next((o for o in self._offers_catalog if o["id"] == offer_id), None)
            if not offer_meta:
                raise ValueError(f"Offer with ID '{offer_id}' not found.")

            # Check if already redeemed
            if any(r.offer_id == offer_id for r in self._redeemed_offers):
                raise ValueError(f"Offer '{offer_meta['title']}' has already been redeemed.")

            # Check sufficient points
            cost = offer_meta["points_cost"]
            if self._current_points < cost:
                raise ValueError(
                    f"Insufficient EcoPoints: Need {cost} pts, but current balance is {self._current_points} pts."
                )

            # Deduct points
            self._current_points -= cost
            self._total_points_spent += cost

            # Generate unique redemption promo code
            unique_suffix = uuid.uuid4().hex[:6].upper()
            code = f"{offer_meta.get('code_prefix', 'ECO-')}{unique_suffix}"

            now_iso = datetime.now(timezone.utc).isoformat()
            redemption = OfferRedemptionResponse(
                offer_id=offer_id,
                brand=offer_meta["brand"],
                title=offer_meta["title"],
                code=code,
                points_spent=cost,
                remaining_points=self._current_points,
                redeemed_at=now_iso,
            )
            self._redeemed_offers.append(redemption)
            return redemption

    def get_history(self) -> UserHistoryResponse:
        stats = self.get_stats()
        with self._lock:
            return UserHistoryResponse(
                stats=stats,
                scans=list(self._scans),
                redeemed_offers=list(self._redeemed_offers),
            )

    def reset(self) -> None:
        with self._lock:
            self._scans.clear()
            self._redeemed_offers.clear()
            self._current_points = 0
            self._lifetime_points_earned = 0
            self._total_points_spent = 0


# Global singleton store instance
memory_store = InMemoryStore()
