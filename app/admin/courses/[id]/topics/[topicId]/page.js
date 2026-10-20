"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const TABS = [
  { key: "learn", label: "Learn" },
  { key: "formulas", label: "Formulas" },
  { key: "examples", label: "Examples" },
  { key: "tips", label: "Tips" },
];

function LearnTab({ data }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-slate-900 font-bold text-base mb-1">What is this?</h3>
        <p className="text-slate-700 text-sm leading-relaxed">{data.definition}</p>
      </div>

      {data.key_points?.length > 0 && (
        <div>
          <h3 className="text-slate-900 font-bold text-base mb-2">Key Points</h3>
          <ul className="space-y-2">
            {data.key_points.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-bold">
                  ✓
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.real_life_example && (
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
          <p className="text-orange-600 font-bold text-xs mb-1">Real-Life Example</p>
          <p className="text-slate-700 text-sm leading-relaxed">{data.real_life_example}</p>
        </div>
      )}

      {data.visual && (
        <div>
          <h3 className="text-slate-900 font-bold text-base mb-2">Visual Understanding</h3>
          <pre className="bg-slate-900 text-slate-100 text-xs rounded-xl p-4 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
            {data.visual}
          </pre>
        </div>
      )}
    </div>
  );
}

function FormulasTab({ data }) {
  if (!data.formulas?.length) return <p className="text-slate-400 text-sm">No formulas for this topic.</p>;
  return (
    <div className="space-y-3">
      {data.formulas.map((f, i) => (
        <div key={i} className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-orange-600 font-bold text-sm mb-1">{f.title}</p>
          <p className="text-slate-800 text-sm font-mono">{f.formula}</p>
          {f.note && <p className="text-slate-400 text-xs mt-1.5">{f.note}</p>}
        </div>
      ))}
    </div>
  );
}

function ExamplesTab({ data }) {
  if (!data.examples?.length) return <p className="text-slate-400 text-sm">No examples for this topic.</p>;
  return (
    <div className="space-y-4">
      {data.examples.map((ex, i) => (
        <div key={i} className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-slate-900 font-semibold text-sm mb-2">
            Q{i + 1}. {ex.question}
          </p>
          {ex.steps?.length > 0 && (
            <ol className="space-y-1 mb-2">
              {ex.steps.map((s, j) => (
                <li key={j} className="text-slate-600 text-sm">
                  {s}
                </li>
              ))}
            </ol>
          )}
          {ex.answer && (
            <p className="inline-block bg-emerald-50 text-emerald-700 font-bold text-xs px-3 py-1 rounded-lg">
              Answer: {ex.answer}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function TipsTab({ data }) {
  return (
    <div className="space-y-6">
      {data.tips?.length > 0 && (
        <div className="space-y-3">
          {data.tips.map((t, i) => (
            <div key={i} className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
              <span className="text-lg leading-none">💡</span>
              <p className="text-amber-900 text-sm leading-relaxed">{t}</p>
            </div>
          ))}
        </div>
      )}
      {data.mistakes?.length > 0 && (
        <div>
          <h3 className="text-slate-900 font-bold text-base mb-2">Common Mistakes to Avoid</h3>
          <div className="space-y-2">
            {data.mistakes.map((m, i) => (
              <div key={i} className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-start gap-2">
                <span className="text-rose-500 flex-shrink-0">⚠</span>
                <p className="text-rose-700 text-sm leading-relaxed">{m}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TopicDetailPage() {
  const { id, topicId } = useParams();
  const [topic, setTopic] = useState(null);
  const [content, setContent] = useState(null);
  const [contentHi, setContentHi] = useState(null);
  const [language, setLanguage] = useState("en");
  const [activeTab, setActiveTab] = useState("learn");
  const [mcqs, setMcqs] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [mcqPage, setMcqPage] = useState(0);
  const PAGE_SIZE = 10;

  function load() {
    fetch(`/api/admin/topics/${topicId}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setTopic(d.topic);
        setContent(d.content);
        setContentHi(d.content_hi);
        setMcqs(d.mcqs || []);
      });
  }

  useEffect(load, [topicId]);

  async function handleGenerate({ force = false } = {}) {
    if (isGenerated && !force) return;
    setGenerating(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/topics/${topicId}/generate-content`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not generate content");
        return;
      }
      setMcqPage(0);
      load();
    } catch {
      setError("Network error while generating content. This can take a couple of minutes for 100 MCQs — please wait and retry if it timed out.");
    } finally {
      setGenerating(false);
    }
  }

  if (!topic) return <p className="text-slate-400 text-sm">Loading…</p>;

  const isGenerated = topic.content_status === "ready";
  const pagedMcqs = mcqs.slice(mcqPage * PAGE_SIZE, mcqPage * PAGE_SIZE + PAGE_SIZE);
  const totalPages = Math.ceil(mcqs.length / PAGE_SIZE);

  return (
    <div className="max-w-4xl">
      <Link href={`/admin/courses/${id}`} className="text-indigo-500 text-xs font-semibold hover:underline">
        ← Back to {topic.course_title}
      </Link>
      <div className="flex items-center justify-between mt-1 mb-6">
        <h1 className="text-slate-900 font-black text-2xl">{topic.title}</h1>
        <div className="flex items-center gap-3">
          {isGenerated && !generating && (
            <button
              onClick={() => {
                if (confirm("This will replace the existing reading material and all 100 MCQs. Regenerate anyway?")) {
                  handleGenerate({ force: true });
                }
              }}
              className="text-xs font-semibold text-slate-400 hover:text-red-500 hover:underline"
            >
              Regenerate
            </button>
          )}
          <button
            onClick={() => handleGenerate()}
            disabled={generating || isGenerated}
            className="flex items-center gap-2 bg-violet-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-violet-600 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {generating ? (
              "✨ Generating (content + 100 MCQs)…"
            ) : isGenerated ? (
              "✓ Content Generated"
            ) : (
              "✨ AI Generate Content + 100 MCQs"
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm font-medium rounded-xl px-4 py-3 mb-4">{error}</div>
      )}
      {generating && (
        <div className="bg-amber-50 text-amber-700 text-sm font-medium rounded-xl px-4 py-3 mb-4">
          Generating reading material and 100 MCQs via OpenAI — this runs as several requests and can take 1–3
          minutes. Please don&apos;t close this tab.
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5">
          <h2 className="text-slate-900 font-bold text-sm">Reading Material</h2>
          {(content || contentHi) && (
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setLanguage("en")}
                disabled={!content}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors disabled:opacity-40 ${
                  language === "en" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage("hi")}
                disabled={!contentHi}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors disabled:opacity-40 ${
                  language === "hi" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"
                }`}
              >
                हिंदी
              </button>
            </div>
          )}
        </div>

        {content || contentHi ? (
          (() => {
            const data = language === "hi" ? contentHi || content : content || contentHi;
            return (
              <>
                <div className="flex gap-1 px-6 mt-4 border-b border-gray-100 overflow-x-auto">
                  {TABS.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setActiveTab(t.key)}
                      className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                        activeTab === t.key
                          ? "border-indigo-500 text-indigo-600"
                          : "border-transparent text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <div className="p-6">
                  {activeTab === "learn" && <LearnTab data={data} />}
                  {activeTab === "formulas" && <FormulasTab data={data} />}
                  {activeTab === "examples" && <ExamplesTab data={data} />}
                  {activeTab === "tips" && <TipsTab data={data} />}
                </div>
              </>
            );
          })()
        ) : (
          <p className="text-slate-400 text-sm px-6 pb-6">Not generated yet. Click the AI Generate button above.</p>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-slate-900 font-bold text-sm">MCQs ({mcqs.length})</h2>
            {mcqs.some((m) => m.question_hi) && (
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setLanguage("en")}
                  className={`px-2.5 py-0.5 rounded-md text-xs font-semibold transition-colors ${
                    language === "en" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLanguage("hi")}
                  className={`px-2.5 py-0.5 rounded-md text-xs font-semibold transition-colors ${
                    language === "hi" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"
                  }`}
                >
                  हिंदी
                </button>
              </div>
            )}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-2 text-xs">
              <button
                disabled={mcqPage === 0}
                onClick={() => setMcqPage((p) => Math.max(0, p - 1))}
                className="px-2 py-1 rounded-lg bg-slate-100 disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-slate-400">
                Page {mcqPage + 1} / {totalPages}
              </span>
              <button
                disabled={mcqPage >= totalPages - 1}
                onClick={() => setMcqPage((p) => Math.min(totalPages - 1, p + 1))}
                className="px-2 py-1 rounded-lg bg-slate-100 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {mcqs.length === 0 ? (
          <p className="text-slate-400 text-sm">No MCQs generated yet.</p>
        ) : (
          <div className="space-y-4">
            {pagedMcqs.map((m, i) => {
              const useHi = language === "hi" && m.question_hi;
              const question = useHi ? m.question_hi : m.question;
              const explanation = useHi ? m.explanation_hi || m.explanation : m.explanation;
              return (
                <div key={m.id} className="border border-gray-100 rounded-xl p-4">
                  <p className="text-slate-900 font-medium text-sm mb-2">
                    {mcqPage * PAGE_SIZE + i + 1}. {question}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {["a", "b", "c", "d"].map((k) => (
                      <div
                        key={k}
                        className={`px-3 py-1.5 rounded-lg ${
                          m.correct_option === k ? "bg-emerald-50 text-emerald-700 font-semibold" : "bg-slate-50 text-slate-600"
                        }`}
                      >
                        {k.toUpperCase()}. {useHi ? m[`option_${k}_hi`] || m[`option_${k}`] : m[`option_${k}`]}
                      </div>
                    ))}
                  </div>
                  {explanation && <p className="text-slate-400 text-xs mt-2">Explanation: {explanation}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
