import type { ReactNode } from "react";
import surface from "@/components/ui/Surface.module.css";
import styles from "./CheckoutResultCard.module.css";

type CheckoutResultTone = "success" | "warning";

type CheckoutResultCardProps = {
  actions: ReactNode;
  children: ReactNode;
  iconClass: string;
  tone: CheckoutResultTone;
  title: string;
};

export default function CheckoutResultCard({
  actions,
  children,
  iconClass,
  tone,
  title,
}: CheckoutResultCardProps) {
  return (
    <section className={`${surface.card} ${surface.muted} ${styles.card}`}>
      <div
        className={`${styles.icon} ${styles[tone]}`}
        aria-hidden="true"
      >
        <i className={iconClass} />
      </div>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.copy}>{children}</div>
      <div className={styles.actions}>{actions}</div>
    </section>
  );
}
