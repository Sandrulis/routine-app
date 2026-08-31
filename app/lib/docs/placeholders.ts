import { createElement, Fragment, type ReactNode } from "react";
import { SYSTEM_NAME_PARAM } from "@/app/lib/document-title";
import { interpolate, withSystemNameParams } from "@/app/lib/i18n/interpolate";

export const DOCS_SYSTEM_NAME_PLACEHOLDER = `{${SYSTEM_NAME_PARAM}}`;

export function formatDocsSystemName(systemName: string): string {
  return systemName.trim().toLocaleUpperCase();
}

export function applyDocsPlaceholders(text: string, systemName: string): string {
  return interpolate(text, withSystemNameParams(formatDocsSystemName(systemName)));
}

export function renderDocsPlaceholders(text: string, systemName: string): ReactNode {
  const name = formatDocsSystemName(systemName);
  if (!text.includes(DOCS_SYSTEM_NAME_PLACEHOLDER)) return text;
  const parts = text.split(DOCS_SYSTEM_NAME_PLACEHOLDER);
  return parts.map((part, index) =>
    createElement(
      Fragment,
      { key: index },
      part,
      index < parts.length - 1
        ? createElement("strong", { className: "font-bold uppercase" }, name)
        : null,
    ),
  );
}
