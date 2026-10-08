// Page SEO and main copy for the public pages.
//
// The React pages render this copy, and scripts/prerender.js writes the same
// copy into static HTML for crawlers that do not run JavaScript. Keeping it in
// one module means the prerendered HTML and the live page say the same thing.

import { HOURS_SUMMARY } from "@/config/business";

export interface PageSeoEntry {
  title: string;
  description?: string;
  noindex?: boolean;
}

export const PAGE_SEO = {
  home: {
    title: "Cold-Pressed Juice in Portsmouth, VA | imPRESSive Juice Bar",
    description: `Cold-pressed juice, $4 wellness shots and juice cleanses at 719 High St, Portsmouth, VA. Order online for pickup, ${HOURS_SUMMARY}.`,
  },
  products: {
    title: "Juice Bar Menu, Portsmouth VA | imPRESSive Juice Bar",
    description:
      "Full menu: cold-pressed juices, $4 wellness shots, juice cleanse packages, salads and parfaits. Pressed fresh in Portsmouth, VA. Order ahead for pickup.",
  },
  about: {
    title: "Our Story | imPRESSive Juice Bar, Portsmouth VA",
    description:
      "Founder Delisea Jackson started imPRESSive after her own juice cleanse. A family-owned Portsmouth, VA juice bar pressing fresh juice at 719 High St.",
  },
  contact: {
    title: "Hours & Pickup, 719 High St | imPRESSive Portsmouth",
    description: `imPRESSive Juice Bar, 719 High St, Portsmouth, VA 23704. Open ${HOURS_SUMMARY}. Call (757) 381-6980 or order online for pickup.`,
  },
  privacy: {
    title: "Privacy Policy",
    description:
      "How imPRESSive Juice Bar collects, uses and protects the information you share when you order online or contact us.",
  },
  terms: {
    title: "Terms of Service",
    description:
      "The terms that apply when you use the imPRESSive Juice Bar website and place orders for pickup in Portsmouth, VA.",
  },
  notFound: {
    title: "Page Not Found",
    noindex: true,
  },
} satisfies Record<string, PageSeoEntry>;

export const HOME_HERO = {
  tagline: "Cold-Pressed Happiness",
  h1Lead: "Cold-Pressed Juice in",
  h1Place: "Portsmouth, VA",
  subtitle: "Nourish Your Body, Elevate Your Day",
  description:
    "Fresh, cold-pressed juices crafted daily with love. No additives, no preservatives — just pure, vibrant nutrition in every sip.",
};

export const PRODUCTS_PAGE = {
  tagline: "Fresh & Natural",
  h1: "Fresh Cold-Pressed Juices, Wellness Shots & Cleanses",
  intro:
    "Fresh cold-pressed juices made daily. Choose from our selection of juices, wellness shots, and cleanse programs.",
};

export const ABOUT_PAGE = {
  tagline: "Our Story",
  h1: "Crafted with Love, Pressed with Purpose",
  lead: "From a trip to NYC to your community's favorite juice bar — here's how imPRESSive came to be.",
  founderLabel: "Meet the Founder",
  founderHeading: "Hi, I'm Delisea Jackson",
  founderLead: "And the benefits of juicing are nothing short of imPRESSive.",
  founderStory: [
    "One trip with lousy eating habits put me on this path. Now I'm here to hand you healthy choices in a bottle.",
    "Eating on the run every day can be terrible for your body, even worse when you take a trip out of town. No stove and those tiny refrigerators are a recipe for disaster. I was in New York City on a work trip, which is the Mecca of eating on the run.",
    "With my eating habits at an all-time low, my stomach declared its disappointment with me loud and clear. I was extremely bloated and feeling blah, so eventually, I came to my good senses and decided to stop pushing down junk food and try a juice cleanse.",
    "I'd heard of juice cleanses and had never tried one, but I knew I'd have to try something since I hit rock bottom. Desperation turned to curiosity which led to tons of research about the health benefits of various vegetables, fruits, herbs, and spices.",
  ],
  missionScript: "My Quest to",
  missionHeading: "imPRESS",
  mission:
    "Our vision is to become a trusted wellness brand that inspires everyday balance, nourishes communities, and proves that intentional nutrition can be both beautiful and delicious.",
};

export const CONTACT_PAGE = {
  h1: "Get in Touch",
  lead: "Have a question, feedback, or just want to say hello? We'd love to hear from you!",
};

export interface LegalPage {
  h1: string;
  updated: string;
  intro: string;
  sections: { heading: string; body: string }[];
}

export const PRIVACY_PAGE: LegalPage = {
  h1: "Privacy Policy",
  updated: "Last updated: April 2026",
  intro:
    'imPRESSive Juice Bar ("we", "us", or "our") is committed to protecting your privacy. This policy describes how we collect and use your information when you use our website or place an order.',
  sections: [
    {
      heading: "Information We Collect",
      body: "We collect information you provide directly, including name, email address, delivery address, and payment information (processed securely by Square — we never store card numbers).",
    },
    {
      heading: "Contact Us",
      body: "For privacy questions, contact us at the email or address on our Contact page.",
    },
  ],
};

export const TERMS_PAGE: LegalPage = {
  h1: "Terms of Service",
  updated: "Last updated: April 2026",
  intro:
    "By using the imPRESSive Juice Bar website, you agree to these Terms of Service. Please read them carefully.",
  sections: [
    {
      heading: "Orders and Payment",
      body: "All orders are subject to availability. Payment is processed securely through Square. We reserve the right to cancel orders at our discretion.",
    },
    {
      heading: "Pickup",
      body: "Online orders are for in-store pickup. Available pickup dates and times are shown at checkout and may change during store closures or holidays. See our Contact page for current hours.",
    },
    {
      heading: "Contact Us",
      body: "For questions about these terms, contact us at the email or address on our Contact page.",
    },
  ],
};

export const NOT_FOUND_PAGE = {
  h1: "404",
  text: "Oops! Page not found",
  link: "Return to Home",
};
