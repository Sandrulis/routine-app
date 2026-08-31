"use client";

/* eslint-disable @next/next/no-img-element */

import { Fragment, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "@/app/components/translations-provider";
import { applyDocsPlaceholders, renderDocsPlaceholders } from "@/app/lib/docs/placeholders";
import { docsImageIdFromSrc } from "@/app/lib/docs/images";
import { youtubeEmbedUrl, youtubeIdFromText } from "@/app/lib/docs/youtube";

type CodeBlock = {
  language: string;
  filename: string | null;
  code: string;
};

type Block =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "code"; block: CodeBlock }
  | { type: "youtube"; videoId: string }
  | { type: "quote"; text: string }
  | { type: "image"; alt: string; src: string };

function parseInfoString(info: string): { language: string; filename: string | null } {
  const trimmed = info.trim();
  if (!trimmed) return { language: "", filename: null };
  const filenameMatch = trimmed.match(/(?:filename|title)\s*=\s*"([^"]+)"/i);
  if (filenameMatch) {
    return {
      language: trimmed.split(/\s+/)[0]?.replace(/[^a-z0-9_+-]/gi, "") ?? "",
      filename: filenameMatch[1],
    };
  }
  const colon = trimmed.match(/^([a-z0-9_+-]+):(.+)$/i);
  if (colon) {
    return { language: colon[1], filename: colon[2].trim() };
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2 && /\.[\w]+$/.test(parts[1])) {
    return { language: parts[0], filename: parts[1] };
  }
  return { language: parts[0] ?? "", filename: null };
}

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const info = parseInfoString(line.slice(3));
      const body: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith("```")) {
        body.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push({
        type: "code",
        block: { language: info.language, filename: info.filename, code: body.join("\n") },
      });
      continue;
    }

    const youtubeId = youtubeIdFromText(line);
    if (youtubeId && line.trim() === line.trim().match(/\S+/)?.[0]) {
      blocks.push({ type: "youtube", videoId: youtubeId });
      index += 1;
      continue;
    }

    const imageLine = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageLine) {
      blocks.push({ type: "image", alt: imageLine[1], src: imageLine[2] });
      index += 1;
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      blocks.push({
        type: "heading",
        level: heading[1].length as 1 | 2 | 3,
        text: heading[2].trim(),
      });
      index += 1;
      continue;
    }

    if (line.startsWith("> ")) {
      const quote: string[] = [];
      while (index < lines.length && lines[index].startsWith("> ")) {
        quote.push(lines[index].slice(2));
        index += 1;
      }
      blocks.push({ type: "quote", text: quote.join("\n") });
      continue;
    }

    const unordered = line.match(/^[-*]\s+/);
    const ordered = line.match(/^\d+\.\s+/);
    if (unordered || ordered) {
      const items: string[] = [];
      const isOrdered = Boolean(ordered);
      while (index < lines.length) {
        const current = lines[index];
        const match = isOrdered ? current.match(/^\d+\.\s+(.+)$/) : current.match(/^[-*]\s+(.+)$/);
        if (!match) break;
        items.push(match[1]);
        index += 1;
      }
      blocks.push({ type: "list", ordered: isOrdered, items });
      continue;
    }

    const paragraph: string[] = [];
    while (index < lines.length && lines[index].trim()) {
      const current = lines[index];
      if (
        current.startsWith("```") ||
        current.startsWith("#") ||
        current.startsWith("> ") ||
        /^[-*]\s+/.test(current) ||
        /^\d+\.\s+/.test(current) ||
        /^!\[[^\]]*\]\([^)]+\)$/.test(current.trim())
      ) {
        break;
      }
      paragraph.push(current);
      index += 1;
    }
    blocks.push({ type: "paragraph", text: paragraph.join("\n") });
  }

  return blocks;
}

function safeHref(raw: string): string | null {
  const href = raw.trim();
  if (/^https?:\/\//i.test(href) || href.startsWith("mailto:")) return href;
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  return null;
}

function safeImageSrc(raw: string, overrides?: Record<string, string>): string | null {
  const src = raw.trim();
  const imageId = docsImageIdFromSrc(src);
  if (imageId) return overrides?.[imageId] ?? src;
  if (/^https:\/\//i.test(src)) return src;
  return null;
}

function DocsImage({
  src,
  alt,
  dark,
  overrides,
}: {
  src: string;
  alt: string;
  dark: boolean;
  overrides?: Record<string, string>;
}) {
  const { t } = useTranslations();
  const [open, setOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const resolved = safeImageSrc(src, overrides);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setZoomed(false);
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!resolved) return null;

  const enlargeLabel = t("docs.image.enlarge", "Pietuvināt attēlu");
  const closeLabel = t("actions.close", "Aizvērt");
  const frameClassName = dark
    ? "border-zinc-800 bg-zinc-900"
    : "border-zinc-200 bg-white";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={enlargeLabel}
        className="mx-auto block w-1/2 cursor-zoom-in rounded-xl border-0 bg-transparent p-0"
      >
        <img
          src={resolved}
          alt={alt}
          className={`block h-auto w-full rounded-xl border ${frameClassName}`}
        />
      </button>
      {mounted && open
        ? createPortal(
            <div
              className="fixed inset-0 z-[80] flex items-center justify-center bg-zinc-950/80 p-4"
              role="dialog"
              aria-modal="true"
              aria-label={alt.trim() || enlargeLabel}
              onClick={() => setOpen(false)}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={closeLabel}
                className="absolute top-4 right-4 z-10 inline-flex size-10 items-center justify-center rounded-full bg-zinc-950/70 text-white transition hover:bg-zinc-950"
              >
                <i className="fas fa-times" aria-hidden="true" />
              </button>
              <div
                className={`max-h-full max-w-full overflow-auto ${zoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
                onClick={(event) => event.stopPropagation()}
              >
                <img
                  src={resolved}
                  alt={alt}
                  onClick={() => setZoomed((current) => !current)}
                  className={`rounded-xl border shadow-2xl ${frameClassName} ${
                    zoomed
                      ? "max-w-none"
                      : "max-h-[92vh] max-w-[min(92vw,72rem)] object-contain"
                  }`}
                />
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function renderInline(
  text: string,
  keyPrefix: string,
  dark: boolean,
  systemName: string,
  overrides?: Record<string, string>,
): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern =
    /(!\[[^\]]*\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let part = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) {
      nodes.push(
        <Fragment key={`${keyPrefix}-t${part++}`}>
          {renderDocsPlaceholders(text.slice(last, match.index), systemName)}
        </Fragment>,
      );
    }
    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push(
        <strong key={`${keyPrefix}-b${part++}`}>
          {renderDocsPlaceholders(token.slice(2, -2), systemName)}
        </strong>,
      );
    } else if (token.startsWith("*")) {
      nodes.push(
        <em key={`${keyPrefix}-i${part++}`}>
          {renderDocsPlaceholders(token.slice(1, -1), systemName)}
        </em>,
      );
    } else if (token.startsWith("`")) {
        nodes.push(
        <code
          key={`${keyPrefix}-c${part++}`}
          className={
            dark
              ? "rounded bg-zinc-800/90 px-1.5 py-0.5 font-mono text-[0.85em] text-amber-200"
              : "rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[0.85em] text-zinc-800"
          }
        >
          {applyDocsPlaceholders(token.slice(1, -1), systemName)}
        </code>,
      );
    } else if (token.startsWith("![")) {
      const image = token.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      nodes.push(
        <DocsImage
          key={`${keyPrefix}-img${part++}`}
          alt={applyDocsPlaceholders(image?.[1] ?? "", systemName)}
          src={image?.[2] ?? ""}
          dark={dark}
          overrides={overrides}
        />,
      );
    } else {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      const href = link ? safeHref(link[2]) : null;
      if (link && href) {
        nodes.push(
          <a
            key={`${keyPrefix}-a${part++}`}
            href={href}
            className={
              dark
                ? "text-orange-300 underline decoration-orange-400/70 underline-offset-2 hover:text-orange-200"
                : "text-sky-700 underline decoration-sky-700/40 underline-offset-2 hover:text-sky-800"
            }
            rel={href.startsWith("http") ? "noreferrer" : undefined}
            target={href.startsWith("http") ? "_blank" : undefined}
          >
            {renderDocsPlaceholders(link[1], systemName)}
          </a>,
        );
      } else {
        nodes.push(
          <Fragment key={`${keyPrefix}-r${part++}`}>
            {renderDocsPlaceholders(token, systemName)}
          </Fragment>,
        );
      }
    }
    last = match.index + token.length;
  }
  if (last < text.length) {
    nodes.push(
      <Fragment key={`${keyPrefix}-e`}>
        {renderDocsPlaceholders(text.slice(last), systemName)}
      </Fragment>,
    );
  }
  return nodes;
}

function CodeBlockView({
  block,
  dark,
  systemName,
}: {
  block: CodeBlock;
  dark: boolean;
  systemName: string;
}) {
  const { t } = useTranslations();
  const [copied, setCopied] = useState(false);
  const code = applyDocsPlaceholders(block.code, systemName);
  const lines = code.length ? code.split("\n") : [""];

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      className={`overflow-hidden rounded-xl border ${
        dark ? "border-zinc-800 bg-zinc-900" : "border-zinc-200 bg-white"
      }`}
    >
      <div
        className={`flex items-center justify-between gap-3 border-b px-4 py-2 ${
          dark ? "border-zinc-800" : "border-zinc-200"
        }`}
      >
        <span
          className={`truncate font-mono text-xs ${
            dark ? "text-zinc-400" : "text-zinc-500"
          }`}
        >
          {block.filename || block.language || "code"}
        </span>
        <button
          type="button"
          onClick={() => void copy()}
          className={
            dark
              ? "inline-flex size-7 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
              : "inline-flex size-7 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-800"
          }
          aria-label={t("docs.copy_code", "Kopēt kodu")}
        >
          <i className={`fas ${copied ? "fa-check" : "fa-copy"} text-[11px]`} aria-hidden="true" />
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-6">
        <code className={`block font-mono ${dark ? "text-zinc-100" : "text-zinc-800"}`}>
          {lines.map((line, lineIndex) => (
            <span key={lineIndex} className="flex">
              <span
                className={`w-8 shrink-0 select-none pr-4 text-right ${
                  dark ? "text-zinc-600" : "text-zinc-300"
                }`}
              >
                {lineIndex + 1}
              </span>
              <span className="min-w-0 whitespace-pre">{line || " "}</span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

export function DocsMarkdown({
  content,
  variant = "light",
  imageSrcOverrides,
}: {
  content: string;
  variant?: "dark" | "light";
  imageSrcOverrides?: Record<string, string>;
}) {
  const { systemName } = useTranslations();
  const blocks = parseBlocks(content);
  if (blocks.length === 0) return null;
  const dark = variant === "dark";

  return (
    <div
      className={`space-y-5 text-[15px] leading-7 ${
        dark ? "text-zinc-300" : "text-zinc-600"
      }`}
    >
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const headingColor = dark ? "text-white" : "text-zinc-900";
          const className =
            block.level === 1
              ? `text-3xl font-semibold tracking-tight ${headingColor}`
              : block.level === 2
                ? `text-xl font-semibold ${headingColor}`
                : `text-lg font-medium ${headingColor}`;
          const Tag = (`h${block.level}` as "h1" | "h2" | "h3");
          return (
            <Tag key={index} className={className}>
              {renderInline(block.text, `h${index}`, dark, systemName, imageSrcOverrides)}
            </Tag>
          );
        }
        if (block.type === "paragraph") {
          return (
            <p key={index}>
              {renderInline(block.text, `p${index}`, dark, systemName, imageSrcOverrides)}
            </p>
          );
        }
        if (block.type === "quote") {
          return (
            <blockquote
              key={index}
              className={
                dark
                  ? "border-l-2 border-zinc-600 pl-4 text-zinc-400"
                  : "border-l-2 border-zinc-200 pl-4 text-zinc-500"
              }
            >
              {renderInline(block.text, `q${index}`, dark, systemName, imageSrcOverrides)}
            </blockquote>
          );
        }
        if (block.type === "list") {
          const Tag = block.ordered ? "ol" : "ul";
          return (
            <Tag
              key={index}
              className={
                block.ordered
                  ? "list-decimal space-y-1 pl-5"
                  : "list-disc space-y-1 pl-5"
              }
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>
                  {renderInline(item, `l${index}-${itemIndex}`, dark, systemName, imageSrcOverrides)}
                </li>
              ))}
            </Tag>
          );
        }
        if (block.type === "code") {
          return <CodeBlockView key={index} block={block.block} dark={dark} systemName={systemName} />;
        }
        if (block.type === "image") {
          return (
            <DocsImage
              key={index}
              alt={applyDocsPlaceholders(block.alt, systemName)}
              src={block.src}
              dark={dark}
              overrides={imageSrcOverrides}
            />
          );
        }
        return (
          <div
            key={index}
            className={`overflow-hidden rounded-xl border ${
              dark ? "border-zinc-800 bg-zinc-900" : "border-zinc-200 bg-white"
            }`}
          >
            <div className="aspect-video">
              <iframe
                src={youtubeEmbedUrl(block.videoId)}
                title="YouTube"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="size-full"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
