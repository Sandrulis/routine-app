"use client";

import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { useTranslations } from "@/app/components/translations-provider";
import type { LegalDocumentContent } from "@/app/lib/legal/documents";

export function LegalDocumentView({
  content,
  extra,
}: {
  content: LegalDocumentContent;
  extra?: ReactNode;
}) {
  const { t } = useTranslations();
  const [activeId, setActiveId] = useState(content.sections[0]?.id ?? "");

  const sectionIds = content.sections.map((section) => section.id).join(",");

  useEffect(() => {
    const ids = sectionIds.split(",").filter(Boolean);
    const hash = window.location.hash.replace("#", "");
    if (hash && ids.includes(hash)) {
      setActiveId(hash);
      requestAnimationFrame(() => {
        document.getElementById(hash)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }

    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => Boolean(element));

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-96px 0px -55% 0px", threshold: [0, 0.2, 0.5, 1] },
    );

    for (const element of elements) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [sectionIds]);

  function handleTocClick(event: MouseEvent<HTMLAnchorElement>, id: string) {
    event.preventDefault();
    setActiveId(id);
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    window.history.replaceState(null, "", `#${id}`);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-10 lg:flex-row lg:items-start">
        <aside className="sticky top-14 z-20 -mx-4 max-h-[min(40dvh,16rem)] overflow-y-auto border-b border-zinc-200 bg-zinc-50/95 px-4 py-3 backdrop-blur-sm lg:top-20 lg:z-auto lg:mx-0 lg:max-h-[calc(100dvh-6.5rem)] lg:w-64 lg:shrink-0 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
          <nav aria-label={t("legal.toc.label", "Saturs")}>
            <p className="mb-3 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
              {t("legal.toc.label", "Saturs")}
            </p>
            <ul className="flex flex-col gap-0.5">
              {content.sections.map((section) => {
                const active = activeId === section.id;
                return (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      onClick={(event) => handleTocClick(event, section.id)}
                      aria-current={active ? "location" : undefined}
                      className={`block rounded-lg px-3 py-2 text-sm leading-5 transition ${
                        active
                          ? "bg-zinc-100 font-medium text-zinc-900"
                          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                      }`}
                    >
                      {section.title}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        <article className="min-w-0 flex-1">
          <p className="text-sm text-zinc-500">
            {t("legal.nav.updated_at", "Atjaunināts {date}", {
              date: content.updatedAt,
            })}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
            {content.title}
          </h1>
          <p className="mt-4 text-base leading-7 text-zinc-600">{content.intro}</p>

          <div className="mt-10 space-y-10">
            {content.sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-24 space-y-3"
              >
                <h2 className="text-xl font-semibold text-zinc-900">
                  {section.title}
                </h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-7 text-zinc-600">
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}
          </div>

          {extra ? <div className="mt-10">{extra}</div> : null}
        </article>
      </div>
    </div>
  );
}
