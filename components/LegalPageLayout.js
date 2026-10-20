import Link from "next/link";
import { COMPANY, POLICY_PAGES } from "@/lib/company";

export default function LegalPageLayout({ title, updatedAt, intro, currentPath, children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xs">A</span>
            </div>
            <span className="text-slate-900 font-black text-lg tracking-wide">APTIX</span>
          </Link>
          <Link href="/policies" className="text-slate-500 text-sm font-semibold hover:text-indigo-600">
            All policies
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 lg:grid lg:grid-cols-[220px_1fr] lg:gap-10">
        <aside className="hidden lg:block">
          <nav className="sticky top-6 space-y-1">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3 px-3">Policies</p>
            {POLICY_PAGES.map((p) => (
              <Link
                key={p.href}
                href={p.href}
                className={`block px-3 py-2 rounded-xl text-sm font-semibold ${
                  currentPath === p.href ? "bg-indigo-50 text-indigo-600" : "text-slate-500 hover:text-slate-900 hover:bg-white"
                }`}
              >
                {p.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="min-w-0">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-5 py-8 sm:px-10">
            <h1 className="text-slate-900 font-black text-3xl mb-2">{title}</h1>
            {updatedAt && <p className="text-slate-400 text-sm">Last updated: {updatedAt}</p>}
            {intro && <p className="text-slate-600 text-[15px] leading-relaxed mt-4">{intro}</p>}
            <article className="space-y-7 mt-8">{children}</article>
          </div>

          <div className="lg:hidden mt-8">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">Other policies</p>
            <div className="flex flex-wrap gap-2">
              {POLICY_PAGES.filter((p) => p.href !== currentPath).map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  className="text-sm font-semibold text-indigo-600 bg-white border border-gray-100 px-3 py-1.5 rounded-xl"
                >
                  {p.label}
                </Link>
              ))}
            </div>
          </div>
        </main>
      </div>

      <footer className="max-w-5xl mx-auto px-4 sm:px-6 pb-10 text-slate-400 text-xs">
        © {new Date().getFullYear()} {COMPANY.app} by {COMPANY.legalName}. All rights reserved.
      </footer>
    </div>
  );
}
