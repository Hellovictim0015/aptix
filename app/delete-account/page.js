import LegalPageLayout from "@/components/LegalPageLayout";
import { Section, Bullets, A, Callout, ContactDetails } from "@/components/LegalSection";
import { COMPANY, POLICY_UPDATED } from "@/lib/company";

export const metadata = {
  title: "Delete Your Account — AptiX",
  description: "Step-by-step guide to request permanent deletion of your AptiX account and data (completed within 7 days).",
};

const APP_STEPS = [
  { title: "Open the AptiX app", text: "Log in with the mobile number you want to delete." },
  { title: "Go to Profile", text: "Tap the Profile tab at the bottom-right of the screen." },
  { title: "Tap “Request Account Deletion”", text: "It is the red button at the bottom of the Profile page." },
  {
    title: "Read “Before you delete your account”",
    text: "The screen explains how deletion works and exactly what will be removed. You can add a reason (optional).",
  },
  {
    title: "Confirm and submit",
    text: "Tick “I understand…” and tap Request Account Deletion. The app confirms your request and shows the date by which your account will be deleted.",
  },
  {
    title: "Account deleted within 7 days",
    text: "Our team permanently deletes your account and data within 7 days. Until then you can keep using the app or tap “Cancel Deletion Request”.",
  },
];

export default function DeleteAccountPage() {
  return (
    <LegalPageLayout
      title="Delete Your AptiX Account"
      updatedAt={POLICY_UPDATED}
      currentPath="/delete-account"
      intro={`This page explains how to delete your ${COMPANY.app} account (developer: ${COMPANY.legalName}) and the data linked to it.`}
    >
      <Callout tone="amber">
        Deletion is <strong>permanent</strong>. Once completed, your progress, test history and access to purchased
        courses cannot be restored, and past purchases are not refunded.
      </Callout>

      <Section title="Option 1: Request deletion in the app (recommended)">
        <ol className="space-y-4 mt-2">
          {APP_STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-4">
              <span className="w-8 h-8 flex-shrink-0 rounded-full bg-indigo-600 text-white font-black text-sm flex items-center justify-center">
                {i + 1}
              </span>
              <div>
                <p className="text-slate-900 font-bold">{s.title}</p>
                <p className="text-slate-600 text-[15px]">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Option 2: Request deletion without the app">
        <p>If you have uninstalled the app or cannot log in:</p>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            Email <A href={`mailto:${COMPANY.email}?subject=${encodeURIComponent("Delete my AptiX account")}`}>{COMPANY.email}</A>{" "}
            with the subject <strong>&quot;Delete my AptiX account&quot;</strong>.
          </li>
          <li>Mention the mobile number you signed up with.</li>
          <li>We will verify that the number belongs to you (for example with an OTP on WhatsApp).</li>
          <li>Your account and data are deleted within 7 days, and we confirm by email.</li>
        </ol>
      </Section>

      <Section title="What is deleted">
        <Bullets
          items={[
            "Your account and login (mobile number).",
            "All topic progress and completion history.",
            "All practice-test attempts, answers and scores.",
            "Your purchase history and access to purchased courses.",
            "Device identifier used for the single-device rule.",
          ]}
        />
      </Section>

      <Section title="What may be kept">
        <Bullets
          items={[
            "Payment transaction records (amount, date, Razorpay payment ID) where we are required to keep them for tax and accounting law — kept only for as long as the law requires.",
            "A minimal record that your deletion request was received and completed.",
          ]}
        />
        <p>
          More details are in our <A href="/privacy-policy">Privacy Policy</A>.
        </p>
      </Section>

      <Section title="Need help?">
        <ContactDetails subject="Account deletion help" />
      </Section>
    </LegalPageLayout>
  );
}
