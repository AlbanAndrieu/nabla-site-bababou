"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

type CopyPageLinkButtonProps = {
  copyLabel?: string;
  copiedLabel?: string;
};

export default function CopyPageLinkButton({
  copyLabel = "Copy link",
  copiedLabel = "Copied",
}: CopyPageLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant="outline" size="compact" onClick={handleCopy}>
      <i className="fa-solid fa-link" aria-hidden="true" />{" "}
      {copied ? copiedLabel : copyLabel}
    </Button>
  );
}
