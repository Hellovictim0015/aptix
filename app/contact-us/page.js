import LegalPageLayout from "@/components/LegalPageLayout";
import { Section, Bullets, A, ContactDetails } from "@/components/LegalSection";
import { COMPANY, POLICY_UPDATED } from "@/lib/company";

export const metadata = {
  title: "Contact Us — AptiX",
  description: "Get help with your AptiX account, courses or payments.",
};

export default function ContactUsPage() {
  return (
    <LegalPageLayout
      title="Contact Us"
      updatedAt={POLICY_UPDATED}
      currentPath="/contact-us"
      intro={`${COMPANY.app} is owned and operated by ${COMPANY.legalName}. We are happy to help with login, course access, payments, refunds and account deletion.`}
    >
      <Section title="Support">
        <ContactDetails subject="AptiX support" />
        <p>We usually reply within 1–2 business days.</p>
      </Section>

      <Section title="Business details">
        <Bullets
          items={[
            `Business name: ${COMPANY.legalName}`,
            `Product: ${COMPANY.app} — exam-preparation courses and practice tests (mobile app and website)`,
            ...(COMPANY.address ? [`Registered address: ${COMPANY.address}`] : []),
            ...(COMPANY.grievanceOfficer ? [`Grievance officer: ${COMPANY.grievanceOfficer}`] : []),
          ]}
        />
      </Section>

      <Section title="Quick help">
        <Bullets
          items={[
            <>
              Payment made but course locked, or want a refund? See the <A href="/refund-policy">Refund Policy</A>.
            </>,
            <>
              Want to delete your account? Follow the <A href="/delete-account">Delete Account steps</A>.
            </>,
            <>
              Questions about your data? Read our <A href="/privacy-policy">Privacy Policy</A>.
            </>,
          ]}
        />
      </Section>
    </LegalPageLayout>
  );
}
