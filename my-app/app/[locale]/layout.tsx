import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

type Props = Readonly<{
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}>;

export function generateStaticParams() {
	return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Omit<Props, "children">) {
	const { locale } = await params;

	if (!hasLocale(routing.locales, locale)) {
		notFound();
	}

	const t = await getTranslations({ locale, namespace: "Metadata" });

	return {
		title: t("title"),
		description: t("description"),
	} satisfies Metadata;
}

export default async function LocaleLayout({ children, params }: Props) {
	const { locale } = await params;

	if (!hasLocale(routing.locales, locale)) {
		notFound();
	}

	setRequestLocale(locale);

	const messages = (await import(`../../messages/${locale}.json`)).default;

	return (
		<NextIntlClientProvider locale={locale} messages={messages}>
			{children}
			<Analytics />
			<SpeedInsights />
		</NextIntlClientProvider>
	);
}
