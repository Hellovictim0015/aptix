import Link from "next/link";
import { query } from "@/lib/db";
import { loadCombos } from "@/lib/combos";
import { POLICY_PAGES } from "@/lib/company";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "AptiX — Crack Competitive Exams with Smart Practice",
  description:
    "AptiX helps students prepare for competitive exams with structured courses, AI-generated study material, and topic-wise practice tests with instant results.",
};

const CONTACT_EMAIL = "techbytexsoftware@gmail.com";

const NAV = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#courses", label: "Courses" },
  { href: "#faq", label: "FAQ" },
];

const FEATURES = [
  {
    icon: "📚",
    title: "Structured courses",
    text: "Every course is broken into focused topics so you always know what to study next — no more guessing.",
  },
  {
    icon: "✨",
    title: "AI-generated study notes",
    text: "Clear, exam-oriented notes for every topic, written to explain concepts quickly and help you revise faster.",
  },
  {
    icon: "📝",
    title: "Topic-wise practice tests",
    text: "MCQ tests for each topic with instant scoring and explanations, so you learn from every mistake.",
  },
  {
    icon: "📈",
    title: "Progress tracking",
    text: "See the topics you've completed, your test history, scores and time taken — all in one place.",
  },
  {
    icon: "🔐",
    title: "Password-free login",
    text: "Sign in with your mobile number and a one-time code sent on WhatsApp. Nothing to remember, nothing to leak.",
  },
  {
    icon: "💸",
    title: "Affordable combos",
    text: "Buy single courses or save more with combo bundles. Pay securely once, learn at your own pace.",
  },
];

const STEPS = [
  { title: "Download & sign in", text: "Install the AptiX app and log in with the OTP sent to your WhatsApp." },
  { title: "Pick your course", text: "Browse exam courses, preview topics, and unlock the ones you need." },
  { title: "Learn topic by topic", text: "Read concise AI-crafted notes built around what actually gets asked." },
  { title: "Practice & improve", text: "Take tests, review explanations, and watch your scores climb." },
];

const FAQS = [
  {
    q: "Who is AptiX for?",
    a: "Students preparing for competitive and aptitude-based exams who want structured study material and plenty of practice in one app.",
  },
  {
    q: "Do I need a password?",
    a: "No. AptiX uses passwordless login — enter your mobile number and we send a one-time password (OTP) to your WhatsApp every time you sign in.",
  },
  {
    q: "How do payments work?",
    a: "Courses and combos are paid once through a secure payment gateway. Your purchases appear in Purchase History inside the app.",
  },
  {
    q: "Can I use my account on multiple devices?",
    a: "Paid courses may be limited to a single device to protect content. You can contact support if you change phones.",
  },
  {
    q: "How do I delete my account?",
    a: "You can delete your account and all associated data anytime from the app or by following the steps on our Delete Account page.",
  },
];

async function getCatalog() {
  try {
    const [courses, combos] = await Promise.all([
      query(
        `SELECT id, title, image, seo_description, tags, price,
           (SELECT COUNT(*) FROM topics t WHERE t.course_id = c.id AND t.content_status = 'ready') AS topic_count
         FROM courses c WHERE c.status = 'published' ORDER BY c.created_at ASC LIMIT 6`
      ),
      loadCombos({ publicOnly: true }),
    ]);
    return { courses, combos };
  } catch (err) {
    console.error("Home page catalog load failed:", err.message);
    return { courses: [], combos: [] };
  }
}

function formatPrice(value) {
  const n = Number(value);
  if (!n) return "Free";
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function Logo({ light = false }) {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center shadow-sm">
        <span className="text-white font-black text-sm">A</span>
      </div>
      <span className={`font-black text-xl tracking-wide ${light ? "text-white" : "text-slate-900"}`}>APTIX</span>
    </Link>
  );
}

function SectionHeading({ eyebrow, title, text }) {
  return (
    <div className="max-w-2xl mx-auto text-center mb-12">
      <p className="text-indigo-600 font-bold text-sm uppercase tracking-widest mb-3">{eyebrow}</p>
      <h2 className="text-slate-900 font-black text-3xl sm:text-4xl leading-tight">{title}</h2>
      {text && <p className="text-slate-500 text-lg mt-4">{text}</p>}
    </div>
  );
}

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-64 sm:w-72">
      <div className="absolute -inset-6 bg-indigo-400/30 blur-3xl rounded-full" aria-hidden />
      <div className="relative rounded-[2.5rem] border-[10px] border-slate-900 bg-white shadow-2xl overflow-hidden">
        <div className="bg-indigo-600 px-5 pt-6 pb-5 text-white">
          <p className="text-xs opacity-80">Welcome back 👋</p>
          <p className="font-black text-lg">Keep your streak going</p>
          <div className="mt-4 bg-white/15 rounded-xl p-3">
            <div className="flex justify-between text-xs mb-2">
              <span>Course progress</span>
              <span className="font-bold">68%</span>
            </div>
            <div className="h-2 rounded-full bg-white/25">
              <div className="h-2 rounded-full bg-white w-[68%]" />
            </div>
          </div>
        </div>
        <div className="p-4 space-y-3 bg-slate-50">
          {[
            ["Quantitative Aptitude", "Percentages", "92%"],
            ["Logical Reasoning", "Blood Relations", "80%"],
            ["Verbal Ability", "Synonyms", "75%"],
          ].map(([course, topic, score]) => (
            <div key={topic} className="bg-white rounded-xl p-3 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">{course}</p>
                <p className="text-sm font-bold text-slate-800">{topic}</p>
              </div>
              <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">{score}</span>
            </div>
          ))}
          <div className="bg-indigo-600 text-white text-center text-sm font-bold rounded-xl py-3">Start Practice Test</div>
        </div>
      </div>
    </div>
  );
}

export default async function Home() {
  const { courses, combos } = await getCatalog();

  return (
    <div id="top" className="min-h-screen bg-white text-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex gap-8">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="text-slate-500 text-sm font-semibold hover:text-indigo-600">
                {n.label}
              </a>
            ))}
          </nav>
          <a
            href="#download"
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
          >
            Get the app
          </a>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 grid lg:grid-cols-2 gap-14 items-center">
            <div className="text-center lg:text-left">
              <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full mb-5">
                Courses · AI notes · Practice tests
              </span>
              <h1 className="text-slate-900 font-black text-4xl sm:text-5xl lg:text-6xl leading-[1.1] tracking-tight">
                Prepare smarter. <span className="text-indigo-600">Score higher.</span>
              </h1>
              <p className="text-slate-500 text-lg sm:text-xl mt-6 max-w-xl mx-auto lg:mx-0">
                AptiX is your pocket coach for competitive exams — structured courses, crisp AI-generated study
                material and topic-wise tests that show you exactly where to improve.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <a
                  href="#download"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-7 py-3.5 rounded-xl shadow-lg shadow-indigo-600/25 transition-colors"
                >
                  Start learning free
                </a>
                <a
                  href="#courses"
                  className="bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 font-bold px-7 py-3.5 rounded-xl transition-colors"
                >
                  Explore courses
                </a>
              </div>
              <div className="mt-10 flex justify-center lg:justify-start gap-8 text-left">
                {[
                  ["OTP", "secure login"],
                  ["100%", "exam-focused"],
                  ["0", "ads in app"],
                ].map(([big, small]) => (
                  <div key={small}>
                    <p className="text-slate-900 font-black text-2xl">{big}</p>
                    <p className="text-slate-400 text-sm">{small}</p>
                  </div>
                ))}
              </div>
            </div>
            <PhoneMockup />
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-20 py-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <SectionHeading
              eyebrow="Why AptiX"
              title="Everything you need to crack the exam"
              text="One app that combines learning, practice and progress tracking — built for focused preparation."
            />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl border border-slate-100 bg-white p-6 hover:shadow-lg hover:border-indigo-100 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-2xl mb-4">
                    {f.icon}
                  </div>
                  <h3 className="text-slate-900 font-bold text-lg mb-2">{f.title}</h3>
                  <p className="text-slate-500 leading-relaxed">{f.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-20 py-20 px-4 sm:px-6 bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <SectionHeading eyebrow="How it works" title="From download to top score in 4 steps" />
            <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {STEPS.map((s, i) => (
                <li key={s.title} className="bg-white rounded-2xl p-6 shadow-sm">
                  <span className="w-10 h-10 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center mb-4">
                    {i + 1}
                  </span>
                  <h3 className="text-slate-900 font-bold text-lg mb-2">{s.title}</h3>
                  <p className="text-slate-500">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Courses */}
        <section id="courses" className="scroll-mt-20 py-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <SectionHeading
              eyebrow="Courses"
              title="Popular courses on AptiX"
              text="Pick a course to get topic-wise notes and practice tests. More courses are added regularly."
            />
            {courses.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((c) => (
                  <div key={c.id} className="rounded-2xl border border-slate-100 overflow-hidden bg-white flex flex-col">
                    <div className="aspect-[16/9] bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                      {c.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.image} alt={c.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white/90 font-black text-4xl">{c.title.charAt(0)}</span>
                      )}
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="text-slate-900 font-bold text-lg">{c.title}</h3>
                      {c.seo_description && (
                        <p className="text-slate-500 text-sm mt-2 line-clamp-3">{c.seo_description}</p>
                      )}
                      <div className="mt-auto pt-4 flex items-center justify-between">
                        <span className="text-slate-400 text-sm">{Number(c.topic_count)} topics</span>
                        <span className="text-indigo-600 font-black">{formatPrice(c.price)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-400">New courses are launching soon. Download the app to get notified.</p>
            )}

            {combos.length > 0 && (
              <div className="mt-14 rounded-3xl bg-indigo-600 text-white p-8 sm:p-10">
                <h3 className="font-black text-2xl mb-2">Save more with combos</h3>
                <p className="text-indigo-100 mb-6">Bundle multiple courses together at a special price.</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {combos.map((cb) => (
                    <div key={cb.id} className="bg-white/10 rounded-2xl p-5">
                      <p className="text-indigo-100 text-sm font-semibold">{cb.label || `${cb.course_count}-Course Combo`}</p>
                      <p className="mt-1">
                        <span className="font-black text-3xl">{formatPrice(cb.combo_price)}</span>
                        {cb.original_price > cb.combo_price && (
                          <span className="text-indigo-200 line-through text-sm ml-2">{formatPrice(cb.original_price)}</span>
                        )}
                      </p>
                      <p className="text-indigo-200 text-xs mt-2">{cb.courses.map((x) => x.title).join(" · ")}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 py-20 px-4 sm:px-6 bg-slate-50">
          <div className="max-w-3xl mx-auto">
            <SectionHeading eyebrow="FAQ" title="Frequently asked questions" />
            <div className="space-y-3">
              {FAQS.map((f) => (
                <details key={f.q} className="group bg-white rounded-2xl p-5 shadow-sm">
                  <summary className="cursor-pointer list-none flex justify-between items-center font-bold text-slate-900">
                    {f.q}
                    <span className="text-indigo-600 text-xl transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="text-slate-500 mt-3 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Download CTA */}
        <section id="download" className="scroll-mt-20 py-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto rounded-3xl bg-slate-900 px-6 py-14 sm:px-14 text-center relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/40 blur-3xl rounded-full" aria-hidden />
            <h2 className="relative text-white font-black text-3xl sm:text-4xl">Your exam prep starts today</h2>
            <p className="relative text-slate-300 text-lg mt-4 max-w-xl mx-auto">
              Download the AptiX app, sign in with your mobile number and start your first practice test in minutes.
            </p>
            <div className="relative mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <span className="bg-white text-slate-900 font-bold px-7 py-3.5 rounded-xl">▶ Google Play — coming soon</span>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="border border-white/25 hover:border-white/60 text-white font-bold px-7 py-3.5 rounded-xl transition-colors"
              >
                Contact us
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative overflow-hidden bg-slate-950 text-slate-400">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[320px] bg-indigo-600/20 blur-3xl rounded-full" aria-hidden />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-10">
          <div className="grid gap-12 md:grid-cols-12">
            <div className="md:col-span-5">
              <Logo light />
              <p className="text-sm leading-relaxed mt-5 max-w-sm">
                AptiX helps students crack competitive exams with structured courses, AI-generated study notes and
                topic-wise practice tests — all in one app.
              </p>
              <div className="flex flex-wrap gap-2 mt-6">
                {["🔐 WhatsApp OTP login", "🚫 No ads", "💳 Secure payments"].map((t) => (
                  <span key={t} className="text-xs font-semibold bg-white/5 border border-white/10 text-slate-300 px-3 py-1.5 rounded-full">
                    {t}
                  </span>
                ))}
              </div>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex items-center gap-3 mt-7 group"
              >
                <span className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-300 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                  ✉
                </span>
                <span>
                  <span className="block text-[11px] uppercase tracking-widest text-slate-500">Need help?</span>
                  <span className="block text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors break-all">
                    {CONTACT_EMAIL}
                  </span>
                </span>
              </a>
            </div>

            <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
              <div>
                <p className="text-white font-bold text-sm mb-4">Explore</p>
                <ul className="space-y-3 text-sm">
                  {NAV.map((n) => (
                    <li key={n.href}>
                      <a href={n.href} className="hover:text-white transition-colors">
                        {n.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-white font-bold text-sm mb-4">Courses</p>
                <ul className="space-y-3 text-sm">
                  {courses.length > 0 ? (
                    courses.slice(0, 5).map((c) => (
                      <li key={c.id}>
                        <a href="#courses" className="hover:text-white transition-colors line-clamp-1">
                          {c.title}
                        </a>
                      </li>
                    ))
                  ) : (
                    <li>Coming soon</li>
                  )}
                </ul>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-white font-bold text-sm mb-4">Policies</p>
                <ul className="space-y-3 text-sm">
                  {POLICY_PAGES.map(({ href, label }) => (
                    <li key={href}>
                      <Link href={href} className="hover:text-white transition-colors">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-14 pt-6 border-t border-white/10 flex flex-col-reverse sm:flex-row items-center justify-between gap-4 text-xs">
            <p>
              © {new Date().getFullYear()} AptiX by <span className="text-slate-300 font-semibold">TechByteX</span>. All
              rights reserved.
            </p>
            <div className="flex items-center gap-5">
              <span>Made with ❤️ in India</span>
              <a
                href="#top"
                className="inline-flex items-center gap-1.5 font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-full transition-colors"
              >
                ↑ Back to top
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
