"use client";

import { useEffect, useState } from "react";

const emptyForm = {
  title: "",
  subtitle: "",
  bg_type: "color",
  bg_color: "#0E9E91",
  text_color: "#FFFFFF",
  button_bg_color: "#FFFFFF",
  button_text_color: "#0E9E91",
};

function ColorField({ label, value, onChange }) {
  return (
    <div>
      <label className="text-slate-500 text-xs font-semibold mb-1.5 block">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-10 h-9 rounded-lg border border-gray-200 cursor-pointer" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 text-sm bg-slate-50 rounded-xl border border-transparent focus:outline-none focus:border-indigo-400 text-slate-900"
        />
      </div>
    </div>
  );
}

function BannerPreview({ banner, previewImage }) {
  const bg =
    banner.bg_type === "image"
      ? {
          backgroundImage: `url(${previewImage || banner.bg_image || ""})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : { backgroundColor: banner.bg_color };
  return (
    <div className="rounded-2xl p-5 relative overflow-hidden" style={bg}>
      {banner.bg_type === "image" && <div className="absolute inset-0 bg-black/20" />}
      <div className="relative flex items-center justify-between gap-4">
        <div>
          <p className="font-extrabold whitespace-pre-line leading-snug text-lg" style={{ color: banner.text_color }}>
            {banner.title}
          </p>
          <p className="text-sm mt-1 opacity-90" style={{ color: banner.text_color }}>
            {banner.subtitle}
          </p>
        </div>
        <span
          className="text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap"
          style={{ backgroundColor: banner.button_bg_color, color: banner.button_text_color }}
        >
          Continue Learning
        </span>
      </div>
    </div>
  );
}

function BannerForm({ initial, onCancel, onSaved, saveUrl, method }) {
  const [form, setForm] = useState(initial);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!file) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing the derived preview when the file is cleared
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v !== undefined && v !== null && fd.append(k, v));
      if (file) fd.append("bg_image", file);
      const res = await fetch(saveUrl, { method, body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save banner");
        return;
      }
      onSaved();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
      <BannerPreview banner={form} previewImage={preview} />
      <form onSubmit={handleSubmit} className="space-y-4 mt-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-slate-500 text-xs font-semibold mb-1.5 block">Title</label>
            <textarea
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              rows={2}
              className="w-full px-4 py-2.5 text-sm bg-slate-50 rounded-xl border border-transparent focus:outline-none focus:border-indigo-400 text-slate-900"
            />
          </div>
          <div className="col-span-2">
            <label className="text-slate-500 text-xs font-semibold mb-1.5 block">Subtitle</label>
            <input
              value={form.subtitle || ""}
              onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
              className="w-full px-4 py-2.5 text-sm bg-slate-50 rounded-xl border border-transparent focus:outline-none focus:border-indigo-400 text-slate-900"
            />
          </div>

          <div className="col-span-2 flex gap-2">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, bg_type: "color" }))}
              className={`px-4 py-2 rounded-xl text-xs font-bold ${form.bg_type === "color" ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-600"}`}
            >
              Solid Color
            </button>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, bg_type: "image" }))}
              className={`px-4 py-2 rounded-xl text-xs font-bold ${form.bg_type === "image" ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-600"}`}
            >
              Image
            </button>
          </div>

          {form.bg_type === "color" ? (
            <div className="col-span-2">
              <ColorField label="Background Color" value={form.bg_color} onChange={(v) => setForm((f) => ({ ...f, bg_color: v }))} />
            </div>
          ) : (
            <div className="col-span-2">
              <label className="text-slate-500 text-xs font-semibold mb-1.5 block">Background Image</label>
              <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-sm text-slate-700" />
            </div>
          )}

          <ColorField label="Title/Subtitle Text Color" value={form.text_color} onChange={(v) => setForm((f) => ({ ...f, text_color: v }))} />
          <div />
          <ColorField label="Button Background Color" value={form.button_bg_color} onChange={(v) => setForm((f) => ({ ...f, button_bg_color: v }))} />
          <ColorField label="Button Text Color" value={form.button_text_color} onChange={(v) => setForm((f) => ({ ...f, button_text_color: v }))} />
        </div>

        {error && <p className="text-red-500 text-xs font-semibold">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-indigo-600 disabled:opacity-60">
            {saving ? "Saving…" : "Save"}
          </button>
          <button type="button" onClick={onCancel} className="bg-slate-100 text-slate-700 font-bold px-5 py-2.5 rounded-xl text-sm">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminHomeBannerPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState(null);

  function load() {
    setLoading(true);
    fetch("/api/admin/hero-banners", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setBanners(d.banners || []))
      .finally(() => setLoading(false));
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch-on-mount
  useEffect(load, []);

  async function move(banner, direction) {
    const idx = banners.findIndex((b) => b.id === banner.id);
    const swapWith = banners[idx + direction];
    if (!swapWith) return;
    await Promise.all([
      fetch(`/api/admin/hero-banners/${banner.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sort_order: swapWith.sort_order }),
      }),
      fetch(`/api/admin/hero-banners/${swapWith.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sort_order: banner.sort_order }),
      }),
    ]);
    load();
  }

  async function remove(id) {
    if (!confirm("Delete this banner?")) return;
    await fetch(`/api/admin/hero-banners/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-slate-900 font-black text-2xl">Home Banner</h1>
          <p className="text-slate-400 text-sm">
            Manage the scrolling hero carousel shown at the top of the app&apos;s home screen — background, text and
            button colors are all editable per slide.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setShowCreate(true);
          }}
          className="bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-indigo-600 whitespace-nowrap"
        >
          + Add Slide
        </button>
      </div>

      {showCreate && (
        <BannerForm
          initial={emptyForm}
          saveUrl="/api/admin/hero-banners"
          method="POST"
          onCancel={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}

      {!loading && banners.length === 0 && !showCreate && (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <p className="text-slate-400">No banners yet. Add one to get started.</p>
        </div>
      )}

      <div className="space-y-4">
        {banners.map((b, i) =>
          editingId === b.id ? (
            <BannerForm
              key={b.id}
              initial={b}
              saveUrl={`/api/admin/hero-banners/${b.id}`}
              method="PUT"
              onCancel={() => setEditingId(null)}
              onSaved={() => {
                setEditingId(null);
                load();
              }}
            />
          ) : (
            <div key={b.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <BannerPreview banner={b} />
              <div className="flex items-center justify-between mt-3">
                <div className="flex gap-1">
                  <button
                    disabled={i === 0}
                    onClick={() => move(b, -1)}
                    className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 disabled:opacity-30 text-xs"
                  >
                    ↑
                  </button>
                  <button
                    disabled={i === banners.length - 1}
                    onClick={() => move(b, 1)}
                    className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 disabled:opacity-30 text-xs"
                  >
                    ↓
                  </button>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingId(b.id)} className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700">
                    Edit
                  </button>
                  <button onClick={() => remove(b.id)} className="text-xs font-bold px-3 py-1.5 rounded-xl bg-red-50 text-red-500">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
