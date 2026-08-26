"use client";

import { createContext, useContext, type ReactNode } from "react";

type PaymentPlansContextValue = {
  enabled: boolean;
  freePlanIds: readonly string[];
};

const PaymentPlansContext = createContext<PaymentPlansContextValue>({
  enabled: false,
  freePlanIds: [],
});

export function PaymentPlansEnabledProvider({
  enabled,
  freePlanIds = [],
  children,
}: {
  enabled: boolean;
  freePlanIds?: readonly string[];
  children: ReactNode;
}) {
  return (
    <PaymentPlansContext.Provider value={{ enabled, freePlanIds }}>
      {children}
    </PaymentPlansContext.Provider>
  );
}

export function usePaymentPlansEnabled() {
  return useContext(PaymentPlansContext).enabled;
}

export function useFreePlanIds() {
  return useContext(PaymentPlansContext).freePlanIds;
}
