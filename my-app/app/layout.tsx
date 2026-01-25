import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title:
		"Missing Child - Abducted daughter by her mother and moved from France to Norway then Germany",
	description:
		"My daughter was kidnapped by her Mother Rachael Brooke and moved from France to Norway then Germany.",
	keywords:
		"Father alban andrieu the mother brooke rachael child abuse abduction kidnapping france norway germany",
	authors: [{ name: "Alban Andrieu", email: "alban.andrieu@free.fr" }],
	openGraph: {
		type: "website",
		url: "https://bababou.albandrieu.com",
		title: "Alban Andrieu",
		description:
			"My daughter was kidnapped by her Mother Rachael Brooke and moved from France to Norway then Germany.",
		siteName: "Alban Andrieu",
		images: [
			{
				url: "https://bababou.albandrieu.com/nabla/assets/miss-and-love-you-quote.jpeg",
				alt: "Missing Child",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Éléonore - Your Father is Looking for You",
		description:
			"Éléonore (Bababou) - Your father Alban Andrieu is looking for you and will always be there for you. Contact: alban.andrieu@free.fr",
		images: [
			"https://bababou.albandrieu.com/nabla/assets/miss-and-love-you-quote.jpeg",
		],
	},
	robots: {
		index: true,
		follow: true,
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				{children}
				<Analytics />
				<SpeedInsights />
			</body>
		</html>
	);
}
