import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "Bababou",
	description: "Bababou site — static content served via Next.js.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className="antialiased">
				<a className="skip-to-main" href="#main-content">
					Skip to main content
				</a>
				{children}
				<Analytics />
				<SpeedInsights />
			</body>
		</html>
	);
}
