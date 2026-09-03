import type { ReactNode } from "react";

type CheckoutResultCardProps = {
  actions: ReactNode;
  children: ReactNode;
  iconClass: string;
  iconToneClass: string;
  title: string;
};

export default function CheckoutResultCard({
  actions,
  children,
  iconClass,
  iconToneClass,
  title,
}: CheckoutResultCardProps) {
  return (
    <section className="card border-secondary bg-body-secondary shadow-sm">
      <div className="card-body p-4 p-md-5 text-center">
        <div className={`display-4 mb-3 ${iconToneClass}`} aria-hidden="true">
          <i className={iconClass} />
        </div>
        <h1 className="h2 mb-3">{title}</h1>
        <div className="checkout-result-copy">{children}</div>
        <div className="d-flex flex-wrap justify-content-center gap-2 mt-4">
          {actions}
        </div>
      </div>
    </section>
  );
}
