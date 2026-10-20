"use client";

import { useEffect, useState } from "react";

export default function AdminSettingsPage() {
  const [current, setCurrent] = useState(null);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gpt-4o-mini");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [deviceLockSaving, setDeviceLockSaving] = useState(false);
  const [razorpayKeyId, setRazorpayKeyId] = useState("");
  const [razorpayKeySecret, setRazorpayKeySecret] = useState("");
  const [razorpayWebhookSecret, setRazorpayWebhookSecret] = useState("");
  const [fast2smsKey, setFast2smsKey] = useState("");
  const [fast2smsOtpId, setFast2smsOtpId] = useState("");
  const [fast2smsSaving, setFast2smsSaving] = useState(false);
  const [fast2smsMessage, setFast2smsMessage] = useState("");
  const [razorpaySaving, setRazorpaySaving] = useState(false);
  const [razorpayMessage, setRazorpayMessage] = useState("");

  function load() {
    fetch("/api/admin/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setCurrent(d);
        setModel(d.openai_model || "gpt-4o-mini");
        setRazorpayKeyId(d.razorpay_key_id || "");
        setFast2smsOtpId(d.fast2sms_otp_id || "");
      });
  }

  useEffect(load, []);

  async function handleToggleDeviceLock() {
    const next = !current?.device_lock_enabled;
    setDeviceLockSaving(true);
    setCurrent((c) => ({ ...c, device_lock_enabled: next }));
    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_lock_enabled: next }),
      });
    } finally {
      setDeviceLockSaving(false);
    }
  }

  async function handleSaveFast2sms(e) {
    e.preventDefault();
    setFast2smsSaving(true);
    setFast2smsMessage("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fast2sms_api_key: fast2smsKey, fast2sms_otp_id: fast2smsOtpId }),
      });
      if (!res.ok) throw new Error();
      setFast2smsKey("");
      setFast2smsMessage("Saved.");
      load();
    } catch {
      setFast2smsMessage("Could not save WhatsApp OTP settings.");
    } finally {
      setFast2smsSaving(false);
    }
  }

  async function handleSaveRazorpay(e) {
    e.preventDefault();
    setRazorpaySaving(true);
    setRazorpayMessage("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_key_id: razorpayKeyId,
          razorpay_key_secret: razorpayKeySecret,
          razorpay_webhook_secret: razorpayWebhookSecret,
        }),
      });
      if (!res.ok) throw new Error();
      setRazorpayKeySecret("");
      setRazorpayWebhookSecret("");
      setRazorpayMessage("Saved.");
      load();
    } catch {
      setRazorpayMessage("Could not save Razorpay settings.");
    } finally {
      setRazorpaySaving(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openai_api_key: apiKey, openai_model: model }),
      });
      if (!res.ok) throw new Error();
      setApiKey("");
      setMessage("Saved.");
      load();
    } catch {
      setMessage("Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-slate-900 font-black text-2xl">Settings</h1>
        <p className="text-slate-400 text-sm">Configure the OpenAI key used for AI content generation</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-slate-900 font-bold text-sm mb-1">OpenAI API Key</h2>
        <p className="text-slate-400 text-xs mb-4">
          {current?.has_openai_api_key
            ? `Currently set: ${current.openai_api_key_masked}`
            : "No key set yet — AI generation will not work until you add one."}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-slate-500 text-xs font-semibold mb-1.5 block">New API Key</label>
            <input
              type="password"
              placeholder="sk-…"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-slate-50 rounded-xl border border-transparent focus:outline-none focus:border-indigo-400 text-slate-900"
            />
          </div>
          <div>
            <label className="text-slate-500 text-xs font-semibold mb-1.5 block">Model</label>
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-slate-50 rounded-xl border border-transparent focus:outline-none focus:border-indigo-400 text-slate-900"
            />
          </div>
          {message && <p className="text-xs font-semibold text-slate-500">{message}</p>}
          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-indigo-600 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-slate-900 font-bold text-sm mb-1">Single-Device Lock for Purchases</h2>
            <p className="text-slate-400 text-xs max-w-sm">
              When on, a purchased course can only be opened (content + MCQs) on the device it was first bought
              on. Topic lists still show everywhere. When off, purchases work on any device.
            </p>
          </div>
          <button
            onClick={handleToggleDeviceLock}
            disabled={!current || deviceLockSaving}
            className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 disabled:opacity-60 ${
              current?.device_lock_enabled ? "bg-indigo-500" : "bg-gray-200"
            }`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                current?.device_lock_enabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
        <h2 className="text-slate-900 font-bold text-sm mb-1">WhatsApp OTP Login (Fast2SMS)</h2>
        <p className="text-slate-400 text-xs mb-4">
          {current?.has_fast2sms_api_key
            ? `API key is set: ${current.fast2sms_api_key_masked}`
            : "Not configured — login OTPs are only printed in the server console."}
        </p>
        <form onSubmit={handleSaveFast2sms} className="space-y-4">
          <div>
            <label className="text-slate-500 text-xs font-semibold mb-1.5 block">Authorization Key</label>
            <input
              type="password"
              placeholder="Enter to update"
              value={fast2smsKey}
              onChange={(e) => setFast2smsKey(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-slate-50 rounded-xl border border-transparent focus:outline-none focus:border-indigo-400 text-slate-900"
            />
          </div>
          <div>
            <label className="text-slate-500 text-xs font-semibold mb-1.5 block">OTP ID</label>
            <input
              placeholder="From Fast2SMS → WhatsApp OTP (e.g. 283277a6d7)"
              value={fast2smsOtpId}
              onChange={(e) => setFast2smsOtpId(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-slate-50 rounded-xl border border-transparent focus:outline-none focus:border-indigo-400 text-slate-900"
            />
          </div>
          {fast2smsMessage && <p className="text-xs font-semibold text-slate-500">{fast2smsMessage}</p>}
          <button
            type="submit"
            disabled={fast2smsSaving}
            className="bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-indigo-600 disabled:opacity-60"
          >
            {fast2smsSaving ? "Saving…" : "Save"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-slate-900 font-bold text-sm">Razorpay Payment Gateway</h2>
          {current?.razorpay_key_id?.startsWith("rzp_live_") && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">LIVE MODE</span>
          )}
          {current?.razorpay_key_id?.startsWith("rzp_test_") && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">TEST MODE</span>
          )}
        </div>
        <p className="text-slate-400 text-xs mb-4">
          {current?.has_razorpay_key_secret
            ? `Key Secret is set: ${current.razorpay_key_secret_masked}`
            : "Not configured yet — students won't be able to buy paid courses until you add your Razorpay keys."}
        </p>
        <form onSubmit={handleSaveRazorpay} className="space-y-4">
          <div>
            <label className="text-slate-500 text-xs font-semibold mb-1.5 block">Key ID</label>
            <input
              placeholder="rzp_live_… or rzp_test_…"
              value={razorpayKeyId}
              onChange={(e) => setRazorpayKeyId(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-slate-50 rounded-xl border border-transparent focus:outline-none focus:border-indigo-400 text-slate-900"
            />
          </div>
          <div>
            <label className="text-slate-500 text-xs font-semibold mb-1.5 block">Key Secret</label>
            <input
              type="password"
              placeholder="Enter to update"
              value={razorpayKeySecret}
              onChange={(e) => setRazorpayKeySecret(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-slate-50 rounded-xl border border-transparent focus:outline-none focus:border-indigo-400 text-slate-900"
            />
          </div>
          <div>
            <label className="text-slate-500 text-xs font-semibold mb-1.5 block">Webhook Secret</label>
            <input
              type="password"
              placeholder={current?.has_razorpay_webhook_secret ? `Set: ${current.razorpay_webhook_secret_masked}` : "Enter to update"}
              value={razorpayWebhookSecret}
              onChange={(e) => setRazorpayWebhookSecret(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-slate-50 rounded-xl border border-transparent focus:outline-none focus:border-indigo-400 text-slate-900"
            />
            <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
              In Razorpay Dashboard → Settings → Webhooks, add{" "}
              <code className="bg-slate-100 px-1 rounded text-slate-600 break-all">{current?.webhook_url || "/api/payments/webhook"}</code>{" "}
              with events <b>payment.captured</b>, <b>order.paid</b> and <b>payment.failed</b>, and paste the same secret
              here. This unlocks courses even if the app closes right after payment.
            </p>
          </div>
          {razorpayMessage && <p className="text-xs font-semibold text-slate-500">{razorpayMessage}</p>}
          <button
            type="submit"
            disabled={razorpaySaving}
            className="bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-indigo-600 disabled:opacity-60"
          >
            {razorpaySaving ? "Saving…" : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
}
