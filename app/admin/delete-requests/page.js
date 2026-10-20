"use client";

import { useCallback, useEffect, useState } from "react";

const TABS = [
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Deleted" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled by user" },
];

function contact(r) {
  if (r.phone) return `+91 ${r.phone}`;
  return r.email || "—";
}

function daysLeft(scheduledFor) {
  const ms = new Date(scheduledFor.replace(" ", "T")).getTime() - Date.now();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export default function AdminDeleteRequestsPage() {
  const [tab, setTab] = useState("pending");
  const [data, setData] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    fetch(`/api/admin/delete-requests?status=${tab}`, { cache: "no-store" })
      .then((r) => r.json())
      .then(setData);
  }, [tab]);

  useEffect(load, [load]);

  async function act(r, action) {
    const who = contact(r);
    const message =
      action === "approve"
        ? `Permanently delete the account ${who} and ALL its data (progress, tests, purchases)? This cannot be undone.`
        : `Reject the deletion request from ${who}? Their account will be kept.`;
    if (!confirm(message)) return;
    const note = action === "reject" ? prompt("Reason for rejecting (optional):") || "" : "";

    setBusyId(r.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/delete-requests/${r.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });
      const d = await res.json();
      if (!res.ok) setError(d.error || "Action failed");
      load();
    } finally {
      setBusyId(null);
    }
  }

  const counts = data?.counts;

  return (
    <div className="max-w-5xl">
      <h1 className="text-slate-900 font-black text-2xl mb-1">Account Delete Requests</h1>
      <p className="text-slate-400 text-sm mb-6">
        Students request deletion from the app and are told it will be done within 7 days. Delete each account before
        its due date.
      </p>

      {counts?.overdue > 0 && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-semibold rounded-2xl px-5 py-3 mb-5">
          ⚠ {counts.overdue} request{counts.overdue > 1 ? "s are" : " is"} past the 7-day deadline. Please process
          {counts.overdue > 1 ? " them" : " it"} now.
        </div>
      )}

      <div className="flex flex-wrap gap-1 bg-white rounded-xl border border-gray-100 p-1 mb-4 w-fit">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
              tab === t.value ? "bg-indigo-500 text-white" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
            {t.value === "pending" && counts?.pending > 0 && (
              <span className={`ml-1.5 px-1.5 rounded-full ${tab === t.value ? "bg-white/25" : "bg-red-100 text-red-600"}`}>
                {counts.pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && <p className="text-red-500 text-sm font-semibold mb-3">{error}</p>}

      <div className="space-y-3">
        {data?.requests?.map((r) => {
          const left = daysLeft(r.scheduled_for);
          return (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-slate-900 font-bold">{contact(r)}</p>
                  <p className="text-slate-400 text-xs mt-1">
                    Requested {r.requested_at} · {Number(r.purchase_count) || 0} course purchase
                    {Number(r.purchase_count) === 1 ? "" : "s"}
                  </p>
                  {r.reason && (
                    <p className="text-slate-600 text-sm mt-2 bg-slate-50 rounded-xl px-3 py-2">“{r.reason}”</p>
                  )}
                  {r.admin_note && <p className="text-slate-400 text-xs mt-2">Note: {r.admin_note}</p>}
                </div>

                {r.status === "pending" ? (
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                        r.overdue ? "bg-red-50 text-red-600" : left <= 2 ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {r.overdue ? "Overdue" : `Due in ${left} day${left === 1 ? "" : "s"}`} · {r.scheduled_for.slice(0, 10)}
                    </span>
                    <div className="flex gap-2">
                      <button
                        disabled={busyId === r.id}
                        onClick={() => act(r, "reject")}
                        className="text-xs font-bold px-3 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        disabled={busyId === r.id}
                        onClick={() => act(r, "approve")}
                        className="text-xs font-bold px-3 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                      >
                        {busyId === r.id ? "Working…" : "Delete account"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">Processed {r.processed_at || "—"}</span>
                )}
              </div>
            </div>
          );
        })}
        {data && data.requests?.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 text-slate-400 text-sm">
            No {TABS.find((t) => t.value === tab)?.label.toLowerCase()} requests.
          </div>
        )}
      </div>
    </div>
  );
}
