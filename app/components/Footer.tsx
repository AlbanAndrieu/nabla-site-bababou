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
  copyright: string;
  legalNotices: string;
  locale: AppLocale;
  rssFeedAria: string;
};

export default function Footer({
  backHome,
  backToTop,
  backToTopAria,
  contactLabel,
  copyright,
  legalNotices,
  locale,
  rssFeedAria,
}: FooterProps) {
  const homeHref = canonicalPagePath("index", locale);
  const contactHref = canonicalPagePath("contact", locale);

  return (
    <footer className="footer text-center" role="contentinfo">
      <div className="social-links">
        <a href={contactHref} className="social-link" aria-label={contactLabel}>
          <i className="fas fa-envelope" aria-hidden="true"></i>
        </a>
        <a href="/feed.xml" className="social-link" aria-label={rssFeedAria}>
          <i className="fa fa-rss" aria-hidden="true"></i>
        </a>
      </div>
      <div className="footer-links text-center">
        <a href="/policy/legal">{legalNotices}</a>
      </div>
      <nav className={styles.actions} aria-label="Footer navigation">
        <ActionLink href={homeHref}>
          <i className="fas fa-home" aria-hidden="true"></i>
          <span>{backHome}</span>
        </ActionLink>
        <BackToTopButton
          label={backToTop}
          ariaLabel={backToTopAria}
          className={actionClassName("secondary")}
        />
      </nav>
      <p className="footer-copyright text-center">{copyright}</p>
    </footer>
  );
}
