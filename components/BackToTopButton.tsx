"use client";

import Icon from "@/components/ui/Icon";

type BackToTopButtonProps = {
  label: string;
  ariaLabel: string;
  className?: string;
};

export default function BackToTopButton({
  label,
  ariaLabel,
  className,
}: BackToTopButtonProps) {
  const handleClick = () => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, left: 0, behavior: reducedMotion ? "auto" : "smooth" });
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}#top`,
    );
  };

  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel}
      onClick={handleClick}
    >
      <Icon name="arrow-up" />
      <span>{label}</span>
    </button>
  );
}
