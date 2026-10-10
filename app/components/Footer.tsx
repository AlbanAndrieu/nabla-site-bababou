import BackToTopButton from "@/components/BackToTopButton";
import ActionLink, { actionClassName } from "@/components/ui/ActionLink";
import type { AppLocale } from "@/i18n/routing";
import { canonicalPagePath } from "@/lib/sitePageCatalog";
import styles from "./Footer.module.css";

type FooterProps = {
  backHome: string;
  backToTop: string;
  backToTopAria: string;
  contactLabel: string;
  navigationAriaLabel: string;
  copyright: string;
  eleonoreRssFeedAria: string;
  legalNotices: string;
  locale: AppLocale;
  rssFeedAria: string;
};

export default function Footer({
  backHome,
  backToTop,
  backToTopAria,
  contactLabel,
  navigationAriaLabel,
  copyright,
  eleonoreRssFeedAria,
  legalNotices,
  locale,
  rssFeedAria,
}: FooterProps) {
  const homeHref = canonicalPagePath("index", locale);
  const contactHref = canonicalPagePath("contact", locale);

  return (
    <footer className={`${styles.root} footer`} role="contentinfo">
      <div className={`${styles.socialLinks} social-links`}>
        <a
          href={contactHref}
          className={`${styles.socialLink} social-link`}
          aria-label={contactLabel}
        >
          <i className="fas fa-envelope" aria-hidden="true" />
          <span className={styles.screenReaderOnly}>{contactLabel}</span>
        </a>
        <a
          href="/feed.xml"
          className={`${styles.socialLink} social-link`}
          aria-label={rssFeedAria}
        >
          <i className="fa fa-rss" aria-hidden="true" />
          <span className={styles.screenReaderOnly}>{rssFeedAria}</span>
          <span className={styles.screenReaderOnly}>{eleonoreRssFeedAria}</span>
        </a>
        <a
          href="/eleonore-feed.xml"
          className={`${styles.socialLink} social-link`}
          aria-label={eleonoreRssFeedAria}
        >
          <i className="fa fa-rss" aria-hidden="true" />
        </a>
      </div>
      <div className={`${styles.links} footer-links`}>
        <a href="/policy/legal">{legalNotices}</a>
      </div>
      <nav className={styles.actions} aria-label={navigationAriaLabel}>
        <ActionLink href={homeHref}>
          <i className="fas fa-home" aria-hidden="true" />
          <span>{backHome}</span>
        </ActionLink>
        <BackToTopButton
          label={backToTop}
          ariaLabel={backToTopAria}
          className={actionClassName("secondary")}
        />
      </nav>
      <p className={`${styles.copyright} footer-copyright`}>{copyright}</p>
    </footer>
  );
}
