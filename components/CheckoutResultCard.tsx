import Icon, { type IconName } from "@/components/ui/Icon";
import type { ReactNode } from "react";
import surface from "@/components/ui/Surface.module.css";
import styles from "./CheckoutResultCard.module.css";

type CheckoutResultTone = "success" | "warning";

type CheckoutResultCardProps = {
  actions: ReactNode;
  children: ReactNode;
  icon: IconName;
  tone: CheckoutResultTone;
  title: string;
};

export default function CheckoutResultCard({
  actions,
  children,
  icon,
  tone,
  title,
}: CheckoutResultCardProps) {
  return (
    <section className={`${surface.card} ${surface.muted} ${styles.card}`}>
      <div
        className={`${styles.icon} ${styles[tone]}`}
        aria-hidden="true"
      >
        <Icon name={icon} />
      </div>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.copy}>{children}</div>
      <div className={styles.actions}>{actions}</div>
    </section>
  );
}
