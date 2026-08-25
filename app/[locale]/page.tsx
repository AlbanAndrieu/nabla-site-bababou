import { redirect } from "next/navigation";

/**
 * The homepage still belongs to the legacy public runtime during P3.
 * Do not expose a placeholder localized Next homepage before the audited
 * migration is ready; keep one authoritative public home at `/` instead.
 */
export default function HomePage() {
  redirect("/");
}
