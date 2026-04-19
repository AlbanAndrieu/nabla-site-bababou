import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";

type PageProps = Readonly<{
	params: Promise<{ locale: string }>;
}>;

export default async function LocaleHomePage({ params }: PageProps) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) {
		notFound();
	}
	setRequestLocale(locale);
	const currentLocale = locale as AppLocale;
	const nextLocale = currentLocale === "en" ? "fr" : "en";
	const t = await getTranslations({ locale, namespace: "Home" });

	return (
		<div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-12 font-sans dark:bg-black">
			<main
				id="main-content"
				role="main"
				className="w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-10"
			>
				<div className="flex flex-col gap-6">
					<div className="flex items-center justify-between gap-4">
						<span className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
							{t("eyebrow")}
						</span>
						<div className="flex items-center gap-2">
							<label
								className="text-sm text-zinc-700 dark:text-zinc-300"
								htmlFor="language-switch"
							>
								{t("languageSwitcherLabel")}
							</label>
							<Link
								id="language-switch"
								locale={nextLocale}
								href="/"
								className="rounded-md border border-zinc-300 px-3 py-1 text-sm font-medium no-underline hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
							>
								{currentLocale === "en" ? t("languageFrench") : t("languageEnglish")}
							</Link>
						</div>
					</div>

					<h1 className="text-3xl font-semibold leading-tight tracking-tight text-zinc-950 dark:text-zinc-100 sm:text-4xl">
						{t("title")}
					</h1>
					<p className="text-lg leading-8 text-zinc-700 dark:text-zinc-300">
						{t("description")}
					</p>

					<div className="flex flex-col gap-3 sm:flex-row">
						<a
							href="mailto:contact@bababou.com"
							className="inline-flex h-11 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-semibold text-white no-underline transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
						>
							{t("ctaPrimary")}
						</a>
						<a
							href="https://bababou.com/policy/privacy_policy.html"
							className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-300 px-6 text-sm font-semibold no-underline transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
						>
							{t("ctaSecondary")}
						</a>
					</div>
				</div>
			</main>
		</div>
	);
}
