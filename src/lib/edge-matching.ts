export type MatchableProduct = {
  id: string;
  kod: string;
  nazwa: string;
  producent: string;
  opis?: string;
  dostepnosc?: "na-stanie" | "ostatnie-sztuki" | "na-zamowienie";
};

export type EdgeMatchReason = "code" | "name" | "fallback";

export type EdgeSuggestion<T extends MatchableProduct> = {
  product: T;
  reason: EdgeMatchReason;
  score: number;
};

const IGNORED_WORDS = new Set([
  "abs",
  "do",
  "kolorze",
  "laminat",
  "mm",
  "obrzeze",
  "plyta",
  "plyty",
  "w",
]);

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function codeRoot(value: string) {
  return normalize(value).split(" ").find((token) => /\d/.test(token)) ?? "";
}

function meaningfulWords(value: string) {
  return new Set(
    normalize(value)
      .split(" ")
      .filter((word) => word.length > 2 && !IGNORED_WORDS.has(word)),
  );
}

function scoreEdge(material: MatchableProduct, edge: MatchableProduct) {
  const materialCode = codeRoot(material.kod);
  const edgeHaystack = normalize(`${edge.kod} ${edge.nazwa} ${edge.opis ?? ""}`);
  const materialName = normalize(material.nazwa);
  const edgeName = normalize(edge.nazwa);
  let score = 0;
  let reason: EdgeMatchReason = "fallback";

  if (materialCode && edgeHaystack.split(" ").includes(materialCode)) {
    score += 100;
    reason = "code";
  }

  if (materialName && (edgeName.includes(materialName) || edgeHaystack.includes(materialName))) {
    score += 70;
    if (reason !== "code") reason = "name";
  }

  const materialWords = meaningfulWords(material.nazwa);
  const edgeWords = meaningfulWords(`${edge.nazwa} ${edge.opis ?? ""}`);
  const overlap = [...materialWords].filter((word) => edgeWords.has(word)).length;
  if (overlap > 0) {
    score += overlap * 16;
    if (reason === "fallback") reason = "name";
  }

  if (normalize(material.producent) === normalize(edge.producent)) score += 5;
  if (/w kolorze|dobieran/.test(normalize(`${edge.nazwa} ${edge.opis ?? ""}`))) score += 8;
  if (edge.dostepnosc === "na-stanie") score += 4;
  if (edge.dostepnosc === "na-zamowienie") score -= 2;

  return { score, reason };
}

export function suggestEdge<T extends MatchableProduct>(
  material: MatchableProduct | undefined,
  edges: T[],
): EdgeSuggestion<T> | null {
  if (!material || edges.length === 0) return null;

  return edges
    .map((product) => ({ product, ...scoreEdge(material, product) }))
    .sort((a, b) => b.score - a.score || a.product.kod.localeCompare(b.product.kod, "pl"))[0];
}
