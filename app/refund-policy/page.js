import LegalPageLayout from "@/components/LegalPageLayout";
import { Section, Bullets, A, Callout, ContactDetails } from "@/components/LegalSection";
import { COMPANY, POLICY_UPDATED } from "@/lib/company";

export const metadata = {
  title: "Refund & Cancellation Policy — AptiX",
  description: "When AptiX course purchases can be refunded or cancelled, and how to request a refund.",
};

export default function RefundPolicyPage() {
  return (
    <LegalPageLayout
      title="Refund & Cancellation Policy"
      updatedAt={POLICY_UPDATED}
      currentPath="/refund-policy"
      intro={`This policy explains how payments, cancellations and refunds work for courses and combo bundles purchased on ${COMPANY.app}, operated by ${COMPANY.legalName}. Payments are processed securely by Razorpay.`}
    >
      <Callout tone="indigo">
        <strong>In short:</strong> courses are digital and unlock instantly, so purchases are generally
        non-refundable once you have accessed the content. You <strong>will</strong> get a full refund if you were
        charged twice, charged but the course did not unlock, or a technical problem on our side stops you from
        using what you paid for. Request within <strong>7 days</strong> of payment.
      </Callout>

      <Section title="1. What you are buying">
        <Bullets
          items={[
            "AptiX sells digital study material: individual courses and combo bundles of several courses, each unlocking topic-wise notes and practice tests inside the app.",
            "Each purchase is a one-time payment. There are no subscriptions, auto-renewals or hidden recurring charges.",
            "Prices are shown in Indian Rupees (₹) in the app before you pay and include any applicable taxes unless stated otherwise.",
            "Access is linked to your AptiX account (mobile number) and lasts for as long as the course is offered on AptiX and your account is active.",
          ]}
        />
      </Section>

      <Section title="2. Cancellation">
        <Bullets
          items={[
            "You can cancel any time before completing payment by closing the Razorpay checkout — you will not be charged.",
            "Because courses unlock immediately after successful payment, an order cannot be cancelled once the payment is complete. If you believe you are eligible for a refund, follow the refund steps below.",
            "If a payment fails or is interrupted, any amount debited is automatically reversed to your account by your bank or Razorpay, usually within 5–7 business days.",
          ]}
        />
      </Section>

      <Section title="3. When you are eligible for a refund">
        <p>We will issue a full refund in any of these cases:</p>
        <Bullets
          items={[
            "Duplicate payment — you were charged more than once for the same course or combo.",
            "Payment debited but the course was not unlocked within 24 hours, and our team cannot unlock it for you.",
            "A technical issue on our side prevents you from opening the purchased content and we cannot fix it within 7 days of you reporting it.",
            "You were charged an amount different from the price shown in the app at checkout.",
          ]}
        />
      </Section>

      <Section title="4. When refunds are not given">
        <Bullets
          items={[
            "You changed your mind after the course was unlocked and you have opened its notes or attempted its tests.",
            "You bought a course by mistake and accessed its content.",
            "You did not get the exam result you expected — AptiX does not guarantee any exam outcome.",
            "Access was restricted because of a violation of our Terms & Conditions (for example account sharing or attempting to bypass the single-device rule).",
            "You deleted your AptiX account after purchasing.",
            "The refund request is made more than 7 days after the payment date (except for duplicate or wrong-amount charges, which we review at any time).",
          ]}
        />
        <p>
          A purchase that has not been opened at all within 48 hours may be refunded on request at our discretion.
        </p>
      </Section>

      <Section title="5. How to request a refund">
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            Email <A href={`mailto:${COMPANY.email}?subject=${encodeURIComponent("Refund request")}`}>{COMPANY.email}</A>{" "}
            with the subject <strong>&quot;Refund request&quot;</strong>.
          </li>
          <li>
            Include your registered mobile number, the course/combo name, payment date, and the Razorpay Payment ID
            (starts with <code className="bg-slate-100 px-1 rounded">pay_</code>, shown in your payment confirmation
            or bank SMS).
          </li>
          <li>Briefly describe the problem and attach a screenshot if possible.</li>
          <li>We reply within 2 business days with a decision.</li>
        </ol>
      </Section>

      <Section title="6. How refunds are paid">
        <Bullets
          items={[
            "Approved refunds are made to the original payment method (UPI, card, net banking or wallet) through Razorpay. We cannot refund to a different account.",
            "We initiate approved refunds within 2 business days. Your bank or payment provider usually credits it within 5–7 business days after that.",
            "When a refund is issued, access to the refunded course(s) is removed from your account. For a combo, the whole bundle is refunded and removed together.",
          ]}
        />
      </Section>

      <Section title="7. Payment security">
        <p>
          All payments are handled by Razorpay, a PCI-DSS compliant payment gateway. AptiX never sees or stores your
          card number, CVV, UPI PIN or net-banking password.
        </p>
      </Section>

      <Section title="8. Contact for payment issues">
        <ContactDetails subject="Payment / refund query" />
      </Section>
    </LegalPageLayout>
  );
}
