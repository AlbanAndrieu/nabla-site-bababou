/**
 * Decorative, dependency-free SVG pictograms for React routes.
 * Accessible names remain on the adjacent text/link, never on the icon.
 * The HTML archives retain their original Font Awesome dependencies.
 */
const PATHS = {
  "home": ["M3 10.5 12 3l9 7.5V21h-6v-7H9v7H3z"],
  "arrow-left": ["M19 12H5", "M12 5l-7 7 7 7"],
  "arrow-right": ["M5 12h14", "M12 5l7 7-7 7"],
  "arrow-up": ["M12 19V5", "M5 12l7-7 7 7"],
  "mail": ["M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z", "M2 7l10 7 10-7"],
  "calendar-plus": ["M8 3v4", "M16 3v4", "M3 9h18", "M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z", "M12 13v6", "M9 16h6"],
  "github": ["M9 19c-5 1.5-5-2.5-7-3", "M16 22v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"],
  "phone": ["M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 2.09 4.18 2 2 0 0 1 4.08 2h3a2 2 0 0 1 2 1.72l.45 2.81a2 2 0 0 1-.57 1.72L7.5 9.72a16 16 0 0 0 6.78 6.78l1.47-1.46a2 2 0 0 1 1.72-.57l2.81.45A2 2 0 0 1 22 16.92z"],
  "map-pin": ["M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0z", "M12 10m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0"],
  "landmark": ["M2 10h20", "M4 10v10", "M9 10v10", "M15 10v10", "M20 10v10", "M2 21h20", "M12 3 2 8h20z"],
  "gavel": ["m14 4 6 6", "m12 2 8 8", "m12 2-3 3 6 6 3-3", "m9 5-3 3 6 6 3-3", "m6 8 10 10", "M2 22h12"],
  "ban": ["M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z", "M4.9 4.9l14.2 14.2"],
  "mail-open": ["M2 10 12 3l10 7v11H2z", "M2 10l10 7 10-7", "M6 11V6h12v5"],
  "file-text": ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6", "M8 13h8", "M8 17h8"],
  "building": ["M4 22V4h16v18", "M2 22h20", "M8 8h2", "M14 8h2", "M8 12h2", "M14 12h2", "M8 16h2", "M14 16h2"],
  "user": ["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M4 21v-2a8 8 0 0 1 16 0v2"],
  "at-sign": ["M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8", "M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"],
  "rss": ["M3 11a10 10 0 0 1 10 10", "M3 4a17 17 0 0 1 17 17", "M4 20h.01"],
  "circle-check": ["M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z", "m7 12 3 3 7-7"],
  "circle-x": ["M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z", "m9 9 6 6", "M15 9l-6 6"],
  "reply": ["m9 17-5-5 5-5", "M4 12h9a7 7 0 0 1 7 7"],
} as const;

export type IconName = keyof typeof PATHS;

export default function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      className={className}
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "inline-block", verticalAlign: "-0.125em", flexShrink: 0 }}
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name].map((d) => <path key={d} d={d} />)}
    </svg>
  );
}
