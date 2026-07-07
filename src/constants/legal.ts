export type LegalDocumentKey = "privacy" | "terms" | "data-compliance";

export type LegalSection = {
  title: string;
  body: string[];
  bullets?: string[];
};

export type LegalDocument = {
  key: LegalDocumentKey;
  title: string;
  eyebrow: string;
  updatedAt: string;
  summary: string;
  sections: LegalSection[];
};

export const LEGAL_CONTACT_EMAIL = "privacy@sociol.app";
export const LEGAL_COMPANY_NAME = "Sociol";
export const LEGAL_EFFECTIVE_DATE = "July 6, 2026";

const privacySections: LegalSection[] = [
  {
    title: "Who we are",
    body: [
      "This Privacy Policy explains how Sociol collects, uses, shares, retains, and protects information when you use our mobile app, websites, and related services.",
      "Sociol helps people form small in-person friend groups called Circles. Because that experience depends on profiles, matching, chat, location context, moderation, and account safety, we need to process personal information to provide the service.",
    ],
  },
  {
    title: "Information we collect",
    body: [
      "We collect information you provide directly, information created when you use Sociol, and limited information from service providers that help us operate the app.",
    ],
    bullets: [
      "Account information, such as your name, email address, authentication provider, user ID, account status, and role.",
      "Profile information, such as age, gender, education, interests, traits, bio, photos, videos, profile completion state, and verification state.",
      "Location information, such as permission state, approximate location, city, and location-derived matching context. We do not need to show your exact coordinates to other users.",
      "Circle and matching information, such as Circles you create or join, preferences, filters, swipes, pending swipes, matches, membership, free exits, and Circle status.",
      "Communications and content, such as chat messages, media shared in chats, polls, replies, reports, and moderation context.",
      "Safety information, such as blocked users, report history, moderation decisions, audit logs, suspended or banned status, and account deletion requests.",
      "Device, app, and diagnostic information, such as platform, app version, crash/error context, security logs, and basic usage events needed to run and secure the service.",
      "Purchase information, such as store platform, product ID, subscription status, transaction or purchase token, expiration, and restore status for Sociol+.",
    ],
  },
  {
    title: "How we use information",
    body: [
      "We use personal information to provide, personalize, secure, improve, and support Sociol.",
    ],
    bullets: [
      "Create and authenticate accounts.",
      "Build profiles and match people into Circles.",
      "Show swipe decks, Likes, Circle progress, chat, notifications, and profile controls.",
      "Support in-person meetups with approximate location and user-selected preferences.",
      "Process Sociol+ subscriptions through Apple App Store and Google Play Billing.",
      "Detect abuse, review reports, enforce our Terms, and protect users.",
      "Provide privacy, safety, data export, and account deletion tools.",
      "Debug crashes, prevent fraud, maintain security, and comply with legal obligations.",
    ],
  },
  {
    title: "Legal bases for processing",
    body: [
      "Where GDPR or similar law applies, we rely on different legal bases depending on the activity.",
    ],
    bullets: [
      "Contract: to create your account, provide matching, Circles, chat, notifications, settings, and Sociol+ features.",
      "Consent: for optional permissions or features, such as device permissions for location, media access, notifications, or other consent-based processing.",
      "Legitimate interests: to keep Sociol safe, prevent abuse and fraud, improve the app, debug issues, and operate secure services.",
      "Legal obligation: to comply with applicable law, respond to valid legal requests, and maintain records where required.",
      "Vital interests or public interest: only where necessary to protect someone from serious harm or as legally required.",
    ],
  },
  {
    title: "How we share information",
    body: [
      "We do not sell personal information. We share information only as needed to provide Sociol, comply with law, protect users, or with your direction.",
    ],
    bullets: [
      "With other users, such as profile details shown in swipe decks, Circles, Likes, chats, and Circle membership views.",
      "With service providers, such as Supabase for authentication, database, storage, realtime, and Edge Functions; Apple and Google for billing and sign-in where applicable; LiveKit for calls when enabled; and infrastructure or diagnostic providers we use to operate the app.",
      "With moderators and admins, when they review reports, enforce policies, investigate abuse, or support account safety.",
      "With legal or safety authorities, when required by law or when necessary to protect users, Sociol, or the public.",
      "In a business transfer, such as a merger, acquisition, financing, or sale of assets, subject to appropriate protections.",
    ],
  },
  {
    title: "Sensitive information",
    body: [
      "Some Sociol data may be considered sensitive under privacy laws, including precise location if you grant it, profile traits, gender, message content, photos, and moderation/safety information.",
      "We use sensitive information only to provide requested features, keep the app safe, comply with law, or with your consent where required. We do not use sensitive information to infer protected characteristics for advertising.",
    ],
  },
  {
    title: "Retention and deletion",
    body: [
      "We keep information for as long as needed to provide Sociol, maintain security, resolve disputes, enforce our Terms, comply with law, and support legitimate business needs.",
      "You can request account deletion in the app. When an account is deleted, we delete or de-identify personal information associated with the account unless retention is necessary for legal, fraud prevention, security, dispute resolution, or safety reasons.",
      "Some content may remain visible where technically or legally necessary, such as moderation logs, safety records, transaction records, or messages retained for other Circle members, but we will minimize retained personal information where practical.",
    ],
  },
  {
    title: "Your choices and rights",
    body: [
      "Depending on where you live, you may have rights to access, correct, delete, export, restrict, object to, or opt out of certain processing of your personal information.",
    ],
    bullets: [
      "Access and export: use Download my data in Privacy & safety or contact us.",
      "Correction: update your profile in the app or contact us for account data corrections.",
      "Deletion: use Delete account in Settings or contact us.",
      "Consent withdrawal: change device permissions, notification settings, privacy settings, or contact us.",
      "Opt out of sale/share: we do not sell personal information. If we ever share data for cross-context behavioral advertising, we will provide an appropriate opt-out.",
      "Non-discrimination: we will not discriminate against you for exercising privacy rights.",
    ],
  },
  {
    title: "California privacy rights",
    body: [
      "If you are a California resident, the CCPA/CPRA may give you rights to know what personal information we collect, access or delete personal information, correct inaccurate information, opt out of sale or sharing, limit certain uses of sensitive personal information, and avoid discrimination for exercising those rights.",
      "We do not sell personal information. We do not knowingly sell or share personal information of users under 16. You can submit requests through in-app tools or by contacting us.",
    ],
  },
  {
    title: "GDPR and international rights",
    body: [
      "If you are in the EEA, UK, or another region with similar laws, you may have rights to access, rectify, erase, restrict, object to processing, data portability, and lodge a complaint with your local supervisory authority.",
      "Sociol may process and store information in countries other than where you live. When data is transferred internationally, we use appropriate safeguards where required.",
    ],
  },
  {
    title: "Children and age limits",
    body: [
      "Sociol is not intended for children. You must meet the minimum age stated in our Terms of Use to create an account. We do not knowingly collect personal information from children below that age.",
    ],
  },
  {
    title: "Security",
    body: [
      "We use technical and organizational safeguards designed to protect personal information, including access controls, platform security, secure authentication, and role-based moderation/admin access.",
      "No system is perfectly secure. If you believe your account or information has been compromised, contact us immediately.",
    ],
  },
  {
    title: "Changes and contact",
    body: [
      `We may update this Privacy Policy as Sociol changes. If changes are material, we will provide notice in the app or by another reasonable method. Contact us at ${LEGAL_CONTACT_EMAIL} for privacy questions or requests.`,
    ],
  },
];

const termsSections: LegalSection[] = [
  {
    title: "Agreement to these Terms",
    body: [
      "These Terms of Use govern your access to and use of Sociol. By creating an account, signing in, tapping Continue, or using Sociol, you agree to these Terms and acknowledge our Privacy Policy.",
      "If you do not agree, do not use Sociol.",
    ],
  },
  {
    title: "Eligibility",
    body: [
      "You must be at least 18 years old, or the age of majority where you live if higher, to use Sociol. Sociol is designed for adults forming in-person friend groups.",
      "You must provide accurate account and profile information, keep your login credentials secure, and use your own account.",
    ],
  },
  {
    title: "What Sociol provides",
    body: [
      "Sociol helps users create and join small friend groups called Circles through profiles, preferences, swipes, matches, chat, notifications, and safety tools.",
      "Sociol does not guarantee matches, friendships, meetup attendance, compatibility, safety, or the conduct of any user.",
    ],
  },
  {
    title: "Offline meetups and safety",
    body: [
      "Sociol can help people discover Circles, but users are responsible for their own decisions when meeting offline.",
      "Use good judgment, meet in public places, tell someone where you are going, arrange your own transportation, and leave any situation that feels unsafe.",
    ],
  },
  {
    title: "User conduct",
    body: [
      "You agree not to misuse Sociol or harm other users.",
    ],
    bullets: [
      "No harassment, bullying, threats, hate, exploitation, sexual coercion, stalking, or abuse.",
      "No impersonation, fake profiles, deceptive conduct, spam, scams, or fraud.",
      "No illegal activity or encouragement of illegal or dangerous behavior.",
      "No posting or sharing content you do not have the right to share.",
      "No sexual content involving minors, non-consensual intimate content, or attempts to exploit anyone.",
      "No scraping, reverse engineering, automated account creation, security testing without permission, or interference with the service.",
      "No using Sociol to sell goods or services, recruit for unrelated activity, or advertise without permission.",
    ],
  },
  {
    title: "Content and license",
    body: [
      "You own the content you submit to Sociol, subject to rights held by others. You grant Sociol a worldwide, non-exclusive, royalty-free license to host, store, reproduce, display, transmit, adapt, and use your content as needed to operate, improve, promote, and protect Sociol.",
      "You are responsible for your content. Do not upload content that violates law, privacy, intellectual property rights, or these Terms.",
    ],
  },
  {
    title: "Moderation and enforcement",
    body: [
      "We may review reports, content, accounts, Circle activity, and safety signals. We may remove content, restrict features, suspend accounts, ban accounts, preserve records, or contact authorities when appropriate.",
      "Moderation decisions may rely on user reports, automated signals, staff review, and safety context. We are not obligated to monitor everything, but we may act when we believe it is necessary.",
    ],
  },
  {
    title: "Sociol+ and payments",
    body: [
      "Sociol+ is a digital subscription that, when available, must be purchased through Apple In-App Purchase on iOS or Google Play Billing on Android. Prices, periods, trials, renewals, and cancellation options are shown by the relevant app store before purchase.",
      "Subscriptions renew unless canceled according to Apple or Google rules. Refunds are handled by the relevant store unless we state otherwise. Staff access to Sociol+ features does not create a paid subscription.",
    ],
  },
  {
    title: "Account deletion and termination",
    body: [
      "You can delete your account in Settings. We may suspend, restrict, or terminate access if you violate these Terms, create risk, abuse the service, or if required by law.",
      "After termination, provisions that by nature should survive will remain in effect, including content licenses needed for operation, safety records, disclaimers, limitations of liability, and dispute terms.",
    ],
  },
  {
    title: "Disclaimers",
    body: [
      "Sociol is provided as is and as available. We do not promise uninterrupted service, error-free operation, specific matches, successful Circles, user conduct, or offline safety.",
      "To the maximum extent permitted by law, we disclaim warranties of merchantability, fitness for a particular purpose, non-infringement, and any warranties arising from course of dealing or usage of trade.",
    ],
  },
  {
    title: "Limitation of liability",
    body: [
      "To the maximum extent permitted by law, Sociol and its affiliates, officers, employees, contractors, and service providers will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or loss of profits, data, goodwill, or opportunities.",
      "Some jurisdictions do not allow certain limitations, so parts of this section may not apply to you.",
    ],
  },
  {
    title: "Changes and contact",
    body: [
      `We may update these Terms as Sociol evolves. If changes are material, we will provide reasonable notice. Contact us at ${LEGAL_CONTACT_EMAIL} with questions.`,
    ],
  },
];

const complianceSections: LegalSection[] = [
  {
    title: "Compliance overview",
    body: [
      "This Data & Compliance notice summarizes Sociol's privacy, safety, and data governance practices in plain language. It supplements the Privacy Policy and Terms of Use.",
      "It is designed to support app store review, user transparency, GDPR-style rights, and CCPA/CPRA-style rights.",
    ],
  },
  {
    title: "Data categories and purpose",
    body: [
      "Sociol collects data only where it supports account creation, profile setup, matching, Circle formation, chat, safety, compliance, billing, debugging, or user-requested privacy tools.",
    ],
    bullets: [
      "Identifiers: account ID, email, display name, auth provider, app account status.",
      "Profile data: age, gender, education, interests, traits, bio, photos, videos, verification state.",
      "Location data: permission state, approximate location, city, matching distance context.",
      "User activity: swipes, likes, Circle creation, Circle membership, chat activity, notifications, settings.",
      "Communications: chat messages, shared media, polls, replies, reports, support/moderation context.",
      "Commercial data: Sociol+ product ID, platform, transaction or purchase token, subscription status, expiration.",
      "Security data: logs, audit trails, moderation actions, blocked users, safety reports, fraud-prevention context.",
    ],
  },
  {
    title: "CCPA/CPRA coverage",
    body: [
      "California residents may have rights to know, access, delete, correct, opt out of sale/share, limit certain sensitive information use, and avoid discrimination for exercising rights.",
      "Sociol does not sell personal information. Sociol does not share personal information for cross-context behavioral advertising unless a future version clearly says so and offers required controls.",
    ],
  },
  {
    title: "GDPR coverage",
    body: [
      "Where GDPR or UK GDPR applies, Sociol provides transparency, purpose limitation, data minimization, rights access, correction, deletion, portability, objection/restriction paths, and contact routes for privacy requests.",
      "Processing bases include contract, consent, legitimate interests, legal obligations, and safety-related grounds where applicable.",
    ],
  },
  {
    title: "Data subject requests",
    body: [
      "Users can exercise many rights directly in the app.",
    ],
    bullets: [
      "Access/export: Privacy & safety > Download my data.",
      "Correction: Edit profile or contact privacy support.",
      "Deletion: Settings > Delete account.",
      "Visibility controls: Privacy & safety toggles.",
      "Location/notification/media permissions: device settings and in-app settings where available.",
      `Manual privacy requests: ${LEGAL_CONTACT_EMAIL}.`,
    ],
  },
  {
    title: "Retention policy",
    body: [
      "Account and profile data are retained while an account is active. Deleted account data is deleted or de-identified unless retention is needed for security, fraud prevention, legal compliance, transaction records, unresolved disputes, moderation history, or safety reasons.",
      "Chat and Circle records may have retention limits or may remain available to other Circle members depending on context. Moderation logs and report records may be retained longer to protect users and prevent repeat abuse.",
    ],
  },
  {
    title: "Processors and subprocessors",
    body: [
      "Sociol uses service providers to operate the app. Current expected processors include Supabase for auth/database/storage/realtime/Edge Functions, Apple and Google for sign-in and billing where used, and LiveKit for calls when enabled.",
      "Before production launch, Sociol should maintain a processor list, data processing agreements where appropriate, and records of processing for higher-risk activities.",
    ],
  },
  {
    title: "Security controls",
    body: [
      "Sociol uses Supabase authentication, row-level access controls, role-based admin/moderator authorization, secure storage for sessions, database audit logs for moderation, and backend verification for subscription entitlements.",
      "Before launch, Sociol should complete security review for storage buckets, RLS, Edge Function secrets, app store privacy labels, data safety forms, and incident response procedures.",
    ],
  },
  {
    title: "App store compliance checklist",
    body: [
      "Before submission, Sociol should keep these items true and up to date.",
    ],
    bullets: [
      "Privacy Policy URL is public, active, non-PDF, non-geofenced, and matches in-app disclosures.",
      "Privacy Policy link or text is available inside the app.",
      "Apple privacy nutrition labels and Google Play Data Safety are accurate.",
      "Account deletion is available in-app and through a public web resource.",
      "Sociol+ uses Apple In-App Purchase and Google Play Billing for digital subscriptions.",
      "Permission prompts have clear in-app context for location, media, and notifications.",
      "Legal documents include effective dates and contact information.",
    ],
  },
  {
    title: "Important note",
    body: [
      "This notice is an operational compliance summary. It is not a certification and does not replace legal advice. Sociol should have counsel review these documents before public launch, especially because the app includes location, user media, chat, reports, subscriptions, and offline meetups.",
    ],
  },
];

export const LEGAL_DOCUMENTS: Record<LegalDocumentKey, LegalDocument> = {
  privacy: {
    key: "privacy",
    title: "Privacy Policy",
    eyebrow: "Legal",
    updatedAt: LEGAL_EFFECTIVE_DATE,
    summary:
      "How Sociol collects, uses, shares, retains, and protects your information.",
    sections: privacySections,
  },
  terms: {
    key: "terms",
    title: "Terms of Use",
    eyebrow: "Legal",
    updatedAt: LEGAL_EFFECTIVE_DATE,
    summary:
      "The rules for using Sociol, creating Circles, chatting, meeting people, and using Sociol+.",
    sections: termsSections,
  },
  "data-compliance": {
    key: "data-compliance",
    title: "Data & Compliance",
    eyebrow: "Privacy",
    updatedAt: LEGAL_EFFECTIVE_DATE,
    summary:
      "A plain-language summary of Sociol's data categories, privacy rights, and compliance controls.",
    sections: complianceSections,
  },
};
