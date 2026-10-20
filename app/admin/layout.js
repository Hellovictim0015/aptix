"use client";

import { useRouter, usePathname } from "next/navigation";
import { useSession } from "@/lib/useSession";

const sideNav = [
  { label: "Dashboard", path: "/admin", icon: "▦" },
  { label: "Courses", path: "/admin/courses", icon: "📚" },
  { label: "Combo Offers", path: "/admin/combos", icon: "🎁" },
  { label: "Payments", path: "/admin/payments", icon: "💳" },
  { label: "Delete Requests", path: "/admin/delete-requests", icon: "🗑️" },
  { label: "Home Banner", path: "/admin/home-banner", icon: "🖼️" },
  { label: "Settings", path: "/admin/settings", icon: "⚙️" },
];

const AUTH_ROUTES = ["/admin/login"];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { identity, logout } = useSession("admin");

  if (AUTH_ROUTES.some((p) => pathname.startsWith(p))) {
    return <>{children}</>;
  }

  const isActive = (path) => {
    if (path === "/admin") return pathname === "/admin";
    return pathname.startsWith(path);
  };

  const displayName = identity?.name || "Admin";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className="w-60 bg-slate-900 flex flex-col flex-shrink-0">
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xs">A</span>
            </div>
            <span className="text-white font-black text-lg tracking-wide">APTIX</span>
          </div>
          <p className="text-white/40 text-xs mt-1">Admin Panel</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {sideNav.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.label}
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-sm font-medium ${
                  active
                    ? "bg-indigo-500/20 text-indigo-400 border-l-2 border-indigo-400"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-end gap-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold">
              {initial}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-slate-800">{displayName}</p>
              <p className="text-[10px] text-slate-400">Admin</p>
            </div>
            <button onClick={logout} className="text-slate-400 text-xs hover:text-red-500 transition-colors px-2">
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
