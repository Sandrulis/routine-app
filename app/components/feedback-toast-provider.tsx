"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  FeedbackToast,
  type FeedbackMessage,
} from "@/app/components/feedback-toast";
import { FeedbackToastContext } from "@/app/components/feedback-toast-context";

export { useFeedbackToast } from "@/app/components/feedback-toast-context";

export function FeedbackToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<FeedbackMessage | null>(null);

  const showFeedback = useCallback(
    (nextMessage: { type: FeedbackMessage["type"]; text: string }) => {
      setMessage(nextMessage);
    },
    [],
  );

  const clearFeedback = useCallback(() => {
    setMessage(null);
  }, []);

  const value = useMemo(
    () => ({ showFeedback, clearFeedback }),
    [showFeedback, clearFeedback],
  );

  return (
    <FeedbackToastContext.Provider value={value}>
      {children}
      <FeedbackToast message={message} onDismiss={clearFeedback} />
    </FeedbackToastContext.Provider>
  );
}
