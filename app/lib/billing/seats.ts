export const SEAT_STATUS_ACTIVE = "active";
export const SEAT_STATUS_PENDING_PAYMENT = "pending_payment";
export const INCLUDED_FREE_SEATS = 1;

export type SeatStatus = typeof SEAT_STATUS_ACTIVE | typeof SEAT_STATUS_PENDING_PAYMENT;

export function billableSeatCount(occupiedOrNeeded: number) {
  return Math.max(0, Math.trunc(occupiedOrNeeded) - INCLUDED_FREE_SEATS);
}

export function parseSeatStatus(value: unknown): SeatStatus {
  return value === SEAT_STATUS_PENDING_PAYMENT
    ? SEAT_STATUS_PENDING_PAYMENT
    : SEAT_STATUS_ACTIVE;
}

export function isPendingPaymentSeat(status: unknown) {
  return parseSeatStatus(status) === SEAT_STATUS_PENDING_PAYMENT;
}

export type SeatCounts = {
  paidSeatCount: number;
  occupiedSeatCount: number;
  openSeatCount: number;
  pendingPaymentCount: number;
};

export function countOccupiedSeats(
  members: Array<{ seatStatus?: string | null }>,
) {
  return members.filter((member) => !isPendingPaymentSeat(member.seatStatus)).length;
}

export function countPendingPaymentSeats(
  members: Array<{ seatStatus?: string | null }>,
) {
  return members.filter((member) => isPendingPaymentSeat(member.seatStatus)).length;
}

export function resolveSeatCounts(input: {
  paidSeatCount: number;
  members: Array<{ seatStatus?: string | null }>;
}): SeatCounts {
  const paidSeatCount = Math.max(0, Math.trunc(input.paidSeatCount));
  const occupiedSeatCount = countOccupiedSeats(input.members);
  const pendingPaymentCount = countPendingPaymentSeats(input.members);
  const billableOccupied = billableSeatCount(occupiedSeatCount);
  return {
    paidSeatCount,
    occupiedSeatCount,
    pendingPaymentCount,
    openSeatCount: Math.max(0, paidSeatCount - billableOccupied),
  };
}

export function nextInviteSeatStatus(counts: Pick<SeatCounts, "openSeatCount">): SeatStatus {
  return counts.openSeatCount > 0 ? SEAT_STATUS_ACTIVE : SEAT_STATUS_PENDING_PAYMENT;
}

export function inviteRequiresPaidSeat(input: {
  paymentPlansEnabled: boolean;
  isFreePlan: boolean;
  isTrialActive: boolean;
  paidSeatCount: number;
  members: Array<{ seatStatus?: string | null }>;
}): boolean {
  if (!input.paymentPlansEnabled || input.isFreePlan || input.isTrialActive) {
    return false;
  }
  return (
    resolveSeatCounts({
      paidSeatCount: input.paidSeatCount,
      members: input.members,
    }).openSeatCount <= 0
  );
}

export function renewalSeatQuantity(
  occupiedSeatCount: number,
  currentQuantity: number,
) {
  const billable = billableSeatCount(occupiedSeatCount);
  const current = Math.max(0, Math.trunc(currentQuantity));
  if (billable >= current) return current;
  return billable;
}

export function eurosToCents(euros: number) {
  return Math.round(euros * 100);
}

export function estimateProrataEuros(input: {
  pricePerSeat: number;
  seatCount: number;
  periodEndMs: number | null;
  nowMs?: number;
}) {
  if (input.seatCount <= 0 || input.pricePerSeat <= 0 || !input.periodEndMs) {
    return 0;
  }
  const now = input.nowMs ?? Date.now();
  const remainingMs = Math.max(0, input.periodEndMs - now);
  const monthMs = 30 * 24 * 60 * 60 * 1000;
  const fraction = Math.min(1, remainingMs / monthMs);
  return Math.round(input.pricePerSeat * input.seatCount * fraction * 100) / 100;
}
