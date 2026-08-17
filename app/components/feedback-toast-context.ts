"use client";

import { createContext, useContext } from "react";
import type { FeedbackType } from "@/app/components/feedback-toast";

export type FeedbackToastContextValue = {
  showFeedback: (message: { type: FeedbackType; text: string }) => void;
  clearFeedback: () => void;
};

export const FeedbackToastContext =
  createContext<FeedbackToastContextValue | null>(null);

export function useFeedbackToast() {
  const context = useContext(FeedbackToastContext);

  if (!context) {
    throw new Error(
      "useFeedbackToast must be used within FeedbackToastProvider",
    );
  }

  return context;
}
