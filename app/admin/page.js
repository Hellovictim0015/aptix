"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ courses: 0, topics: 0, mcqs: 0 });

  useEffect(() => {
    fetch("/api/admin/stats", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {});
  }, []);

  const cards = [
    { label: "Courses", value: stats.courses, icon: "📚" },
    { label: "Topics", value: stats.topics, icon: "🧩" },
    { label: "MCQs generated", value: stats.mcqs, icon: "❓" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-slate-900 font-black text-2xl">Dashboard</h1>
        <p className="text-slate-400 text-sm">Overview of your courses and content</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="text-2xl mb-2">{c.icon}</div>
            <p className="text-slate-900 font-black text-2xl">{c.value}</p>
            <p className="text-slate-400 text-sm">{c.label}</p>
          </div>
        ))}
      </div>

      <Link
        href="/admin/courses"
        className="inline-block bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-indigo-600"
      >
        Manage Courses →
      </Link>
    </div>
  );
}
