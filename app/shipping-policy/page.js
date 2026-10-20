import LegalPageLayout from "@/components/LegalPageLayout";
import { Section, Bullets, A, Callout, ContactDetails } from "@/components/LegalSection";
import { COMPANY, POLICY_UPDATED } from "@/lib/company";

export const metadata = {
  title: "Shipping & Delivery Policy — AptiX",
  description: "AptiX sells digital courses only — how and when your purchase is delivered.",
};

export default function ShippingPolicyPage() {
  return (
    <LegalPageLayout
      title="Shipping & Delivery Policy"
      updatedAt={POLICY_UPDATED}
      currentPath="/shipping-policy"
      intro={`${COMPANY.app} sells only digital products. No physical goods are shipped.`}
    >
      <Callout tone="emerald">
        Your course is delivered <strong>instantly inside the AptiX app</strong> as soon as payment succeeds — no
        shipping, no waiting, no delivery charges.
      </Callout>

      <Section title="1. Delivery method">
        <Bullets
          items={[
            "All courses and combo bundles are delivered digitally inside the AptiX mobile app, on the account (mobile number) used to make the purchase.",
            "Nothing is sent by post or courier, and no shipping or delivery fee is charged.",
          ]}
        />
      </Section>

      <Section title="2. Delivery time">
        <Bullets
          items={[
            "Access is normally granted within a few seconds of a successful payment.",
            "If your network drops during payment, the course is still unlocked automatically once Razorpay confirms the payment — usually within a few minutes.",
            "If a paid course is still locked after 24 hours, contact us with your Razorpay Payment ID and we will unlock it or refund you as per our Refund Policy.",
          ]}
        />
      </Section>

      <Section title="3. Where to find your purchase">
        <Bullets
          items={[
            "Open the course from the Home screen or My Learning — paid topics will now open.",
            "Every purchase is listed under Profile → Purchase History.",
          ]}
        />
      </Section>

      <Section title="4. Related policies">
        <p>
          See our <A href="/refund-policy">Refund & Cancellation Policy</A> and{" "}
          <A href="/terms-and-conditions">Terms & Conditions</A>.
        </p>
      </Section>

      <Section title="5. Contact">
        <ContactDetails subject="Course delivery issue" />
      </Section>
    </LegalPageLayout>
  );
}
