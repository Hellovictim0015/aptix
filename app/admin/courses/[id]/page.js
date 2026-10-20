"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const STATUS_LABEL = {
  pending: { text: "Not generated", cls: "bg-gray-100 text-gray-500" },
  generating: { text: "Generating…", cls: "bg-amber-50 text-amber-600" },
  ready: { text: "Ready", cls: "bg-emerald-50 text-emerald-600" },
  failed: { text: "Failed", cls: "bg-red-50 text-red-500" },
};

export default function CourseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [course, setCourse] = useState(null);
  const [topics, setTopics] = useState([]);
  const [form, setForm] = useState(null);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [generatingTopics, setGeneratingTopics] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState("");

  function load() {
    fetch(`/api/admin/courses/${id}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setCourse(d.course);
        setTopics(d.topics || []);
        if (d.course) {
          setForm({
            title: d.course.title,
            slug: d.course.slug,
            seo_title: d.course.seo_title || "",
            seo_description: d.course.seo_description || "",
            keywords: d.course.keywords || "",
            tags: d.course.tags || "",
            price: String(d.course.price ?? "0"),
            status: d.course.status,
          });
        }
      });
  }

  useEffect(load, [id]);

  async function handleSaveDetails(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append("image", file);
      const res = await fetch(`/api/admin/courses/${id}`, { method: "PUT", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save");
        return;
      }
      setFile(null);
      load();
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateTopics() {
    setGeneratingTopics(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/courses/${id}/generate-topics`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not generate topics");
        return;
      }
      load();
    } catch {
      setError("Network error while generating topics.");
    } finally {
      setGeneratingTopics(false);
    }
  }

  async function handleAddTopic(e) {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;
    const res = await fetch(`/api/admin/courses/${id}/topics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTopicTitle.trim() }),
    });
    if (res.ok) {
      setNewTopicTitle("");
      load();
    }
  }

  async function handleDeleteCourse() {
    if (!confirm("Delete this course and all its topics/MCQs?")) return;
    await fetch(`/api/admin/courses/${id}`, { method: "DELETE" });
    router.push("/admin/courses");
  }

  if (!course || !form) {
    return <p className="text-slate-400 text-sm">Loading…</p>;
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin/courses" className="text-indigo-500 text-xs font-semibold hover:underline">
            ← Back to courses
          </Link>
          <h1 className="text-slate-900 font-black text-2xl mt-1">{course.title}</h1>
        </div>
        <button onClick={handleDeleteCourse} className="text-red-500 text-xs font-semibold hover:underline">
          Delete course
        </button>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <h2 className="text-slate-900 font-bold text-sm mb-4">Course Details</h2>
        <form onSubmit={handleSaveDetails} className="space-y-4">
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
              <label className="text-slate-500 text-xs font-semibold mb-1.5 block">Slug</label>
              <input
                value={form.slug}
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
                rows={2}
                className="w-full px-4 py-2.5 text-sm bg-slate-50 rounded-xl border border-transparent focus:outline-none focus:border-indigo-400 text-slate-900"
              />
            </div>
            <div>
              <label className="text-slate-500 text-xs font-semibold mb-1.5 block">Keywords</label>
              <input
                value={form.keywords}
                onChange={(e) => setForm((f) => ({ ...f, keywords: e.target.value }))}
                className="w-full px-4 py-2.5 text-sm bg-slate-50 rounded-xl border border-transparent focus:outline-none focus:border-indigo-400 text-slate-900"
              />
            </div>
            <div>
              <label className="text-slate-500 text-xs font-semibold mb-1.5 block">Tags</label>
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
              <label className="text-slate-500 text-xs font-semibold mb-1.5 block">Replace Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="text-sm text-slate-700"
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-xs font-semibold">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-indigo-600 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-slate-900 font-bold text-sm">Topics ({topics.length})</h2>
          <button
            onClick={handleGenerateTopics}
            disabled={generatingTopics}
            className="flex items-center gap-2 bg-violet-500 text-white font-bold px-4 py-2 rounded-xl text-xs hover:bg-violet-600 disabled:opacity-60"
          >
            ✨ {generatingTopics ? "Generating with AI…" : "AI Generate Topics"}
          </button>
        </div>

        <form onSubmit={handleAddTopic} className="flex gap-2 mb-4">
          <input
            value={newTopicTitle}
            onChange={(e) => setNewTopicTitle(e.target.value)}
            placeholder="Add a topic manually…"
            className="flex-1 px-4 py-2 text-sm bg-slate-50 rounded-xl border border-transparent focus:outline-none focus:border-indigo-400 text-slate-900"
          />
          <button type="submit" className="bg-slate-100 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs">
            Add
          </button>
        </form>

        {topics.length === 0 ? (
          <p className="text-slate-400 text-sm py-6 text-center">
            No topics yet. Click &quot;AI Generate Topics&quot; or add one manually.
          </p>
        ) : (
          <div className="divide-y divide-gray-50">
            {topics.map((t) => {
              const status = STATUS_LABEL[t.content_status] || STATUS_LABEL.pending;
              return (
                <Link
                  key={t.id}
                  href={`/admin/courses/${id}/topics/${t.id}`}
                  className="flex items-center justify-between py-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg"
                >
                  <div>
                    <p className="text-slate-900 font-medium text-sm">{t.title}</p>
                    <p className="text-slate-400 text-xs">{t.mcq_count} MCQ(s)</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.cls}`}>{status.text}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
