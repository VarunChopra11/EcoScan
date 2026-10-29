import math
from typing import List, Tuple
from app.core.constants import (
    BASE_SCAN_POINTS,
    POINTS_PER_KG_SAVED,
    LOW_IMPACT_THRESHOLD_KG,
    LOW_IMPACT_BONUS_POINTS,
)
from app.models.schemas import PointsBreakdown, GarmentItem


class RewardService:
    """
    Computes EcoPoints and actionable incentives based on carbon savings
    and garment choices.
    """

    @classmethod
    def calculate_points(cls, items: List[GarmentItem]) -> Tuple[int, PointsBreakdown]:
        """
        Calculates EcoPoints awarded for a scan session.
        Formula:
          Total = Base (10) + floor(Savings * 20) + Low-Impact Bonus (15 if avg CO2 <= 6.0kg)
        """
        if not items:
            breakdown = PointsBreakdown(
                base_scan=0,
                eco_savings=0,
                low_impact_bonus=0,
                total=0,
            )
            return 0, breakdown

        total_savings = sum(item.co2_saved_kg for item in items)
        total_co2 = sum(item.estimated_co2_kg for item in items)
        avg_co2 = total_co2 / len(items)

        base_pts = BASE_SCAN_POINTS
        savings_pts = int(math.floor(total_savings * POINTS_PER_KG_SAVED))
        savings_pts = max(0, savings_pts)

        bonus_pts = LOW_IMPACT_BONUS_POINTS if avg_co2 <= LOW_IMPACT_THRESHOLD_KG else 0
        total_pts = base_pts + savings_pts + bonus_pts

        breakdown = PointsBreakdown(
            base_scan=base_pts,
            eco_savings=savings_pts,
            low_impact_bonus=bonus_pts,
            total=total_pts,
        )
        return total_pts, breakdown

    @staticmethod
    def generate_summary_tip(items: List[GarmentItem], overall_rating: str) -> str:
        """
        Produces context-aware sustainability advice for the analyzed garments.
        """
        if not items:
            return "No clothing items identified. Try taking a photo in brighter light."

        has_synthetics = any("synthetic" in i.material or "poly" in i.material for i in items)
        has_thrifted = any("thrift" in i.material or "vintage" in i.material for i in items)
        has_denim = any("jeans" in i.category or "denim" in i.material for i in items)

        if has_thrifted:
            return "Fantastic circular choice! Choosing second-hand or vintage cuts production emissions by ~70%."
        elif overall_rating in ["A+", "A"]:
            return "Excellent low-carbon profile! Your items have a lightweight footprint compared to industry norms."
        elif has_synthetics and has_denim:
            return "Consider washing cold and air-drying. Denim and synthetics benefit heavily from reduced wash cycles."
        elif has_synthetics:
            return "For synthetic garments, consider using a micro-waste filter bag when washing to protect marine ecosystems."
        else:
            return "Extending the wearable lifespan of your clothes by just 9 months reduces carbon footprint by ~25%."


reward_service = RewardService()
