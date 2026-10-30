"use client";

import { useState } from "react";
import Image from "next/image";

import styles from "./LegacyStoryGallerySection.module.css";

/**
 * Keep gallery layout stable when an older public asset is unavailable.
 * This only changes the local display; there are no network retries.
 */
export default function GalleryCardMedia({ image }: { image: string | null }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={styles.media}>
      {image && !failed ? (
        <Image
          src={image}
          alt=""
          width={800}
          height={460}
          sizes="(max-width: 40rem) 100vw, (max-width: 64rem) 50vw, 33vw"
          // All ten assets are already approved public files. Serve the
          // originals directly instead of routing through /_next/image,
          // which adds an unnecessary proxy and can obscure image failures.
          unoptimized
          className={styles.image}
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          className={styles.fallback}
          data-gallery-media-fallback={image ? "error" : "placeholder"}
          aria-hidden="true"
        >
          ♥
        </span>
      )}
    </div>
  );
}
