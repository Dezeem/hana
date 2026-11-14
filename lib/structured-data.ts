import type { Work } from "./db/types";

const SCHEMA_TYPE = {
  movie: "Movie",
  series: "TVSeries",
  book: "Book",
  music: "MusicAlbum",
} as const;

/**
 * schema.org description of a single work, so search engines and link previews
 * understand the archive rather than seeing an anonymous page.
 */
export function workJsonLd(work: Work, baseUrl: string): Record<string, unknown> {
  const person = (name: string) => ({ "@type": "Person", name });

  const base: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": SCHEMA_TYPE[work.type],
    name: work.title,
    url: `${baseUrl}/work/${work.id}`,
    description: work.review || work.summary || undefined,
    image: work.cover ? `${baseUrl}${work.cover}` : undefined,
    datePublished: work.year ? String(work.year) : undefined,
    inLanguage: "zh-CN",
  };

  if (work.type === "book") {
    base.author = person(work.creator);
    base.publisher = work.meta.publisher ? { "@type": "Organization", name: work.meta.publisher } : undefined;
    base.isbn = work.meta.isbn || undefined;
    base.numberOfPages = work.meta.pages || undefined;
  } else if (work.type === "music") {
    base.byArtist = { "@type": "MusicGroup", name: work.creator };
  } else {
    base.director = person(work.creator);
    base.actor = work.meta.cast?.map(person);
  }

  if (work.rating !== null) {
    base.review = {
      "@type": "Review",
      author: person("Hana"),
      reviewBody: work.review || undefined,
      reviewRating: {
        "@type": "Rating",
        ratingValue: work.rating,
        bestRating: 5,
        worstRating: 0,
      },
    };
  }

  return base;
}
