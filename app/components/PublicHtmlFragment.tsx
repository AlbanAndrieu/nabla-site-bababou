import {
  type HtmlExtractMode,
  loadPublicHtmlFragment,
  removeLegacyElementsById,
  type SiteLocale,
} from "@/lib/htmlFromPublic";

type Props = Readonly<{
  file: string;
  mode: HtmlExtractMode;
  locale: SiteLocale;
  className?: string;
  suppressHydrationWarning?: boolean;
  omitElementIds?: readonly string[];
}>;

/**
 * Transitional boundary for explicitly allow-listed legacy HTML.
 *
 * Files containing family content must pass the repository privacy review
 * before they are added to lib/htmlFromPublic.ts and rendered here.
 */
export default async function PublicHtmlFragment({
  file,
  mode,
  locale,
  className,
  suppressHydrationWarning = false,
  omitElementIds = [],
}: Props) {
  let html = await loadPublicHtmlFragment(file, mode, locale);
  if (omitElementIds.length > 0) {
    html = removeLegacyElementsById(html, omitElementIds);
  }

  return (
    <div
      className={className}
      suppressHydrationWarning={suppressHydrationWarning}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
