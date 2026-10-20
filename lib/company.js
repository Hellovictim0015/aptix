// Business details shown on the legal / policy pages (Play Store + Razorpay
// both check these). Fill in `address` with your registered business address
// before submitting to Razorpay — it is hidden on the pages while empty.
export const COMPANY = {
  app: "AptiX",
  legalName: "TechByteX",
  email: "techbytexsoftware@gmail.com",
  phone: "+91 88272 19873",
  phoneHref: "tel:+918827219873",
  address: "",
  supportHours: "Monday to Saturday, 10:00 AM – 6:00 PM IST",
  grievanceOfficer: "",
};

export const POLICY_UPDATED = "20 October 2026";

export const POLICY_PAGES = [
  { href: "/privacy-policy", label: "Privacy Policy", desc: "What data we collect, why, and how we protect it." },
  { href: "/terms-and-conditions", label: "Terms & Conditions", desc: "The rules for using the AptiX app and website." },
  { href: "/refund-policy", label: "Refund & Cancellation", desc: "When you can get a refund and how to request one." },
  { href: "/shipping-policy", label: "Shipping & Delivery", desc: "How and when purchased courses are delivered." },
  { href: "/delete-account", label: "Delete Account", desc: "Step-by-step guide to deleting your account and data." },
  { href: "/contact-us", label: "Contact Us", desc: "Support email, phone and business details." },
];
