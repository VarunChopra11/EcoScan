import re
from typing import Tuple, Dict, Any
from app.core.constants import (
    GARMENT_BASELINES,
    MATERIAL_MULTIPLIERS,
    BENCHMARK_MULTIPLIER,
    CAR_MILES_PER_KG_CO2,
    PHONE_CHARGES_PER_KG_CO2,
    TREES_PLANTED_PER_KG_CO2,
)
from app.models.schemas import CarbonEquivalents


class CarbonService:
    """
    Core carbon scoring engine for apparel.
    Calculates cradle-to-grave emissions, material adjustments,
    benchmark comparisons, and sustainability ratings.
    """

    @staticmethod
    def normalize_category(raw_name: str) -> str:
        """
        Maps arbitrary item descriptions to canonical garment categories.
        """
        text = raw_name.lower().strip()
        # Direct key match
        for key in sorted(GARMENT_BASELINES.keys(), key=len, reverse=True):
            if re.search(rf"\b{key}s?\b", text) or key in text:
                return key

        # Alias mapping
        aliases = {
            "tee": "t-shirt",
            "top": "t-shirt",
            "polo": "t-shirt",
            "denim": "jeans",
            "pant": "jeans",
            "trouser": "trousers",
            "chino": "trousers",
            "cargo": "trousers",
            "sneaker": "shoes",
            "boot": "shoes",
            "trainer": "shoes",
            "loafer": "shoes",
            "sandal": "shoes",
            "footwear": "shoes",
            "parka": "coat",
            "overcoat": "coat",
            "trench": "coat",
            "windbreaker": "jacket",
            "fleece": "hoodie",
            "sweatshirt": "hoodie",
            "pullover": "sweater",
            "jumper": "sweater",
            "knit": "sweater",
            "suit": "blazer",
            "suit jacket": "blazer",
            "sport coat": "blazer",
            "legging": "activewear",
            "tight": "activewear",
            "yoga": "activewear",
            "hat": "cap",
            "beanie": "cap",
        }
        for alias, target in sorted(aliases.items(), key=lambda x: len(x[0]), reverse=True):
            if re.search(rf"\b{alias}s?\b", text) or alias in text:
                return target

        return "other"

    @staticmethod
    def normalize_material(raw_material: str) -> Tuple[str, float]:
        """
        Matches material string to recognized multiplier.
        Checks longest, most specific phrases first (e.g. 'organic cotton' before 'cotton').
        """
        text = raw_material.lower().strip()
        # Sort by key length descending so specific prefixes match first
        for mat_key in sorted(MATERIAL_MULTIPLIERS.keys(), key=len, reverse=True):
            if mat_key == "default":
                continue
            if mat_key in text:
                return mat_key, MATERIAL_MULTIPLIERS[mat_key]

        # Heuristic keywords
        if any(w in text for w in ["organic", "linen", "hemp", "tencel", "lyocell"]):
            return "organic cotton", 0.70
        if any(w in text for w in ["recycled", "rpet"]):
            return "recycled", 0.50
        if any(w in text for w in ["second-hand", "thrift", "vintage", "used"]):
            return "thrifted", 0.30
        if any(w in text for w in ["poly", "nylon", "acrylic", "spandex", "elastane"]):
            return "synthetic", 1.25
        if any(w in text for w in ["wool", "cashmere", "leather", "suede", "fur"]):
            return "wool", 1.40
        if any(w in text for w in ["cotton", "denim"]):
            return "conventional cotton", 1.00

        return "default", 1.00

    @classmethod
    def calculate_item_footprint(
        cls,
        garment_name: str,
        material_str: str = "conventional cotton",
    ) -> Dict[str, Any]:
        """
        Calculates carbon metrics for a single garment.
        """
        category = cls.normalize_category(garment_name)
        baseline = GARMENT_BASELINES.get(category, GARMENT_BASELINES["other"])
        mat_label, multiplier = cls.normalize_material(material_str)

        actual_co2 = round(baseline * multiplier, 2)
        benchmark_co2 = round(baseline * BENCHMARK_MULTIPLIER, 2)
        co2_saved = round(max(0.0, benchmark_co2 - actual_co2), 2)
        eco_rating = cls.get_eco_rating(actual_co2)
        care_tip = cls.get_care_recommendation(category, mat_label)

        return {
            "category": category,
            "material": mat_label,
            "multiplier": multiplier,
            "baseline_co2_kg": baseline,
            "actual_co2_kg": actual_co2,
            "benchmark_co2_kg": benchmark_co2,
            "co2_saved_kg": co2_saved,
            "eco_rating": eco_rating,
            "care_tip": care_tip,
        }

    @staticmethod
    def get_eco_rating(co2_kg: float) -> str:
        """
        Assigns an intuitive sustainability letter grade.
        """
        if co2_kg <= 3.5:
            return "A+"
        elif co2_kg <= 6.0:
            return "A"
        elif co2_kg <= 10.0:
            return "B"
        elif co2_kg <= 15.0:
            return "C"
        elif co2_kg <= 20.0:
            return "D"
        else:
            return "E"

    @staticmethod
    def get_care_recommendation(category: str, material: str) -> str:
        """
        Returns tailored laundry and maintenance recommendations to minimize footprint.
        """
        if "synthetic" in material or "polyester" in material or "nylon" in material:
            return "Wash in cold water (30°C) using a micro-waste filter bag to prevent microplastic shedding."
        elif "wool" in material or "cashmere" in material:
            return "Spot clean and steam rather than dry cleaning. Store folded to maintain fiber shape."
        elif "jeans" in category or "denim" in material:
            return "Wash inside out every 5-10 wears in cold water and air dry to prolong indigo and denim life."
        elif "leather" in material:
            return "Condition regularly with non-toxic natural wax to prevent cracking and ensure multi-decade life."
        elif "organic" in material or "linen" in material:
            return "Line dry in gentle shade to protect natural plant fibers and save 100% of tumble drying energy."
        else:
            return "Wash cold at 30°C, skip fabric softeners, and air-dry to reduce laundry emissions by up to 60%."

    @staticmethod
    def calculate_equivalents(co2_kg: float) -> CarbonEquivalents:
        """
        Converts kg CO2 into concrete, tangible real-world analogies.
        """
        car_miles = round(co2_kg * CAR_MILES_PER_KG_CO2, 1)
        phone_charges = int(round(co2_kg * PHONE_CHARGES_PER_KG_CO2))
        trees = round(co2_kg * TREES_PLANTED_PER_KG_CO2, 2)

        return CarbonEquivalents(
            car_miles=car_miles,
            phone_charges=phone_charges,
            trees_planted=trees,
        )


carbon_service = CarbonService()
