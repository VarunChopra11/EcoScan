from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class GarmentItem(BaseModel):
    name: str = Field(..., description="Human-readable label of the identified garment")
    category: str = Field(..., description="Normalized category key (e.g., t-shirt, jeans, jacket)")
    material: str = Field("conventional cotton", description="Detected or inferred fabric/material")
    confidence: float = Field(0.9, ge=0.0, le=1.0, description="Detection confidence score")
    color: Optional[str] = Field(None, description="Garment primary color")
    estimated_co2_kg: float = Field(..., description="Estimated life cycle carbon footprint in kg CO2e")
    baseline_co2_kg: float = Field(..., description="Standard garment category baseline in kg CO2e")
    benchmark_co2_kg: float = Field(..., description="Fast-fashion benchmark comparison footprint in kg CO2e")
    co2_saved_kg: float = Field(0.0, ge=0.0, description="Carbon savings compared to high-impact benchmark")
    eco_rating: str = Field("B", description="Sustainability rating letter grade (A+, A, B, C, D, E)")
    care_recommendation: str = Field("", description="Tailored longevity or laundry care tip")
    description: Optional[str] = Field(None, description="Brief visual context or pattern notes")


class CarbonEquivalents(BaseModel):
    car_miles: float = Field(..., description="Equivalent gasoline passenger vehicle miles driven")
    phone_charges: int = Field(..., description="Equivalent full smartphone battery charges")
    trees_planted: float = Field(..., description="Tree seedlings grown for 10 years to offset")


class PointsBreakdown(BaseModel):
    base_scan: int = Field(..., description="Base conscious logging points")
    eco_savings: int = Field(..., description="Points earned from CO2 savings")
    low_impact_bonus: int = Field(0, description="Bonus points for low carbon footprint outfit")
    total: int = Field(..., description="Total points awarded for this scan")


class ScanResponse(BaseModel):
    id: str = Field(..., description="Unique scan identifier")
    timestamp: str = Field(..., description="ISO 8601 creation timestamp")
    items: List[GarmentItem] = Field(..., description="List of recognized clothing items")
    total_co2_kg: float = Field(..., description="Sum of life cycle carbon footprints in kg CO2e")
    total_co2_saved_kg: float = Field(..., description="Total carbon savings in kg CO2e")
    overall_eco_rating: str = Field(..., description="Aggregate letter rating (A+, A, B, C, D, E)")
    points_awarded: int = Field(..., description="EcoPoints granted for this scan")
    points_breakdown: PointsBreakdown = Field(..., description="Detailed points calculation")
    equivalents: CarbonEquivalents = Field(..., description="Everyday impact equivalencies")
    summary_tip: str = Field(..., description="Holistic sustainability feedback for the scanned garments")
    vision_source: str = Field(..., description="Source of vision classification (azure_openai_gpt4o or offline_model_heuristic)")
    image_url: Optional[str] = Field(None, description="Optional stored data URI or thumbnail")


class Offer(BaseModel):
    id: str
    brand: str
    title: str
    description: str
    points_cost: int
    category: str
    badge: str
    partner_url: str
    is_unlocked: bool
    is_redeemed: bool
    redemption_code: Optional[str] = None
    progress_percent: float = Field(0.0, ge=0.0, le=100.0)


class OfferRedemptionResponse(BaseModel):
    offer_id: str
    brand: str
    title: str
    code: str
    points_spent: int
    remaining_points: int
    redeemed_at: str


class LifetimeStats(BaseModel):
    total_scans: int
    total_items_scanned: int
    total_co2_kg: float
    total_co2_saved_kg: float
    current_points: int
    lifetime_points_earned: int
    total_points_spent: int


class UserHistoryResponse(BaseModel):
    stats: LifetimeStats
    scans: List[ScanResponse]
    redeemed_offers: List[OfferRedemptionResponse]


class HealthResponse(BaseModel):
    status: str
    version: str
    azure_openai_configured: bool
    vision_mode: str
