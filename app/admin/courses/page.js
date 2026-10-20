"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const emptyForm = { title: "", slug: "", seo_title: "", seo_description: "", keywords: "", tags: "", price: "0", status: "draft" };

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    fetch("/api/admin/courses", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setCourses(d.courses || []))
      .finally(() => setLoading(false));
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch-on-mount
  useEffect(load, []);

  function startCreate() {
    setForm(emptyForm);
    setFile(null);
    setError("");
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append("image", file);

      const res = await fetch("/api/admin/courses", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save course");
        return;
      }
      setShowForm(false);
      load();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-slate-900 font-black text-2xl">Courses</h1>
          <p className="text-slate-400 text-sm mt-0.5">Create courses, then generate topics and content with AI</p>
        </div>
        <button
          onClick={startCreate}
          className="bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-indigo-600"
        >
          + New Course
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-slate-900 font-bold text-lg mb-4">New Course</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-slate-500 text-xs font-semibold mb-1.5 block">Title</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 rounded-xl border border-transparent focus:outline-none focus:border-indigo-400 text-slate-900"
                />
              </div>
              <div>
                <label className="text-slate-500 text-xs font-semibold mb-1.5 block">Slug (optional)</label>
                <input
                  value={form.slug}
                  placeholder="auto-generated from title"
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 rounded-xl border border-transparent focus:outline-none focus:border-indigo-400 text-slate-900"
                />
              </div>
              <div className="col-span-2">
                <label className="text-slate-500 text-xs font-semibold mb-1.5 block">SEO Title</label>
                <input
                  value={form.seo_title}
                  onChange={(e) => setForm((f) => ({ ...f, seo_title: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 rounded-xl border border-transparent focus:outline-none focus:border-indigo-400 text-slate-900"
                />
              </div>
              <div className="col-span-2">
                <label className="text-slate-500 text-xs font-semibold mb-1.5 block">SEO Description</label>
                <textarea
                  value={form.seo_description}
                  onChange={(e) => setForm((f) => ({ ...f, seo_description: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 rounded-xl border border-transparent focus:outline-none focus:border-indigo-400 text-slate-900"
                  rows={2}
                />
              </div>
              <div>
                <label className="text-slate-500 text-xs font-semibold mb-1.5 block">Keywords (comma separated)</label>
                <input
                  value={form.keywords}
                  onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 rounded-xl border border-transparent focus:outline-none focus:border-indigo-400 text-slate-900"
                />
              </div>
              <div>
                <label className="text-slate-500 text-xs font-semibold mb-1.5 block">Tags (comma separated)</label>
                <input
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 rounded-xl border border-transparent focus:outline-none focus:border-indigo-400 text-slate-900"
                />
              </div>
              <div>
                <label className="text-slate-500 text-xs font-semibold mb-1.5 block">Price (₹, 0 = free)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 rounded-xl border border-transparent focus:outline-none focus:border-indigo-400 text-slate-900"
                />
              </div>
              <div>
                <label className="text-slate-500 text-xs font-semibold mb-1.5 block">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 rounded-xl border border-transparent focus:outline-none focus:border-indigo-400 text-slate-900"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div>
                <label className="text-slate-500 text-xs font-semibold mb-1.5 block">Course Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="text-sm text-slate-700"
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
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-slate-100 text-slate-700 font-bold px-5 py-2.5 rounded-xl text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {!loading && courses.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <p className="text-slate-400">No courses yet. Create one to get started.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {courses.map((c) => (
          <Link
            key={c.id}
            href={`/admin/courses/${c.id}`}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-indigo-200 transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              {c.image ? (
                <img src={c.image} alt={c.title} className="w-12 h-12 rounded-xl object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-2xl">📚</div>
              )}
              <div className="min-w-0">
                <p className="text-slate-900 font-bold text-sm truncate">{c.title}</p>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    c.status === "published" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {c.status}
                </span>
              </div>
            </div>
            <p className="text-slate-400 text-xs">{c.topic_count} topic(s)</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
