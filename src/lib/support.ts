import type { BeneficiaryGroup } from "@/types/domain";

export const beneficiaryGroups: Array<{ value: BeneficiaryGroup; label: string }> = [
  { value: "caregiver_disability", label: "Caregiver of a person with a disability" },
  { value: "caregiver_vulnerable_group", label: "Caregiver of a vulnerable person" },
  { value: "orphan_vulnerable_child", label: "Orphan or vulnerable child" },
  { value: "person_with_disability", label: "Person with a disability" },
  { value: "economically_vulnerable_woman", label: "Woman seeking economic support" },
  { value: "wider_community", label: "Wider community" },
];

export const needCategories = [
  ["food", "Food or basic needs"],
  ["health", "Health or wellbeing"],
  ["disability_support", "Disability support or equipment"],
  ["caregiving", "Caregiving support"],
  ["protection", "Safety or protection"],
  ["livelihood", "Livelihood or income"],
  ["education", "Education"],
  ["documentation", "Documentation or referral"],
  ["other", "Something else"],
] as const;

export const urgencyOptions = [
  ["low", "Low"],
  ["normal", "Within the next few days"],
  ["high", "High — please respond soon"],
  ["urgent", "Urgent safety or immediate need"],
] as const;

export const supportStatuses = ["new", "in_review", "referred", "in_progress", "resolved", "closed"] as const;

export type SupportStatus = (typeof supportStatuses)[number];
