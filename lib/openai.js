import { getSetting } from "@/lib/settings";

const DEFAULT_MODEL = "gpt-4o-mini";
const API_URL = "https://api.openai.com/v1/chat/completions";

export async function getOpenAIConfig() {
  const [apiKey, model] = await Promise.all([
    getSetting("openai_api_key"),
    getSetting("openai_model"),
  ]);
  return {
    apiKey: apiKey || process.env.OPENAI_API_KEY || "",
    model: model || process.env.OPENAI_MODEL || DEFAULT_MODEL,
  };
}

// Low-level chat call. Pass `json: true` to force a JSON object response.
async function chatComplete({ apiKey, model, messages, json = false, maxTokens }) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      ...(maxTokens ? { max_tokens: maxTokens } : {}),
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenAI request failed (${res.status}): ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned an empty response");
  return content;
}

function parseJsonContent(content) {
  try {
    return JSON.parse(content);
  } catch {
    throw new Error("OpenAI returned invalid JSON");
  }
}

// Returns an array of topic title strings for a course.
export async function generateCourseTopics({ apiKey, model, courseTitle, courseDescription }) {
  const messages = [
    {
      role: "system",
      content:
        "You are a curriculum designer for a competitive-exam prep platform in India (SSC, banking, railways). " +
        "Given a course name, return the standard list of topics students need to study for it, in a sensible learning order. " +
        "Respond with strict JSON only: {\"topics\": [\"Topic 1\", \"Topic 2\", ...]}.",
    },
    {
      role: "user",
      content: `Course title: ${courseTitle}\nCourse description/keywords: ${courseDescription || "N/A"}\n\nGenerate between 8 and 20 topics.`,
    },
  ];
  const content = await chatComplete({ apiKey, model, messages, json: true });
  const parsed = parseJsonContent(content);
  const topics = Array.isArray(parsed.topics) ? parsed.topics : [];
  return topics.map((t) => String(t).trim()).filter(Boolean);
}

// Returns structured, student-facing reading material for a topic as a plain object:
// { definition, real_life_example, key_points: [...], visual, formulas: [{title, formula, note}],
//   examples: [{question, steps: [...], answer}], tips: [...], mistakes: [...] }
// Shaped for a tabbed Learn / Formulas / Examples / Tips UI, in the requested language.
export async function generateTopicStructuredContent({ apiKey, model, courseTitle, topicTitle, language = "english" }) {
  const languageInstruction =
    language === "hindi"
      ? "Write every text value in simple, natural Hindi (Devanagari script), the way a friendly Indian tutor explains on a whiteboard. Keep technical/English terms (like Percentage, HCF, LCM) in English where that reads more naturally."
      : "Write every text value in simple, clear English.";

  const messages = [
    {
      role: "system",
      content:
        "You are a warm, patient tutor explaining a topic to a student who finds it confusing and is studying for a " +
        "competitive exam in India (SSC, banking, railways). Your only goal is that a weak student reads this once and " +
        "actually understands it — prioritize simplicity and relatable examples over sounding academic. " +
        "Respond with STRICT JSON only (no markdown fences, no LaTeX like \\[ \\] or \\text{}), matching exactly this shape:\n" +
        "{\n" +
        '  "definition": "one simple sentence defining the topic in everyday words",\n' +
        '  "real_life_example": "one short relatable Indian-context scenario (shopping, exam marks, cricket, salary, etc.) that introduces the idea before any formula",\n' +
        '  "key_points": ["short one-line fact", "... 4-6 items covering the core concept, each simple enough to read in 3 seconds"],\n' +
        '  "visual": "a simple text/ASCII diagram (bar split, number line, box, or arrow flow) as a single string with \\n line breaks, that visually represents the concept",\n' +
        '  "formulas": [{"title": "short name", "formula": "plain readable formula, e.g. Percentage = (Part / Whole) x 100", "note": "one-line when/why to use it"}],\n' +
        '  "examples": [{"question": "a full question using REAL NUMBERS about this exact topic", "steps": ["Step 1: ...", "Step 2: ..."], "answer": "final answer, short"}],\n' +
        '  "tips": ["short actionable shortcut/trick", "..."],\n' +
        '  "mistakes": ["short common mistake students make", "..."]\n' +
        "}\n" +
        "Rules: include 3-5 formulas (only ones genuinely relevant to this topic), exactly 3 fully worked examples " +
        "specifically about this exact topic (not generic/unrelated examples — e.g. for Percentage use a discount, a " +
        "marks, and a population-change problem), 4-6 tips, and 3-5 common mistakes. Keep every string plain text " +
        "(no markdown bold/headers inside the JSON strings). " +
        languageInstruction,
    },
    {
      role: "user",
      content: `Course: ${courseTitle}\nTopic: ${topicTitle}\n\nGenerate the complete structured content for this exact topic.`,
    },
  ];
  const content = await chatComplete({ apiKey, model, messages, json: true, maxTokens: 3000 });
  const parsed = parseJsonContent(content);

  return {
    definition: typeof parsed.definition === "string" ? parsed.definition : "",
    real_life_example: typeof parsed.real_life_example === "string" ? parsed.real_life_example : "",
    key_points: Array.isArray(parsed.key_points) ? parsed.key_points.filter((s) => typeof s === "string") : [],
    visual: typeof parsed.visual === "string" ? parsed.visual : "",
    formulas: Array.isArray(parsed.formulas)
      ? parsed.formulas
          .filter((f) => f && typeof f.title === "string" && typeof f.formula === "string")
          .map((f) => ({ title: f.title, formula: f.formula, note: typeof f.note === "string" ? f.note : "" }))
      : [],
    examples: Array.isArray(parsed.examples)
      ? parsed.examples
          .filter((e) => e && typeof e.question === "string")
          .map((e) => ({
            question: e.question,
            steps: Array.isArray(e.steps) ? e.steps.filter((s) => typeof s === "string") : [],
            answer: typeof e.answer === "string" ? e.answer : "",
          }))
      : [],
    tips: Array.isArray(parsed.tips) ? parsed.tips.filter((s) => typeof s === "string") : [],
    mistakes: Array.isArray(parsed.mistakes) ? parsed.mistakes.filter((s) => typeof s === "string") : [],
  };
}

// Returns an array of MCQ objects: { question, options: {a,b,c,d}, correct, explanation }
export async function generateTopicMcqBatch({
  apiKey,
  model,
  courseTitle,
  topicTitle,
  count,
  batchLabel,
  avoidQuestions = [],
}) {
  const avoidText = avoidQuestions.length
    ? `Do not repeat these already-used questions (write different ones):\n- ${avoidQuestions.slice(-30).join("\n- ")}`
    : "";

  const messages = [
    {
      role: "system",
      content:
        "You are a question-setter for competitive exams in India. Generate high-quality multiple-choice questions (MCQs) " +
        `for the given topic, covering a ${batchLabel} difficulty/style mix so a full set stays varied. ` +
        "Each question must have exactly 4 options and exactly one correct option, plus a short explanation of the correct answer. " +
        'Respond with strict JSON only, no markdown: {"mcqs": [{"question": "...", "options": {"a": "...", "b": "...", "c": "...", "d": "..."}, "correct": "a", "explanation": "..."}]}.',
    },
    {
      role: "user",
      content: `Course: ${courseTitle}\nTopic: ${topicTitle}\n\nGenerate exactly ${count} MCQs.\n${avoidText}`,
    },
  ];
  const content = await chatComplete({ apiKey, model, messages, json: true, maxTokens: 4000 });
  const parsed = parseJsonContent(content);
  const mcqs = Array.isArray(parsed.mcqs) ? parsed.mcqs : [];
  return mcqs.filter(
    (m) =>
      m &&
      typeof m.question === "string" &&
      m.options &&
      ["a", "b", "c", "d"].every((k) => typeof m.options[k] === "string") &&
      ["a", "b", "c", "d"].includes(m.correct)
  );
}

// Translates a batch of already-generated MCQs into Hindi, preserving order,
// option lettering and the correct answer. Returns objects shaped like the
// input plus a `question_hi`/`options_hi`/`explanation_hi`.
export async function translateMcqBatchToHindi({ apiKey, model, mcqs }) {
  const input = mcqs.map((m, i) => ({
    index: i,
    question: m.question,
    options: m.options,
    explanation: m.explanation || "",
  }));

  const messages = [
    {
      role: "system",
      content:
        "You translate competitive-exam MCQs from English to simple, natural Hindi (Devanagari script) for Indian " +
        "aspirants. Keep numbers, units and standard technical terms (like Percentage, HCF, LCM) as-is where that reads " +
        "more naturally. Preserve the exact same `index` for each item and do not change meaning, option order, or which " +
        "option is correct. Respond with strict JSON only: " +
        '{"mcqs": [{"index": 0, "question": "...", "options": {"a": "...", "b": "...", "c": "...", "d": "..."}, "explanation": "..."}]}.',
    },
    {
      role: "user",
      content: JSON.stringify(input),
    },
  ];
  const content = await chatComplete({ apiKey, model, messages, json: true, maxTokens: 4000 });
  const parsed = parseJsonContent(content);
  const translated = Array.isArray(parsed.mcqs) ? parsed.mcqs : [];

  const byIndex = new Map(translated.filter((t) => t && typeof t.index === "number").map((t) => [t.index, t]));

  return mcqs.map((m, i) => {
    const t = byIndex.get(i);
    if (!t || !t.options) return { ...m, question_hi: null, options_hi: null, explanation_hi: null };
    return {
      ...m,
      question_hi: t.question || null,
      options_hi: {
        a: t.options.a || null,
        b: t.options.b || null,
        c: t.options.c || null,
        d: t.options.d || null,
      },
      explanation_hi: t.explanation || null,
    };
  });
}
