import Link from "next/link";
import LegalPageLayout from "@/components/LegalPageLayout";
import { COMPANY, POLICY_PAGES, POLICY_UPDATED } from "@/lib/company";

export const metadata = {
  title: "Policies — AptiX",
  description: "Privacy policy, terms, refund & cancellation, delivery, account deletion and contact details for AptiX.",
};

export default function PoliciesPage() {
  return (
    <LegalPageLayout
      title="Policies & Legal"
      updatedAt={POLICY_UPDATED}
      currentPath="/policies"
      intro={`All the policies that apply to the ${COMPANY.app} app and website, operated by ${COMPANY.legalName}.`}
    >
      <div className="grid sm:grid-cols-2 gap-4">
        {POLICY_PAGES.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className="group block rounded-2xl border border-gray-100 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-100 p-5 transition-colors"
          >
            <p className="text-slate-900 font-bold group-hover:text-indigo-700">{p.label} →</p>
            <p className="text-slate-500 text-sm mt-1">{p.desc}</p>
          </Link>
        ))}
      </div>
    </LegalPageLayout>
  );
}
