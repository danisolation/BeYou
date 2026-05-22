import Link from "next/link";

type DemoGuideAction = {
  href: string;
  label: string;
  primary?: boolean;
};

type DemoGuideCardProps = {
  title: string;
  body: string;
  steps: string[];
  actions?: DemoGuideAction[];
};

export function DemoGuideCard({ title, body, steps, actions = [] }: DemoGuideCardProps) {
  return (
    <section className="rounded-3xl border border-[#D7EFE8] bg-white p-5 shadow-sm sm:p-6">
      <p className="text-label font-semibold uppercase tracking-[0.18em] text-accent">Gợi ý demo</p>
      <h2 className="mt-2 text-heading">{title}</h2>
      <p className="mt-3 text-body">{body}</p>
      <ol className="mt-4 grid gap-3 text-body md:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step} className="rounded-2xl bg-secondary p-4">
            <span className="text-label font-semibold text-accent">Bước {index + 1}</span>
            <span className="mt-1 block">{step}</span>
          </li>
        ))}
      </ol>
      {actions.length > 0 ? (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={
                action.primary
                  ? "inline-flex min-h-11 items-center justify-center rounded-2xl bg-accent px-4 font-semibold text-white hover:bg-[#238C78]"
                  : "inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#CFE8E1] px-4 font-semibold hover:border-accent hover:bg-secondary"
              }
            >
              {action.label}
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
