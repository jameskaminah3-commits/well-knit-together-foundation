export type AppRole =
  | "superadmin"
  | "admin"
  | "program_manager"
  | "finance"
  | "marketplace_manager"
  | "content_editor"
  | "donor"
  | "partner"
  | "volunteer"
  | "beneficiary";

export type BeneficiaryGroup =
  | "caregiver_disability"
  | "caregiver_vulnerable_group"
  | "orphan_vulnerable_child"
  | "person_with_disability"
  | "economically_vulnerable_woman"
  | "wider_community";

export type RecordStatus = "draft" | "published" | "archived";

export interface ProgramSummary {
  id: string;
  slug: string;
  title: string;
  summary: string;
  focusGroups: BeneficiaryGroup[];
  status: RecordStatus;
}

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  makerStory?: string;
  status: "draft" | "active" | "out_of_stock" | "archived";
}
