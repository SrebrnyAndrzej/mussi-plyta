import { describe, expect, it } from "vitest";
import { suggestEdge, type MatchableProduct } from "@/lib/edge-matching";

const material: MatchableProduct = {
  id: "board-k003",
  kod: "K003 PW",
  nazwa: "Dąb Craft Złoty",
  producent: "Kronospan",
  opis: "Struktura porów drewna",
  dostepnosc: "na-stanie",
};

const genericEdge: MatchableProduct = {
  id: "generic",
  kod: "ABS 22x1",
  nazwa: "Obrzeże ABS w kolorze płyty",
  producent: "Hranipex",
  opis: "Dobierane do dekoru",
  dostepnosc: "na-stanie",
};

describe("dobór obrzeża", () => {
  it("preferuje identyczny kod dekoru", () => {
    const exactEdge: MatchableProduct = {
      ...genericEdge,
      id: "k003-edge",
      kod: "K003 ABS 22x1",
      nazwa: "Dąb Craft Złoty",
    };

    const result = suggestEdge(material, [genericEdge, exactEdge]);

    expect(result?.product.id).toBe("k003-edge");
    expect(result?.reason).toBe("code");
  });

  it("używa nazwy dekoru, gdy kod obrzeża jest inny", () => {
    const namedEdge: MatchableProduct = {
      ...genericEdge,
      id: "named-edge",
      kod: "HRA-204",
      nazwa: "Dąb Craft Złoty ABS",
    };

    const result = suggestEdge(material, [genericEdge, namedEdge]);

    expect(result?.product.id).toBe("named-edge");
    expect(result?.reason).toBe("name");
  });

  it("zwraca dostępne obrzeże ogólne jako bezpieczny fallback", () => {
    const result = suggestEdge(material, [genericEdge]);

    expect(result?.product.id).toBe("generic");
    expect(result?.reason).toBe("fallback");
  });

  it("zwraca null, gdy katalog obrzeży jest pusty", () => {
    expect(suggestEdge(material, [])).toBeNull();
  });
});
