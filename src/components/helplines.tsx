/**
 * National, toll-free Kenyan helplines. Review these numbers at least once a
 * year as part of the safeguarding policy review.
 */
export const kenyanHelplines = [
  { number: "999", label: "Police & emergency", note: "Also 112 from any phone" },
  { number: "116", label: "Childline Kenya — child abuse or neglect", note: "Free · 24 hours" },
  { number: "1195", label: "National gender-based violence helpline", note: "Free · 24 hours" },
];

export function Helplines({ title = "If someone is in danger right now" }: { title?: string }) {
  return (
    <div className="helplines" role="region" aria-label="Emergency helplines">
      <strong>{title}</strong>
      <ul className="helpline-grid">
        {kenyanHelplines.map((line) => (
          <li key={line.number}><a href={`tel:${line.number}`}>{line.number}</a><span>{line.label}</span><small>{line.note}</small></li>
        ))}
      </ul>
    </div>
  );
}
