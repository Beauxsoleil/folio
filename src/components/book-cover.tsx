"use client";

import { useState } from "react";
import { coverPalette, cx } from "@/lib/utils";

/**
 * Open Library serves S/M/L variants of the same art. Let the browser pick
 * the ~180px medium file for small grid cells / spines instead of always
 * downloading the large one — identical pixels where it matters.
 */
function openLibrarySrcSet(url: string): string | undefined {
  if (!url.includes("covers.openlibrary.org")) return undefined;
  const m = url.replace(/-L\.jpg(\?.*)?$/i, "-M.jpg");
  if (m === url) return undefined;
  return `${m} 180w, ${url} 800w`;
}

/**
 * Book cover with official art; falls back to a generated typographic cloth
 * binding when a title has no cover image.
 */
export function BookCover({
  title,
  author,
  coverUrl,
  className,
  sizes,
}: {
  title: string;
  author: string;
  coverUrl: string | null;
  className?: string;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!coverUrl || failed) {
    const [deep, mid, foil] = coverPalette(title);
    return (
      <div
        className={cx("relative flex flex-col justify-between overflow-hidden p-[9%]", className)}
        style={{
          background: `linear-gradient(155deg, ${mid} 0%, ${deep} 68%), ${deep}`,
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.22]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, rgba(255,255,255,0.09) 0 1px, transparent 1px 5px)",
          }}
        />
        <div className="h-[2px] w-1/3" style={{ background: foil }} />
        <p
          className="font-display text-[clamp(11px,1.4cqw,20px)] font-semibold leading-snug"
          style={{ color: foil, containerType: "inline-size" }}
        >
          {title}
        </p>
        <div>
          <div className="mb-1.5 h-px w-full opacity-50" style={{ background: foil }} />
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] opacity-80" style={{ color: foil }}>
            {author}
          </p>
        </div>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={coverUrl}
      srcSet={openLibrarySrcSet(coverUrl)}
      alt={`Cover of ${title}`}
      loading="lazy"
      decoding="async"
      sizes={sizes}
      onError={() => setFailed(true)}
      className={cx("object-cover", className)}
      draggable={false}
    />
  );
}
