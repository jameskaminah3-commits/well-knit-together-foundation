/**
 * Public identity of the foundation.
 *
 * Registration facts come from the NGOs Co-ordination Board register entry
 * (NGO-KJUYVK4). Personal identifiers from that document (ID numbers, personal
 * emails and personal phone numbers) are deliberately NOT published here.
 * Public contact channels are configured per environment so the team can
 * choose official numbers and inboxes without a code change.
 */

function env(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export const foundation = {
  name: "Well Knit Together",
  legalName: "Well Knit Together Global Foundation",
  tagline: "No caregiver should carry it alone.",
  description:
    "A Kenyan national NGO walking alongside women caregivers of children with disabilities—with practical support, skills training, and communities that make room for every child.",
  mission:
    "To improve the well-being, capacity, and economic empowerment of women caregivers of children with disabilities through support services, training, and community inclusion.",
  counties: ["Mombasa", "Kilifi", "Kwale", "Tana River", "Kajiado"],
  registration: {
    number: "NGO-KJUYVK4",
    authority: "NGOs Co-ordination Board, Kenya",
    act: "Non-Governmental Organisations Co-ordination Act, 1990 · Section 7(b)",
    scope: "National NGO",
  },
  address: {
    locality: "Nyali, Mombasa",
    postal: "P.O. Box 93175–80102, Mombasa, Kenya",
    country: "KE",
  },
  financialYear: "1 January – 31 December",
};

const digitsOnly = (value: string | null) => value?.replace(/[^\d]/g, "") ?? null;

export const contactChannels = {
  phone: env(process.env.NEXT_PUBLIC_CONTACT_PHONE),
  whatsapp: digitsOnly(env(process.env.NEXT_PUBLIC_CONTACT_WHATSAPP)),
  email: env(process.env.NEXT_PUBLIC_CONTACT_EMAIL),
  safeguardingEmail: env(process.env.NEXT_PUBLIC_SAFEGUARDING_EMAIL),
  officeHours: env(process.env.NEXT_PUBLIC_OFFICE_HOURS),
  streetAddress: env(process.env.NEXT_PUBLIC_STREET_ADDRESS),
};

export function hasDirectContact() {
  return Boolean(contactChannels.phone || contactChannels.whatsapp || contactChannels.email);
}

export function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** Direct giving channels shown when online checkout is not yet enabled. */
export const directGiving = {
  mpesaPaybill: env(process.env.NEXT_PUBLIC_MPESA_PAYBILL),
  mpesaAccount: env(process.env.NEXT_PUBLIC_MPESA_ACCOUNT),
  mpesaTill: env(process.env.NEXT_PUBLIC_MPESA_TILL),
  bankName: env(process.env.NEXT_PUBLIC_BANK_NAME),
  bankAccountName: env(process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME),
  bankAccountNumber: env(process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER),
  bankBranch: env(process.env.NEXT_PUBLIC_BANK_BRANCH),
  bankSwift: env(process.env.NEXT_PUBLIC_BANK_SWIFT),
};

export function hasDirectGiving() {
  return Boolean(directGiving.mpesaPaybill || directGiving.mpesaTill || (directGiving.bankName && directGiving.bankAccountNumber));
}

/** Online checkout is only offered where a payment provider is connected. */
export function onlinePaymentsEnabled() {
  return process.env.NODE_ENV !== "production" || process.env.PAYMENT_PROVIDER_ENABLED === "true";
}

/** Sample catalogue, events and campaigns are only for local design review. */
export function previewContentAllowed() {
  return process.env.NODE_ENV !== "production";
}

/** Officers listed on the registration record. Names and roles only. */
export const leadership = [
  { name: "Caroline Wanjiku Wandia Munyi", role: "Chairperson" },
  { name: "Samuel Lemayian Mbugua", role: "Secretary" },
  { name: "Sweetarms Njeri Senteu", role: "Treasurer" },
  { name: "Peter Kipyegon Cheruiyot", role: "Board member" },
  { name: "Dennis Kioko Mutuku", role: "Board member" },
];

export const focusGroups = [
  "Women caregivers of children with disabilities",
  "Caregivers of orphans, vulnerable children, older people, and people living with HIV",
  "Orphans and vulnerable children",
  "People with disabilities",
  "Women facing poverty",
  "The wider community",
];

/** How the foundation works, as registered with the NGOs Co-ordination Board. */
export const waysWeWork = [
  {
    title: "Training & skills",
    description: "Caregiver training, practical care skills, and income skills delivered in community groups.",
    icon: "training",
  },
  {
    title: "Equipment & materials",
    description: "Assistive devices and the everyday materials that make care and learning possible.",
    icon: "equipment",
  },
  {
    title: "School fees & learning",
    description: "School fees and learning materials so children with disabilities and vulnerable children can stay in school.",
    icon: "learning",
  },
  {
    title: "Safe spaces",
    description: "Facilities where caregivers meet, children play and learn, and support groups gather safely.",
    icon: "spaces",
  },
  {
    title: "Advocacy & advice",
    description: "Information, referrals, and advocacy that help families claim services and change attitudes about disability.",
    icon: "advocacy",
  },
] as const;

export const corePrograms = [
  {
    slug: "caregiver-support",
    eyebrow: "Care & wellbeing",
    title: "Caregiver support",
    description:
      "Peer support groups, practical guidance, referrals, and assistive equipment for women caring for children with disabilities.",
  },
  {
    slug: "skills-livelihoods",
    eyebrow: "Economic empowerment",
    title: "Skills & livelihoods",
    description:
      "Training, tools, and market access so caregivers can earn an income that fits around care.",
  },
  {
    slug: "education-advocacy",
    eyebrow: "Inclusion",
    title: "Education & advocacy",
    description:
      "School fees, learning materials, and community advocacy so children with disabilities are seen, included, and learning.",
  },
];

export const impactPillars = [
  { title: "Wellbeing", description: "Caregivers who are rested, supported, and connected to services and to each other." },
  { title: "Capacity", description: "Skills and confidence to care well, speak up, and lead in their communities." },
  { title: "Economic empowerment", description: "Dependable income that lets a family plan beyond the next week." },
  { title: "Community inclusion", description: "Neighbourhoods, schools, and places of worship where children with disabilities belong." },
];

/**
 * Homepage imagery comes only from the approved, consented media library.
 * When no approved photo exists, the page renders the foundation's own
 * artwork rather than borrowing third-party photographs.
 */
export type FoundationVisual = { src: string | null; alt: string; credit: string | null; label: string };

export const foundationVisuals: FoundationVisual[] = [
  { src: null, alt: "", credit: null, label: "Caregivers, together" },
  { src: null, alt: "", credit: null, label: "Learning together" },
  { src: null, alt: "", credit: null, label: "Community care" },
];
