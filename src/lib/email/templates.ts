type EmailAction = { label: string; url: string };

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

function layout(input: { preheader: string; eyebrow: string; title: string; paragraphs: string[]; details?: string[]; action?: EmailAction; footer?: string }) {
  const appUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const safe = (value: string) => escapeHtml(value);
  const detailHtml = input.details?.length ? `<div style="margin:24px 0;padding:18px 20px;background:#f5efe8;border-radius:14px;">${input.details.map((detail) => `<p style="margin:0 0 8px;color:#33444a;font-size:14px;">${safe(detail)}</p>`).join("")}</div>` : "";
  const actionHtml = input.action ? `<p style="margin:28px 0;"><a href="${safe(input.action.url)}" style="display:inline-block;background:#1f4549;color:#fff;padding:13px 20px;border-radius:999px;text-decoration:none;font-weight:700;">${safe(input.action.label)}</a></p>` : "";
  const html = `<!doctype html><html><body style="margin:0;background:#f7f3ee;color:#23383c;font-family:Arial,sans-serif;"><div style="display:none;max-height:0;overflow:hidden;">${safe(input.preheader)}</div><main style="max-width:620px;margin:0 auto;padding:36px 22px;"><div style="background:#fffdf9;border:1px solid #e6ddd3;border-radius:24px;padding:32px;"><p style="margin:0 0 14px;color:#b86d4d;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;font-weight:700;">${safe(input.eyebrow)}</p><h1 style="margin:0 0 20px;color:#1f4549;font:700 34px/1.1 Georgia,serif;">${safe(input.title)}</h1>${input.paragraphs.map((paragraph) => `<p style="margin:0 0 14px;color:#46575a;font-size:16px;line-height:1.65;">${safe(paragraph)}</p>`).join("")}${detailHtml}${actionHtml}<p style="margin:28px 0 0;color:#748083;font-size:12px;line-height:1.6;">${safe(input.footer ?? "Well Knit Together Global Foundation · Care is the thread. Community is the strength.")}</p></div><p style="padding:18px 4px;text-align:center;color:#8a9291;font-size:11px;">You are receiving this because you interacted with Well Knit Together.</p></main></body></html>`;
  const text = [input.eyebrow, input.title, ...input.paragraphs, ...(input.details ?? []), input.action ? `${input.action.label}: ${input.action.url}` : "", input.footer ?? `Well Knit Together Global Foundation · ${appUrl}`].filter(Boolean).join("\n\n");
  return { html, text };
}

export function applicationReceived(input: { kind: "partner" | "volunteer"; name: string; reference: string }) {
  const subject = input.kind === "partner" ? "We received your partnership interest" : "We received your volunteer interest";
  const content = layout({
    preheader: "Thank you for choosing to build with Well Knit Together.",
    eyebrow: "Thank you for building with us",
    title: "Your interest is safely with our team.",
    paragraphs: [`Hello ${input.name},`, "Thank you for taking the time to share how you would like to contribute. Our team will review the details and follow up when there is a useful next step."],
    details: [`Reference: ${input.reference}`, "We will only use the contact details you provided for this follow-up."],
    action: { label: "Explore the foundation", url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/about` },
  });
  return { subject, ...content };
}

export function applicationStatusUpdate(input: { kind: "partner" | "volunteer"; name: string; status: string; reference: string }) {
  const approved = input.status === "approved";
  const subject = `${input.kind === "partner" ? "Partnership" : "Volunteer"} application update`;
  return { subject, ...layout({ preheader: "There is an update on your application.", eyebrow: "Application update", title: approved ? "The next step is open." : "Your application has been reviewed.", paragraphs: [`Hello ${input.name},`, approved ? "Thank you for your patience. Our team has approved your application and will be in touch with the next practical step." : `Our team has reviewed your application and recorded the current status as ${input.status.replaceAll("_", " ")}. If you would like to ask a question, reply to this email.`,], details: [`Reference: ${input.reference}`, `Status: ${input.status.replaceAll("_", " ")}`], action: { label: "Explore the foundation", url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/about` } }) };
}

export function feedbackReceived(reference: string) {
  return { subject: "We received your feedback", ...layout({ preheader: "Your feedback helps us make the path easier.", eyebrow: "Thank you for helping us improve", title: "Your voice is in the circle.", paragraphs: ["Thank you for sharing what felt easy or difficult. Our team will review your feedback as part of the foundation’s ongoing improvement work."], details: [`Reference: ${reference}`], action: { label: "See the foundation", url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/impact` } }) };
}

export function supportReceived(reference: string) {
  return { subject: "We received your support request", ...layout({ preheader: "Your request is safely with the support team.", eyebrow: "Support request received", title: "You do not have to carry this alone.", paragraphs: ["We have received your request and a member of the support team will review it. Please keep this reference for future conversations."], details: [`Reference: ${reference}`, "For your privacy, this email does not include the details of your request."], action: { label: "Review safeguarding information", url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/safeguarding` } }) };
}

export function eventRegistration(input: { name: string; eventTitle: string; status: string; startsAt: string; location: string; reference: string }) {
  const statusMessage = input.status === "waitlisted" ? "You are currently on the waitlist. We will contact you if a place opens." : "Your place is reserved.";
  return { subject: `${input.status === "waitlisted" ? "Waitlist" : "Registration"}: ${input.eventTitle}`, ...layout({ preheader: statusMessage, eyebrow: "Learning and gathering", title: statusMessage, paragraphs: [`Hello ${input.name},`, `Your registration for ${input.eventTitle} has been recorded.`], details: [`When: ${new Date(input.startsAt).toLocaleString("en-KE", { dateStyle: "long", timeStyle: "short" })}`, `Where: ${input.location}`, `Reference: ${input.reference}`], action: { label: "View upcoming events", url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/events` } }) };
}

export function donationReceipt(input: { donorName: string; amount: string; currency: string; receiptNumber: string }) {
  return { subject: `Thank you for your gift · ${input.receiptNumber}`, ...layout({ preheader: "Your gift has been received.", eyebrow: "A gift with purpose", title: "Thank you for helping strengthen the circle.", paragraphs: [`Hello ${input.donorName},`, "Your gift has been reconciled successfully. Please keep this email with your receipt reference."], details: [`Amount: ${input.currency} ${input.amount}`, `Receipt: ${input.receiptNumber}`], action: { label: "See our impact", url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/impact` } }) };
}

export function donationFailed(input: { donorName: string; amount: string; currency: string }) {
  return { subject: "Your gift needs another step", ...layout({ preheader: "Your gift was not completed.", eyebrow: "Giving update", title: "Your gift was not completed.", paragraphs: [`Hello ${input.donorName},`, `The ${input.currency} ${input.amount} gift could not be reconciled. No successful gift has been recorded. You can try again whenever you are ready.`], action: { label: "Return to giving", url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/donate` } }) };
}

export function supportStatusUpdate(input: { reference: string; status: string }) {
  return { subject: `Support request update · ${input.reference}`, ...layout({ preheader: "There is an update on your support request.", eyebrow: "Support request update", title: "Your request has moved forward.", paragraphs: ["The support team has updated the status of your request. Please use your reference if you contact the foundation again."], details: [`Reference: ${input.reference}`, `Status: ${input.status.replaceAll("_", " ")}`, "For your privacy, this email does not include the details of your request."], action: { label: "Review safeguarding information", url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/safeguarding` } }) };
}

export function orderCreated(input: { orderId: string; total: string; currency: string }) {
  return { subject: `Order received · ${input.orderId.slice(0, 8).toUpperCase()}`, ...layout({ preheader: "Your marketplace order intent is safely recorded.", eyebrow: "Maker marketplace", title: "Your order is in the making.", paragraphs: ["We have recorded your order intent. Secure payment and fulfilment updates will follow once checkout is completed."], details: [`Order: ${input.orderId.slice(0, 8).toUpperCase()}`, `Total: ${input.currency} ${input.total}`], action: { label: "View your orders", url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/dashboard/orders` } }) };
}
