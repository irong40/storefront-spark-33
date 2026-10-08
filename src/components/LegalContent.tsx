import type { LegalPage } from "@/config/page-content";

/** Body of the Privacy Policy and Terms pages. Copy lives in page-content.ts. */
export function LegalContent({ page }: { page: LegalPage }) {
  const last = page.sections.length - 1;
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">{page.h1}</h1>
      <p className="text-muted-foreground mb-4">{page.updated}</p>
      <p className="mb-4">{page.intro}</p>
      {page.sections.map((section, i) => (
        <section key={section.heading}>
          <h2 className="text-xl font-semibold mt-8 mb-4">{section.heading}</h2>
          <p className={i === last ? undefined : "mb-4"}>{section.body}</p>
        </section>
      ))}
    </div>
  );
}
