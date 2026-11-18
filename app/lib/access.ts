import { PLANS } from "@/app/lib/plans";

// Founders / testers keep full access to all live banks, always.
export const FOUNDER_EMAILS = [
  "shreetama127@gmail.com",
  "anitalese@ymail.com",
  "zchasmu@ucl.ac.uk",
];

// Length of the free trial every new account gets, in hours.
export const TRIAL_HOURS = 48;

// Every live (available) bank — what a trial grants access to.
export function allLivePlanIds(): string[] {
  return PLANS.filter((p) => p.live).map((p) => p.id);
}

export function isFounder(email: string | null | undefined): boolean {
  return !!email && FOUNDER_EMAILS.includes(email.toLowerCase());
}

export function trialActive(createdAt: string | null | undefined): boolean {
  if (!createdAt) return false;
  const elapsed = Date.now() - new Date(createdAt).getTime();
  return elapsed >= 0 && elapsed < TRIAL_HOURS * 60 * 60 * 1000;
}

export function trialHoursLeft(createdAt: string | null | undefined): number {
  if (!createdAt) return 0;
  const remaining = TRIAL_HOURS * 60 * 60 * 1000 - (Date.now() - new Date(createdAt).getTime());
  return Math.max(0, Math.ceil(remaining / (60 * 60 * 1000)));
}

// The plan ids a user can access right now: anything they've paid for,
// plus (during their 48-hour trial, or if they're a founder) all live banks.
export function accessiblePlanIds(params: {
  email?: string | null;
  createdAt?: string | null;
  ownedPlanIds: string[];
}): string[] {
  const { email, createdAt, ownedPlanIds } = params;
  if (isFounder(email) || trialActive(createdAt)) {
    return [...new Set([...ownedPlanIds, ...allLivePlanIds()])];
  }
  return [...new Set(ownedPlanIds)];
}

// Backwards-compatible: older pages still call plansForUser(email, FREE_PLAN_IDS).
// Nothing is permanently free now, but founders still get all live banks.
export function plansForUser(email: string | null | undefined, publicFreeIds: string[]): string[] {
  const ids = [...publicFreeIds];
  if (isFounder(email)) ids.push(...allLivePlanIds());
  return [...new Set(ids)];
}