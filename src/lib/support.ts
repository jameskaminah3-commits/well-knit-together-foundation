import type { BeneficiaryGroup } from "@/types/domain";
import { foundation } from "@/lib/site";

export const servedCounties = foundation.counties;

export const beneficiaryGroups: Array<{ value: BeneficiaryGroup; label: string }> = [
  { value: "caregiver_disability", label: "A caregiver of a child or person with a disability · Mlezi wa mtoto/mtu mwenye ulemavu" },
  { value: "caregiver_vulnerable_group", label: "A caregiver of a vulnerable person · Mlezi wa mtu aliye hatarini" },
  { value: "orphan_vulnerable_child", label: "An orphan or vulnerable child · Yatima au mtoto aliye hatarini" },
  { value: "person_with_disability", label: "A person with a disability · Mtu mwenye ulemavu" },
  { value: "economically_vulnerable_woman", label: "A woman seeking economic support · Mwanamke anayehitaji msaada wa kiuchumi" },
  { value: "wider_community", label: "Someone else in the community · Mtu mwingine katika jamii" },
];

/** [value, English label, Kiswahili label] */
export const needCategories = [
  ["caregiving", "Caregiving support", "Msaada wa malezi"],
  ["disability_support", "Disability support or equipment", "Msaada wa ulemavu au vifaa"],
  ["education", "School fees or learning", "Karo au masomo"],
  ["livelihood", "Income or skills training", "Kipato au mafunzo ya ujuzi"],
  ["health", "Health or wellbeing", "Afya au ustawi"],
  ["food", "Food or basic needs", "Chakula au mahitaji ya msingi"],
  ["protection", "Safety or protection", "Usalama au ulinzi"],
  ["documentation", "Documents or referral", "Vyeti au rufaa"],
  ["other", "Something else", "Jambo jingine"],
] as const;

export const urgencyOptions = [
  ["low", "Not urgent", "Si ya haraka"],
  ["normal", "Within the next few days", "Ndani ya siku chache"],
  ["high", "Please respond soon", "Tafadhali jibuni haraka"],
  ["urgent", "Urgent safety or immediate need", "Dharura ya usalama au hitaji la haraka"],
] as const;

export const supportStatuses = ["new", "in_review", "referred", "in_progress", "resolved", "closed"] as const;

export type SupportStatus = (typeof supportStatuses)[number];
