import { notFound } from "next/navigation";

const translations = {
	fr: {
		title: "Page de test Next.js",
		message: "Ceci est un test du projet Next.js minimal localisé.",
		info: "Vous pouvez migrer vos anciennes pages ou ajouter du contenu ici.",
	},
	en: {
		title: "Next.js Test Page",
		message: "This is a test of a minimal, localized Next.js project.",
		info: "You can migrate legacy pages or add your own content here.",
	},
};

export default function TestPage({ params }: { params: { locale: string } }) {
	const locale = params?.locale;
	const t = translations[locale] || translations.fr;

	// Optionally, if locale isn't supported, show a 404
	if (!translations[locale]) {
		notFound();
	}

	return (
		<main
			style={{
				maxWidth: 600,
				margin: "2rem auto",
				padding: "1rem",
				borderRadius: "8px",
				background: "#f9f9f9",
			}}
		>
			<h1 style={{ color: "#183C5F" }}>{t.title}</h1>
			<p>{t.message}</p>
			<hr />
			<p style={{ fontStyle: "italic", color: "#666" }}>{t.info}</p>
			<button
				style={{
					marginTop: "2rem",
					padding: "0.5rem 1.25rem",
					fontSize: "1rem",
					borderRadius: "6px",
					background: "#2D9CDB",
					color: "#fff",
					border: "none",
				}}
				onClick={() => alert("Test réussi (" + t.title + ")")}
			>
				Test Alert
			</button>
		</main>
	);
}
