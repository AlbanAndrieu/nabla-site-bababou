"use client";

import { useSearchParams } from "next/navigation";

type Props = {
  label: string;
  className: string;
};

/**
 * Display-only receipt reference. No payment validation or external request.
 * Read the URL in the browser so /success can be prerendered for all locales.
 */
export default function CheckoutSessionReference({ label, className }: Props) {
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get("session_id")?.trim().slice(0, 200);

  if (!sessionId) return <p id="checkout-session-ref" hidden />;

  return (
    <p id="checkout-session-ref" className={className}>
      <strong>{label}</strong> {sessionId}
    </p>
  );
}
