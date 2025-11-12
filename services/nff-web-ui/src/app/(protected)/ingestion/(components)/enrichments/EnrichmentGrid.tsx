"use client";

import { Enrichment, EnrichmentCard } from "./EnrichmentCard";

export function EnrichmentGrid({ items }: { items: Enrichment[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
      {items.map((c) => (
        <EnrichmentCard key={c.id} item={c} />
      ))}
    </div>
  );
}
