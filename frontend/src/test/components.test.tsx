import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Badge } from '../components/common/Badge';
import { StatCard } from '../components/common/StatCard';
import { GarmentCard } from '../components/Scanner/GarmentCard';
import { OfferCard } from '../components/Redeem/OfferCard';
import { TabNavigation } from '../components/TabNavigation';
import { GarmentItem, Offer } from '../types';

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
