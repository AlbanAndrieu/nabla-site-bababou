import Icon from "@/components/ui/Icon";
import BackToTopButton from "@/components/BackToTopButton";
import SiteDisplayControls from "@/components/SiteDisplayControls";
import ActionLink, { actionClassName } from "@/components/ui/ActionLink";
import type { AppLocale } from "@/i18n/routing";
import { isHomeCutoverEnabled } from "@/lib/homeCutoverPolicy.mjs";
import { canonicalPagePath, releasedHomepagePath } from "@/lib/sitePageCatalog";
import styles from "./Footer.module.css";

type FooterProps = {
  backHome: string;
  backToTop: string;
  backToTopAria: string;
  contactLabel: string;
  navigationAriaLabel: string;
  copyright: string;
  legalNotices: string;
  locale: AppLocale;
};

export default function Footer({
  backHome,
  backToTop,
  backToTopAria,
  contactLabel,
  navigationAriaLabel,
  copyright,
  legalNotices,
  locale,
}: FooterProps) {
  // On the approved release, preserve the reader\'s locale when returning home.
  const homeHref = isHomeCutoverEnabled()
    ? releasedHomepagePath(locale)
    : canonicalPagePath("index", locale);
  const contactHref = canonicalPagePath("contact", locale);

  return (
    <footer className={`${styles.root} footer`} role="contentinfo">
      <div className={`${styles.socialLinks} social-links`}>
        <a
          href={contactHref}
          className={`${styles.socialLink} social-link`}
          aria-label={contactLabel}
        >
          <Icon name="mail" />
          <span className={styles.screenReaderOnly}>{contactLabel}</span>
        </a>
        <a
          href="https://calendly.com/alban-andrieu"
          className={`${styles.socialLink} social-link`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Calendly"
        >
          <Icon name="calendar-plus" />
          <span className={styles.screenReaderOnly}>Calendly</span>
        </a>
        <a
          href="https://github.com/AlbanAndrieu/nabla-site-bababou"
          className={`${styles.socialLink} social-link`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
        >
          <Icon name="github" />
          <span className={styles.screenReaderOnly}>GitHub</span>
        </a>
      </div>
      <div className={`${styles.links} footer-links`}>
        <a href="/policy/legal">{legalNotices}</a>
      </div>
      <nav className={styles.actions} aria-label={navigationAriaLabel}>
        <ActionLink href={homeHref}>
          <Icon name="home" />
          <span>{backHome}</span>
        </ActionLink>
        <BackToTopButton
          label={backToTop}
          ariaLabel={backToTopAria}
          className={actionClassName("secondary")}
        />
      </nav>
      <SiteDisplayControls />
      <p className={`${styles.copyright} footer-copyright`}>{copyright}</p>
    </footer>
  );
}
