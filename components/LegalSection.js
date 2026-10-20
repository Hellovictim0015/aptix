import { COMPANY } from "@/lib/company";

export function Section({ title, children }) {
  return (
    <section>
      <h2 className="text-slate-900 font-bold text-lg mb-2">{title}</h2>
      <div className="text-slate-600 text-[15px] leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export function Bullets({ items }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export function A({ href, children }) {
  return (
    <a href={href} className="text-indigo-600 font-semibold hover:underline">
      {children}
    </a>
  );
}

// Email / phone / address block reused at the bottom of every policy page.
export function ContactDetails({ subject }) {
  const mail = subject ? `mailto:${COMPANY.email}?subject=${encodeURIComponent(subject)}` : `mailto:${COMPANY.email}`;
  return (
    <Bullets
      items={[
        <>
          Email: <A href={mail}>{COMPANY.email}</A>
        </>,
        <>
          Phone / WhatsApp: <A href={COMPANY.phoneHref}>{COMPANY.phone}</A>
        </>,
        `Support hours: ${COMPANY.supportHours}`,
        ...(COMPANY.address ? [`Address: ${COMPANY.address}`] : []),
      ]}
    />
  );
}

export function Callout({ tone = "indigo", children }) {
  const tones = {
    indigo: "bg-indigo-50 border-indigo-100 text-indigo-900",
    amber: "bg-amber-50 border-amber-100 text-amber-900",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-900",
  };
  return <div className={`rounded-2xl border px-5 py-4 text-[15px] leading-relaxed ${tones[tone]}`}>{children}</div>;
}
