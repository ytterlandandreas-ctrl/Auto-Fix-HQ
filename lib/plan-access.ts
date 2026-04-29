/**
 * Single source of truth for plan tier feature access.
 * Edit here to change packaging — no DB migration required.
 */

export type PlanTier = "free" | "starter" | "pro" | "enterprise";

export interface PlanLimits {
  maxUsers: number | null;       // null = unlimited
  maxLocations: number | null;
  maxROsPerMonth: number | null;
  maxCustomers: number | null;
}

export interface PlanFeatures {
  estimates: boolean;
  appointments: boolean;
  inventory: boolean;
  inspections: boolean | "basic" | "full";
  analytics: "none" | "basic" | "full";
  crmCampaigns: boolean;
  collision: boolean;
  smsCampaigns: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  addonsAvailable: boolean;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    maxUsers: 2,
    maxLocations: 1,
    maxROsPerMonth: 25,
    maxCustomers: 100,
  },
  starter: {
    maxUsers: 5,
    maxLocations: 1,
    maxROsPerMonth: null,
    maxCustomers: null,
  },
  pro: {
    maxUsers: 15,
    maxLocations: 3,
    maxROsPerMonth: null,
    maxCustomers: null,
  },
  enterprise: {
    maxUsers: null,
    maxLocations: null,
    maxROsPerMonth: null,
    maxCustomers: null,
  },
};

export const PLAN_FEATURES: Record<PlanTier, PlanFeatures> = {
  free: {
    estimates: false,
    appointments: false,
    inventory: false,
    inspections: false,
    analytics: "none",
    crmCampaigns: false,
    collision: false,
    smsCampaigns: false,
    apiAccess: false,
    prioritySupport: false,
    addonsAvailable: false,
  },
  starter: {
    estimates: true,
    appointments: true,
    inventory: false,
    inspections: "basic",
    analytics: "basic",
    crmCampaigns: false,
    collision: false,
    smsCampaigns: false,
    apiAccess: false,
    prioritySupport: false,
    addonsAvailable: true,
  },
  pro: {
    estimates: true,
    appointments: true,
    inventory: true,
    inspections: "full",
    analytics: "full",
    crmCampaigns: false,  // addon-gated
    collision: false,      // addon-gated
    smsCampaigns: false,   // addon-gated
    apiAccess: false,
    prioritySupport: false,
    addonsAvailable: true,
  },
  enterprise: {
    estimates: true,
    appointments: true,
    inventory: true,
    inspections: "full",
    analytics: "full",
    crmCampaigns: false,  // addon-gated
    collision: false,      // addon-gated
    smsCampaigns: false,   // addon-gated
    apiAccess: true,
    prioritySupport: true,
    addonsAvailable: true,
  },
};

export const PLAN_DISPLAY: Record<PlanTier, {
  name: string;
  price: number;
  priceLabel: string;
  description: string;
  color: string;
  badge: string;
  popular?: boolean;
}> = {
  free: {
    name: "Free",
    price: 0,
    priceLabel: "$0/mo",
    description: "Get started with the basics. Perfect for solo operators or trying things out.",
    color: "bg-slate-100 text-slate-600",
    badge: "slate",
  },
  starter: {
    name: "Starter",
    price: 149,
    priceLabel: "$149/mo",
    description: "Everything you need to run your shop day-to-day. Unlimited repair orders.",
    color: "bg-blue-100 text-blue-700",
    badge: "blue",
    popular: true,
  },
  pro: {
    name: "Pro",
    price: 249,
    priceLabel: "$249/mo",
    description: "Full feature access plus inventory management. Built for growing shops.",
    color: "bg-purple-100 text-purple-700",
    badge: "purple",
  },
  enterprise: {
    name: "Enterprise",
    price: 449,
    priceLabel: "$449/mo",
    description: "Unlimited users, locations, and API access. Priority support included.",
    color: "bg-amber-100 text-amber-700",
    badge: "amber",
  },
};

/** Quick lookup: tier → monthly price in dollars (mirrors PLAN_DISPLAY) */
export const TIER_DISPLAY_PRICES: Record<PlanTier, number> = {
  free: 0,
  starter: 149,
  pro: 249,
  enterprise: 449,
};

/** Feature rows shown on the pricing page */
export const PRICING_FEATURES = [
  { label: "Repair Orders / month", free: "25", starter: "Unlimited", pro: "Unlimited", enterprise: "Unlimited" },
  { label: "Team members", free: "2", starter: "5", pro: "15", enterprise: "Unlimited" },
  { label: "Locations", free: "1", starter: "1", pro: "3", enterprise: "Unlimited" },
  { label: "Customer database", free: "100 records", starter: "Unlimited", pro: "Unlimited", enterprise: "Unlimited" },
  { label: "Estimates & invoicing", free: false, starter: true, pro: true, enterprise: true },
  { label: "Appointments", free: false, starter: true, pro: true, enterprise: true },
  { label: "Digital inspections", free: false, starter: "Basic", pro: "Full (video + photos)", enterprise: "Full (video + photos)" },
  { label: "Inventory management", free: false, starter: false, pro: true, enterprise: true },
  { label: "Analytics & reporting", free: false, starter: "Basic", pro: "Full", enterprise: "Full" },
  { label: "Stripe customer payments", free: true, starter: true, pro: true, enterprise: true },
  { label: "Add-on modules", free: false, starter: true, pro: true, enterprise: true },
  { label: "API access", free: false, starter: false, pro: false, enterprise: true },
  { label: "Priority support", free: false, starter: false, pro: false, enterprise: true },
];
