import LegalPageLayout from "@/components/LegalPageLayout";
import { Section, Bullets, A, ContactDetails } from "@/components/LegalSection";
import { COMPANY, POLICY_UPDATED } from "@/lib/company";

export const metadata = {
  title: "Terms & Conditions — AptiX",
  description: "The terms that govern your use of the AptiX app, website, courses and payments.",
};

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms & Conditions"
      updatedAt={POLICY_UPDATED}
      currentPath="/terms-and-conditions"
      intro={`These Terms & Conditions ("Terms") govern your use of the ${COMPANY.app} mobile app and website (the "Service"), owned and operated by ${COMPANY.legalName} ("we", "us"). By creating an account, making a purchase or using the Service, you agree to these Terms. If you do not agree, please do not use the Service.`}
    >
      <Section title="1. Eligibility">
        <p>
          You must be at least 13 years old to use the Service. If you are under 18, you may use it only with the
          consent and supervision of a parent or guardian, who must make any purchase on your behalf.
        </p>
      </Section>

      <Section title="2. Account & login">
        <Bullets
          items={[
            "You sign in with your mobile number and a one-time password (OTP) sent to that number on WhatsApp. There is no password.",
            "Keep your phone and WhatsApp secure — anyone who can read your OTP can access your account.",
            "Use only a mobile number that belongs to you. One account is meant for one person; accounts must not be shared or sold.",
            "You are responsible for activity on your account.",
          ]}
        />
      </Section>

      <Section title="3. Courses & content">
        <Bullets
          items={[
            "Courses contain topic-wise study notes and practice tests. Some content is created with the help of AI tools and reviewed by our team.",
            "Content is for exam preparation and education. We try to keep it accurate but do not guarantee that every question, answer or explanation is error-free, or any exam result.",
            "We may add, update or remove topics and questions to improve a course.",
            "All content is owned by or licensed to us. You get a personal, non-transferable licence to use it inside the app. You may not copy, screenshot for distribution, resell, share or republish it.",
          ]}
        />
      </Section>

      <Section title="4. Pricing & payments">
        <Bullets
          items={[
            "Some courses are free; others require a one-time payment. Combo bundles let you buy several courses together at a discounted price.",
            "All prices are in Indian Rupees (₹) and are shown in the app before you pay. Prices and offers may change, but a change never affects a purchase you have already completed.",
            "Payments are processed securely by Razorpay using UPI, debit/credit cards, net banking or wallets. By paying, you also agree to Razorpay's terms.",
            "There are no subscriptions or automatic renewals. You are charged only when you confirm a payment.",
            "A course is unlocked on your account once the payment is confirmed. If a payment fails, any debited amount is reversed by your bank or Razorpay.",
            "We may refuse or cancel an order in case of suspected fraud or a pricing error, and will refund you in full if so.",
          ]}
        />
      </Section>

      <Section title="5. Refunds & cancellation">
        <p>
          Because courses are digital and unlock instantly, purchases are generally non-refundable once the content
          has been accessed. Refunds are given for duplicate charges, failed delivery or technical issues on our
          side, as described in our <A href="/refund-policy">Refund & Cancellation Policy</A>. Delivery is explained
          in our <A href="/shipping-policy">Shipping & Delivery Policy</A>.
        </p>
      </Section>

      <Section title="6. Course access & single-device rule">
        <Bullets
          items={[
            "Purchased courses stay available on your account for as long as the course is offered on AptiX and your account is active.",
            "To prevent account sharing, we may limit a purchased course's notes and tests to the first device it is opened on. The course list stays visible on other devices, but its content will not open there. Contact support if you change phones.",
          ]}
        />
      </Section>

      <Section title="7. Acceptable use">
        <p>You agree not to:</p>
        <Bullets
          items={[
            "Bypass payments, device-lock or any access control.",
            "Scrape, download in bulk, or extract course content or questions with automated tools.",
            "Reverse-engineer, decompile or interfere with the app or our servers.",
            "Use the Service for anything unlawful, or to harass others.",
          ]}
        />
        <p>
          We may suspend or close accounts that break these Terms. Access lost because of a violation is not
          refundable.
        </p>
      </Section>

      <Section title="8. Account deletion">
        <p>
          You can request deletion of your account at any time from the app (Profile → Request Account Deletion) or
          as described on our <A href="/delete-account">Delete Account</A> page. Your account and data are deleted
          within 7 days. Deletion removes access to purchased courses and does not entitle you to a refund.
        </p>
      </Section>

      <Section title="9. Disclaimer & limitation of liability">
        <p>
          The Service is provided &quot;as is&quot; and &quot;as available&quot;. We do not guarantee that it will
          always be uninterrupted or error-free, or that using it will lead to any particular exam result. To the
          maximum extent permitted by law, our total liability for any claim relating to the Service is limited to the
          amount you paid for the course concerned, and we are not liable for indirect or consequential losses.
        </p>
      </Section>

      <Section title="10. Governing law">
        <p>
          These Terms are governed by the laws of India. Any dispute will be subject to the jurisdiction of the
          courts where {COMPANY.legalName} is registered. Please contact us first — most issues can be solved quickly.
        </p>
      </Section>

      <Section title="11. Changes to these Terms">
        <p>
          We may update these Terms. Changes are posted on this page with a new &quot;Last updated&quot; date, and
          continued use of the Service means you accept them.
        </p>
      </Section>

      <Section title="12. Contact">
        <ContactDetails subject="Question about Terms" />
      </Section>
    </LegalPageLayout>
  );
}
