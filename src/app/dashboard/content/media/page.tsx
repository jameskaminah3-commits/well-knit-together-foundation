import { redirect } from "next/navigation";
import { MediaLibrary } from "@/components/media-library";
import { getAdminActor, hasContentAccess } from "@/lib/auth/admin-access";

export const metadata = { title: "Media library" };

export default async function MediaPage() {
  const actor = await getAdminActor();
  if (!actor.user) redirect("/login?next=/dashboard/content/media");
  if (!hasContentAccess(actor.roles, actor.assuranceLevel)) return <section className="dashboard-page narrow-page"><p className="eyebrow">Media library</p><h1>Verified editor access required.</h1></section>;
  return <section className="dashboard-page narrow-page"><p className="eyebrow">Content studio</p><h1>Media library.</h1><p className="lead muted">Upload accessible, consented media for editorial review. Private reports and sensitive files should use the private bucket through an approved server workflow.</p><MediaLibrary /></section>;
}
