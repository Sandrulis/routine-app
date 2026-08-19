"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import {
  allowedExtensionsLabel,
  fileAcceptAttribute,
  filterAllowedFiles,
  getFileIconDisplay,
  getFileTypesCatalog,
  isAllowedFileName,
  mimeFromFileName,
  setFileTypesCatalog,
} from "@/app/lib/file-types";
import type { FileTypeExtensionSummary } from "@/app/lib/site-admin/types";

type FileTypesContextValue = {
  extensions: FileTypeExtensionSummary[];
  accept: string;
  extensionsLabel: string;
  isAllowedFileName: (name: string) => boolean;
  mimeFromFileName: (name: string) => string;
  getFileIconDisplay: (name: string) => { icon: string; color: string };
  filterAllowedFiles: (files: File[]) => { allowed: File[]; rejected: string[] };
};

const FileTypesContext = createContext<FileTypesContextValue | null>(null);

export function FileTypesProvider({
  extensions,
  children,
}: {
  extensions: FileTypeExtensionSummary[];
  children: ReactNode;
}) {
  useEffect(() => {
    setFileTypesCatalog(extensions);
  }, [extensions]);

  const value = useMemo<FileTypesContextValue>(
    () => ({
      extensions,
      accept: fileAcceptAttribute(extensions),
      extensionsLabel: allowedExtensionsLabel(extensions),
      isAllowedFileName: (name) => isAllowedFileName(name, extensions),
      mimeFromFileName: (name) => mimeFromFileName(name, extensions),
      getFileIconDisplay: (name) => getFileIconDisplay(name, extensions),
      filterAllowedFiles: (files) => filterAllowedFiles(files, extensions),
    }),
    [extensions],
  );

  return (
    <FileTypesContext.Provider value={value}>{children}</FileTypesContext.Provider>
  );
}

export function useFileTypes(): FileTypesContextValue {
  const context = useContext(FileTypesContext);
  const fallbackCatalog = getFileTypesCatalog();
  return (
    context ?? {
      extensions: fallbackCatalog,
      accept: fileAcceptAttribute(fallbackCatalog),
      extensionsLabel: allowedExtensionsLabel(fallbackCatalog),
      isAllowedFileName: (name) => isAllowedFileName(name, fallbackCatalog),
      mimeFromFileName: (name) => mimeFromFileName(name, fallbackCatalog),
      getFileIconDisplay: (name) => getFileIconDisplay(name, fallbackCatalog),
      filterAllowedFiles: (files) => filterAllowedFiles(files, fallbackCatalog),
    }
  );
}
