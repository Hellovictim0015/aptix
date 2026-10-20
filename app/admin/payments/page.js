"use client";

import { useEffect, useState } from "react";

const FILTERS = [
  { value: "", label: "All" },
  { value: "paid", label: "Paid" },
  { value: "created", label: "Pending" },
  { value: "failed", label: "Failed" },
];

const STATUS_STYLE = {
  paid: "bg-emerald-50 text-emerald-700",
  created: "bg-amber-50 text-amber-700",
  failed: "bg-red-50 text-red-600",
};

const STATUS_LABEL = { paid: "Paid", created: "Pending", failed: "Failed" };

function rupees(n) {
  return `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export default function AdminPaymentsPage() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (search.trim()) params.set("q", search.trim());
    const t = setTimeout(() => {
      setLoading(true);
      fetch(`/api/admin/payments?${params}`, { cache: "no-store" })
        .then((r) => r.json())
        .then(setData)
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [status, search]);

  const s = data?.summary;

  return (
    <div className="max-w-6xl">
      <h1 className="text-slate-900 font-black text-2xl mb-1">Payments</h1>
      <p className="text-slate-400 text-sm mb-6">Every Razorpay order created from the app, newest first.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          ["Total revenue", rupees(s?.revenue), "text-indigo-600"],
          ["Paid", s?.paid_count ?? "–", "text-emerald-600"],
          ["Pending", s?.pending_count ?? "–", "text-amber-600"],
          ["Failed", s?.failed_count ?? "–", "text-red-500"],
        ].map(([label, value, color]) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-slate-400 text-xs font-semibold">{label}</p>
            <p className={`font-black text-2xl mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center mb-4">
        <div className="flex bg-white rounded-xl border border-gray-100 p-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatus(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                status === f.value ? "bg-indigo-500 text-white" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          placeholder="Search phone, email, order ID or payment ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[220px] px-4 py-2 text-sm bg-white rounded-xl border border-gray-100 focus:outline-none focus:border-indigo-400 text-slate-900"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 text-xs border-b border-gray-100">
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Student</th>
              <th className="px-4 py-3 font-semibold">Courses</th>
              <th className="px-4 py-3 font-semibold">Amount</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Razorpay IDs</th>
            </tr>
          </thead>
          <tbody>
            {data?.payments?.map((p) => (
              <tr key={p.id} className="border-b border-gray-50 align-top">
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{p.created_at}</td>
                <td className="px-4 py-3 text-slate-800">{p.phone ? `+91 ${p.phone}` : p.email || "(deleted user)"}</td>
                <td className="px-4 py-3 text-slate-600 max-w-[240px]">{p.course_titles || p.course_ids}</td>
                <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">{rupees(p.amount)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${STATUS_STYLE[p.status]}`}>
                    {STATUS_LABEL[p.status]}
                  </span>
                  {p.failure_reason && p.status !== "paid" && (
                    <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">{p.failure_reason}</p>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                  <div>{p.razorpay_order_id}</div>
                  {p.razorpay_payment_id && <div>{p.razorpay_payment_id}</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && data?.payments?.length === 0 && (
          <p className="text-center text-slate-400 text-sm py-10">No payments yet.</p>
        )}
        {loading && !data && <p className="text-center text-slate-400 text-sm py-10">Loading…</p>}
      </div>
    </div>
  );
}
