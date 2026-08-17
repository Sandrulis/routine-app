"use client";

import { useEffect, useState } from "react";
import {
  LIST_FILES_CHANGED_EVENT,
  readAllListFiles,
  type ListFile,
} from "@/app/lib/list-files";

export function useListFiles(): ListFile[] {
  const [files, setFiles] = useState<ListFile[]>([]);

  useEffect(() => {
    function refresh() {
      setFiles(readAllListFiles());
    }

    refresh();
    window.addEventListener(LIST_FILES_CHANGED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(LIST_FILES_CHANGED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return files;
}
