"use client";

import { useEffect, useState } from "react";
import {
  LIST_FILES_CHANGED_EVENT,
  readAllListFiles,
  type ListFile,
} from "@/app/lib/list-files";

export function useListFiles(): { files: ListFile[]; isReady: boolean } {
  const [files, setFiles] = useState<ListFile[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    function refresh() {
      setFiles(readAllListFiles());
      setIsReady(true);
    }

    refresh();
    window.addEventListener(LIST_FILES_CHANGED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(LIST_FILES_CHANGED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return { files, isReady };
}
