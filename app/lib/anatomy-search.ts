import { normalize, type AnatomyItem } from "../data/anatomy";

type SearchDocument = {
  fields: string[];
  words: string[];
};

const searchCache = new WeakMap<AnatomyItem, SearchDocument>();

function documentFor(item: AnatomyItem): SearchDocument {
  const cached = searchCache.get(item);
  if (cached) return cached;

  const fields = [item.turkish, item.latin, item.group, ...item.aliases]
    .map(normalize)
    .filter(Boolean);
  const document = {
    fields,
    words: Array.from(new Set(fields.flatMap((field) => field.split(" ")))),
  };
  searchCache.set(item, document);
  return document;
}

function editDistanceWithin(left: string, right: string, maximum: number): number | null {
  if (Math.abs(left.length - right.length) > maximum) return null;
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    let rowMinimum = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const cost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      current[rightIndex] = Math.min(
        previous[rightIndex] + 1,
        current[rightIndex - 1] + 1,
        previous[rightIndex - 1] + cost,
      );
      rowMinimum = Math.min(rowMinimum, current[rightIndex]);
    }
    if (rowMinimum > maximum) return null;
    previous.splice(0, previous.length, ...current);
  }

  return previous[right.length] <= maximum ? previous[right.length] : null;
}

function scoreItem(item: AnatomyItem, query: string): number | null {
  const document = documentFor(item);
  let best = Number.POSITIVE_INFINITY;

  for (const field of document.fields) {
    if (field === query) best = Math.min(best, 0);
    else if (field.startsWith(query)) best = Math.min(best, 10 + field.length / 100);
    else {
      const position = field.indexOf(query);
      if (position >= 0) best = Math.min(best, 20 + position / 10 + field.length / 100);
    }
  }

  if (query.length >= 3 && !Number.isFinite(best)) {
    const maximum = query.length >= 8 ? 2 : 1;
    for (const word of document.words) {
      const distance = editDistanceWithin(query, word, maximum);
      if (distance !== null) best = Math.min(best, 40 + distance + word.length / 100);
    }
  }

  return Number.isFinite(best) ? best : null;
}

export function searchAnatomy(items: AnatomyItem[], rawQuery: string, limit = items.length): AnatomyItem[] {
  const query = normalize(rawQuery);
  if (!query) return items.slice(0, limit);

  return items
    .map((item) => ({ item, score: scoreItem(item, query) }))
    .filter((result): result is { item: AnatomyItem; score: number } => result.score !== null)
    .sort((left, right) => left.score - right.score || left.item.turkish.localeCompare(right.item.turkish, "tr"))
    .slice(0, limit)
    .map((result) => result.item);
}
