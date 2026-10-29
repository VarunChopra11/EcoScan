export interface GarmentItem {
  name: string;
  category: string;
  material: string;
  confidence: number;
  color?: string;
  estimated_co2_kg: number;
  baseline_co2_kg: number;
  benchmark_co2_kg: number;
  co2_saved_kg: number;
  eco_rating: string;
  care_recommendation: string;
  description?: string;
}

export interface CarbonEquivalents {
  car_miles: number;
  phone_charges: number;
  trees_planted: number;
}

export interface PointsBreakdown {
  base_scan: number;
  eco_savings: number;
  low_impact_bonus: number;
  total: number;
}

export interface ScanResponse {
  id: string;
  timestamp: string;
  items: GarmentItem[];
  total_co2_kg: number;
  total_co2_saved_kg: number;
  overall_eco_rating: string;
  points_awarded: number;
  points_breakdown: PointsBreakdown;
  equivalents: CarbonEquivalents;
  summary_tip: string;
  vision_source: string;
  image_url?: string;
}

export interface Offer {
  id: string;
  brand: string;
  title: string;
  description: string;
  points_cost: number;
  category: string;
  badge: string;
  partner_url: string;
  is_unlocked: boolean;
  is_redeemed: boolean;
  redemption_code?: string | null;
  progress_percent: number;
}

export interface OfferRedemptionResponse {
  offer_id: string;
  brand: string;
  title: string;
  code: string;
  points_spent: number;
  remaining_points: number;
  redeemed_at: string;
}

export interface LifetimeStats {
  total_scans: number;
  total_items_scanned: number;
  total_co2_kg: number;
  total_co2_saved_kg: number;
  current_points: number;
  lifetime_points_earned: number;
  total_points_spent: number;
}

export interface UserHistoryResponse {
  stats: LifetimeStats;
  scans: ScanResponse[];
  redeemed_offers: OfferRedemptionResponse[];
}

export interface ProductionUser {
  user_id: string;
  email?: string;
  name?: string;
  created_at?: string;
}

export interface ProductionDashboardResponse {
  user: ProductionUser;
  stats: LifetimeStats;
  recent_scans: ScanResponse[];
  offers: Offer[];
  database_mode: string;
}

export type AppMode = 'landing' | 'test' | 'prod';
export type TabType = 'scan' | 'redeem' | 'history';
export type ScanInputMode = 'upload' | 'camera' | 'sample';
