import Image from "next/image";
import { getTranslations } from "next-intl/server";

type ContactHeroProps = {
  contactHref: string;
};

export default async function ContactHero({ contactHref }: ContactHeroProps) {
  const t = await getTranslations("contactPage.hero");

  return (
    <header className="contact-hero">
      <div className="hero-content">
        <Image
          src="https://avatars1.githubusercontent.com/u/7859836"
          width={150}
          height={150}
          alt={t("profileAlt")}
          className="contact-profile-image"
          loading="eager"
          unoptimized
        />
        <h1 className="hero-title">{t("title")}</h1>
        <p className="hero-subtitle">{t("subtitle")}</p>
        <p className="hero-description">{t("intro")}</p>
        <div className="cta-buttons">
          <a className="btn btn-light btn-lg" href={contactHref}>
            <i className="fas fa-envelope" aria-hidden="true" /> {t("contactCta")}
          </a>
        </div>
      </div>
    </header>
  );
}
