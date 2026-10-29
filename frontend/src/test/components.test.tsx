import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Badge } from '../components/common/Badge';
import { StatCard } from '../components/common/StatCard';
import { GarmentCard } from '../components/Scanner/GarmentCard';
import { OfferCard } from '../components/Redeem/OfferCard';
import { TabNavigation } from '../components/TabNavigation';
import { LandingPage } from '../components/Landing/LandingPage';
import { ScanResults } from '../components/Scanner/ScanResults';
import { ProductionApp } from '../components/Production/ProductionApp';
import { GarmentItem, Offer, ScanResponse } from '../types';

describe('Common Components', () => {
  it('renders Badge with correct text and variant', () => {
    render(<Badge variant="green">Eco Choice</Badge>);
    expect(screen.getByText('Eco Choice')).toBeInTheDocument();
  });

  it('renders StatCard with value and subtext', () => {
    render(
      <StatCard
        label="Total CO2"
        value="42.5"
        unit="kg"
        subtext="Analyzed across all scans"
      />
    );
    expect(screen.getByText('Total CO2')).toBeInTheDocument();
    expect(screen.getByText('42.5')).toBeInTheDocument();
    expect(screen.getByText('Analyzed across all scans')).toBeInTheDocument();
  });
});

describe('GarmentCard Component', () => {
  const mockItem: GarmentItem = {
    name: 'Denim Trucker Jacket',
    category: 'jacket',
    material: 'cotton denim',
    confidence: 0.95,
    estimated_co2_kg: 15.0,
    baseline_co2_kg: 15.0,
    benchmark_co2_kg: 18.75,
    co2_saved_kg: 3.75,
    eco_rating: 'C',
    care_recommendation: 'Wash cold inside out every 10 wears.',
    description: 'Heavyweight trucker jacket',
  };

  it('renders garment details, metrics, and care advice', () => {
    render(<GarmentCard item={mockItem} />);
    expect(screen.getByText('Denim Trucker Jacket')).toBeInTheDocument();
    expect(screen.getByText('Grade C')).toBeInTheDocument();
    expect(screen.getByText('95% match')).toBeInTheDocument();
    expect(screen.getByText('-3.75')).toBeInTheDocument();
    expect(screen.getByText(/Wash cold inside out/)).toBeInTheDocument();
  });
});

describe('ScanResults Component (Clean Minimal UI)', () => {
  const mockScan: ScanResponse = {
    id: 'scan_test_1',
    timestamp: new Date().toISOString(),
    items: [
      {
        name: 'Organic Cotton Tee',
        category: 't-shirt',
        material: 'organic cotton',
        confidence: 0.96,
        estimated_co2_kg: 3.5,
        baseline_co2_kg: 5.0,
        benchmark_co2_kg: 7.5,
        co2_saved_kg: 4.0,
        eco_rating: 'A',
        care_recommendation: 'Wash in cold water.',
      },
    ],
    total_co2_kg: 3.5,
    total_co2_saved_kg: 4.0,
    overall_eco_rating: 'A',
    points_awarded: 90,
    points_breakdown: {
      total: 90,
      base_scan: 10,
      eco_savings: 80,
      low_impact_bonus: 0,
    },
    equivalents: {
      car_miles: 8.7,
      phone_charges: 425,
      trees_planted: 0.2,
    },
    summary_tip: 'Outstanding sustainable choice!',
    vision_source: 'azure_openai_gpt4o',
  };

  it('renders carbon impact and points without unnecessary decorative equivalents', () => {
    render(
      <ScanResults
        results={mockScan}
        onScanAnother={vi.fn()}
        onGoToRedeem={vi.fn()}
      />
    );

    // Focused essentials must be present
    expect(screen.getAllByText('3.5').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('+90')).toBeInTheDocument();
    expect(screen.getByText(/Outstanding sustainable choice/)).toBeInTheDocument();
    expect(screen.getByText('Organic Cotton Tee')).toBeInTheDocument();

    // Unnecessary decorative equivalents strip must be removed
    expect(screen.queryByText(/Passenger Car Equiv/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/miles driven/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/phone charges/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/seedling-years/i)).not.toBeInTheDocument();
  });
});

describe('OfferCard Component', () => {
  const mockOffer: Offer = {
    id: 'patagonia-10',
    brand: 'Patagonia Worn Wear',
    title: '10% Off Recycled Gear',
    description: 'Save 10% on pre-owned items.',
    points_cost: 50,
    category: 'Circular',
    badge: 'Popular',
    partner_url: 'https://wornwear.patagonia.com',
    is_unlocked: true,
    is_redeemed: false,
    progress_percent: 100,
  };

  it('renders unlocked offer and calls onRedeem when clicked', () => {
    const onRedeem = vi.fn();
    const onViewCode = vi.fn();

    render(
      <OfferCard
        offer={mockOffer}
        currentPoints={60}
        onRedeem={onRedeem}
        onViewCode={onViewCode}
        isRedeeming={false}
      />
    );

    expect(screen.getByText('Patagonia Worn Wear')).toBeInTheDocument();
    expect(screen.getByText('50 EcoPoints')).toBeInTheDocument();
    const redeemButton = screen.getByRole('button', { name: /Redeem Now/i });
    expect(redeemButton).toBeInTheDocument();

    fireEvent.click(redeemButton);
    expect(onRedeem).toHaveBeenCalledWith(mockOffer);
  });

  it('renders locked status when points are insufficient', () => {
    const lockedOffer: Offer = {
      ...mockOffer,
      is_unlocked: false,
      progress_percent: 50,
    };

    render(
      <OfferCard
        offer={lockedOffer}
        currentPoints={25}
        onRedeem={vi.fn()}
        onViewCode={vi.fn()}
        isRedeeming={false}
      />
    );

    expect(screen.getByText('Locked')).toBeInTheDocument();
    expect(screen.getByText('25 pts needed')).toBeInTheDocument();
  });
});

describe('TabNavigation Component', () => {
  it('calls onChangeTab with selected tab', () => {
    const onChangeTab = vi.fn();
    render(
      <TabNavigation
        activeTab="scan"
        onChangeTab={onChangeTab}
        unlockedOffersCount={2}
      />
    );

    const redeemTab = screen.getByText('Redeem Offers');
    fireEvent.click(redeemTab);
    expect(onChangeTab).toHaveBeenCalledWith('redeem');
  });
});

describe('LandingPage Component (Dual-Mode Selector)', () => {
  it('renders dual-mode options and triggers mode selection callbacks', () => {
    const onSelectTest = vi.fn();
    const onSelectProd = vi.fn();

    render(
      <LandingPage
        onSelectTestMode={onSelectTest}
        onSelectProdMode={onSelectProd}
        isAzure={false}
        dbMode="mongodb_cluster"
      />
    );

    expect(screen.getByText('Test Build')).toBeInTheDocument();
    expect(screen.getByText('Production Build')).toBeInTheDocument();

    const testBtn = screen.getByRole('button', { name: /Launch Test Build/i });
    fireEvent.click(testBtn);
    expect(onSelectTest).toHaveBeenCalledTimes(1);

    const prodBtn = screen.getByRole('button', { name: /Launch Production Build/i });
    fireEvent.click(prodBtn);
    expect(onSelectProd).toHaveBeenCalledTimes(1);
  });
});

describe('ProductionApp Component (Auth Security & No Mock Bypasses)', () => {
  it('renders Clerk configuration notice when unconfigured and prevents email bypass', () => {
    const onBack = vi.fn();
    const onSwitch = vi.fn();

    render(
      <ProductionApp
        onBackToLanding={onBack}
        onSwitchToTestBuild={onSwitch}
      />
    );

    // Shows security guidance
    expect(screen.getByText(/Clerk Configuration Required/i)).toBeInTheDocument();

    // Verifies that NO Alice/Bob demo account buttons or mock email forms exist
    expect(screen.queryByText(/Alice Sustainable/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Bob Eco/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/name@example.com/i)).not.toBeInTheDocument();

    // Verifies action buttons
    const testModeBtn = screen.getByRole('button', { name: /Launch Test Build/i });
    fireEvent.click(testModeBtn);
    expect(onSwitch).toHaveBeenCalledTimes(1);
  });
});
