"use client";

import dynamic from "next/dynamic";
import { OverlayLoadingState } from "@/app/components/loading-state";

export const SubtaskDetailModalLazy = dynamic(
  () =>
    import("@/app/components/subtask-detail-modal").then((mod) => ({
      default: mod.SubtaskDetailModal,
    })),
  { loading: OverlayLoadingState },
);

export const ListFormModalLazy = dynamic(
  () =>
    import("@/app/components/list-form-modal").then((mod) => ({
      default: mod.ListFormModal,
    })),
  { loading: OverlayLoadingState },
);
