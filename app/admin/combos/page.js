"use client";

import { useEffect, useMemo, useState } from "react";

const emptyForm = { course_ids: [], combo_price: "", label: "" };

function rupees(n) {
  return `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export default function AdminCombosPage() {
  const [combos, setCombos] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/combos", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/admin/courses", { cache: "no-store" }).then((r) => r.json()),
    ])
      .then(([c, k]) => {
        setCombos(c.combos || []);
        setCourses(k.courses || []);
      })
      .finally(() => setLoading(false));
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch-on-mount
  useEffect(load, []);

  const selectedCourses = useMemo(
    () => courses.filter((c) => form.course_ids.includes(c.id)),
    [courses, form.course_ids]
  );
  const originalTotal = selectedCourses.reduce((sum, c) => sum + Number(c.price), 0);
  const price = Number(form.combo_price) || 0;
  const saving_pct = originalTotal > 0 && price > 0 && price < originalTotal
    ? Math.round(((originalTotal - price) / originalTotal) * 100)
    : 0;

  function openNew() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  }

  function openEdit(combo) {
    setEditingId(combo.id);
    setForm({
      course_ids: combo.courses.map((c) => c.id),
      combo_price: String(combo.combo_price),
      label: combo.label || "",
    });
    setError("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleCourse(id) {
    setForm((f) => ({
      ...f,
      course_ids: f.course_ids.includes(id) ? f.course_ids.filter((x) => x !== id) : [...f.course_ids, id],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.course_ids.length < 2) {
      setError("Select at least 2 courses");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(editingId ? `/api/admin/combos/${editingId}` : "/api/admin/combos", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_ids: form.course_ids,
          combo_price: Number(form.combo_price),
          label: form.label,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save combo");
        return;
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      load();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(combo) {
    await fetch(`/api/admin/combos/${combo.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !combo.active }),
    });
    load();
  }

  async function remove(id) {
    if (!confirm("Delete this combo offer?")) return;
    await fetch(`/api/admin/combos/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-slate-900 font-black text-2xl">Combo Offers</h1>
          <p className="text-slate-400 text-sm">
            Bundle specific courses at a special price. Active combos show on the app&apos;s home screen, and paying
            unlocks every course in the bundle.
          </p>
        </div>
        <button
          onClick={openNew}
          className="bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-indigo-600 whitespace-nowrap"
        >
          + Add Combo
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-slate-900 font-bold text-lg mb-4">{editingId ? "Edit Combo" : "New Combo"}</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-slate-500 text-xs font-semibold">
                  Courses in this combo ({form.course_ids.length} selected)
                </label>
                {originalTotal > 0 && (
                  <span className="text-slate-400 text-xs">Individual total: {rupees(originalTotal)}</span>
                )}
              </div>
              {courses.length === 0 ? (
                <p className="text-slate-400 text-sm bg-slate-50 rounded-xl p-4">No courses yet — create courses first.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                  {courses.map((c) => {
                    const checked = form.course_ids.includes(c.id);
                    return (
                      <label
                        key={c.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                          checked ? "border-indigo-400 bg-indigo-50" : "border-gray-100 bg-slate-50 hover:border-gray-200"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCourse(c.id)}
                          className="w-4 h-4 accent-indigo-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-900 text-sm font-semibold truncate">{c.title}</p>
                          <p className="text-slate-400 text-xs">
                            {Number(c.price) > 0 ? rupees(c.price) : "Free"}
                            {c.status !== "published" && <span className="ml-2 text-amber-600 font-semibold">Draft</span>}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
              {selectedCourses.some((c) => c.status !== "published") && (
                <p className="text-amber-600 text-xs mt-2">
                  This combo includes a draft course, so it stays hidden in the app until that course is published.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-slate-500 text-xs font-semibold mb-1.5 block">Combo Price (₹)</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  value={form.combo_price}
                  onChange={(e) => setForm((f) => ({ ...f, combo_price: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 rounded-xl border border-transparent focus:outline-none focus:border-indigo-400 text-slate-900"
                />
                {saving_pct > 0 && (
                  <p className="text-emerald-600 text-xs font-semibold mt-1.5">
                    Students save {rupees(originalTotal - price)} ({saving_pct}% off)
                  </p>
                )}
              </div>
              <div>
                <label className="text-slate-500 text-xs font-semibold mb-1.5 block">Label (optional)</label>
                <input
                  placeholder="e.g. Complete Aptitude Pack"
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 rounded-xl border border-transparent focus:outline-none focus:border-indigo-400 text-slate-900"
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-xs font-semibold">{error}</p>}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-indigo-600 disabled:opacity-60"
              >
                {saving ? "Saving…" : editingId ? "Update" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="bg-slate-100 text-slate-700 font-bold px-5 py-2.5 rounded-xl text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {!loading && combos.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <p className="text-slate-400">No combo offers yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {combos.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-slate-900 font-bold text-sm">
                  {c.label || `${c.course_count}-Course Combo`}
                </p>
                <p className="text-sm mt-0.5">
                  <span className="text-indigo-600 font-black">{rupees(c.combo_price)}</span>
                  {c.original_price > c.combo_price && (
                    <span className="text-slate-400 line-through ml-2 text-xs">{rupees(c.original_price)}</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggleActive(c)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl ${
                    c.active ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {c.active ? "Active" : "Inactive"}
                </button>
                <button onClick={() => openEdit(c)} className="text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-600">
                  Edit
                </button>
                <button onClick={() => remove(c.id)} className="text-xs font-bold px-3 py-1.5 rounded-xl bg-red-50 text-red-500">
                  Delete
                </button>
              </div>
            </div>
            {c.courses.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {c.courses.map((x) => (
                  <span key={x.id} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
                    {x.title}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-amber-600 text-xs mt-3">
                No courses selected — this old combo is hidden in the app. Click Edit to pick its courses.
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
