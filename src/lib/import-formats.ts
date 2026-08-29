export type ImportedMussiRow = {
  sourceRow: number;
  dekor: string;
  dlugosc: number;
  szerokosc: number;
  sztuk: number;
  obrzeze: [number, number, number, number];
  sloje: boolean;
};

export type MussiTableResult = {
  rows: ImportedMussiRow[];
  errors: string[];
};

const aliases = {
  dekor: ["dekor", "material", "kod", "koddekoru", "plyta", "oznaczenie", "oznaczenienpfrez"],
  dlugosc: ["dlugosc", "dl", "wymiarx", "x"],
  szerokosc: ["szerokosc", "szer", "wymiary", "y"],
  sztuk: ["sztuk", "szt", "ilosc", "qty"],
  obrzeze: ["obrzeze", "obrzeza", "okleina", "oklejenie", "krawedzie"],
  sloje: ["sloje", "kieruneksloja", "kieruneksloi", "t"],
} as const;

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[łŁ]/g, "l")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function findColumn(headers: string[], names: readonly string[]) {
  return headers.findIndex((header) => names.includes(normalize(header)));
}

function numberFrom(value: string) {
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseEdges(value: string): [number, number, number, number] | null {
  if (!value.trim()) return [0, 0, 0, 0];
  const digits = value.replace(/[^0-2]/g, "").padStart(4, "0");
  if (digits.length !== 4) return null;
  const parsed = [...digits].map(Number);
  if (parsed.some((item) => item < 0 || item > 2)) return null;
  return parsed as [number, number, number, number];
}

function parseGrain(value: string) {
  return ["t", "x", "tak", "true", "1", "wzdluz", "wzdluzdlugosci"].includes(normalize(value));
}

export function parseDelimited(text: string): string[][] {
  const sample = text.split(/\r?\n/).find((line) => line.trim()) ?? "";
  const candidates = [";", "\t", ","] as const;
  const delimiter = candidates.reduce((best, candidate) =>
    sample.split(candidate).length > sample.split(best).length ? candidate : best,
  );
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(field.trim());
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field.trim());
      if (row.some((item) => item !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  row.push(field.trim());
  if (row.some((item) => item !== "")) rows.push(row);
  return rows;
}

export function parseMussiTable(table: string[][]): MussiTableResult {
  if (table.length < 2) return { rows: [], errors: ["Plik nie zawiera wierszy z formatkami."] };
  const headerIndex = table.findIndex((candidate) => {
    const normalized = candidate.map(normalize);
    return aliases.dlugosc.some((name) => normalized.includes(name)) &&
      aliases.szerokosc.some((name) => normalized.includes(name)) &&
      aliases.sztuk.some((name) => normalized.includes(name));
  });
  if (headerIndex < 0) {
    return { rows: [], errors: ["Nie znaleziono nagłówka klucza Mussi (Długość, Szerokość, Ilość)."] };
  }
  const headers = table[headerIndex];
  const columns = {
    dekor: findColumn(headers, aliases.dekor),
    dlugosc: findColumn(headers, aliases.dlugosc),
    szerokosc: findColumn(headers, aliases.szerokosc),
    sztuk: findColumn(headers, aliases.sztuk),
    obrzeze: findColumn(headers, aliases.obrzeze),
    sloje: findColumn(headers, aliases.sloje),
  };
  const missing = (["dlugosc", "szerokosc", "sztuk"] as const).filter((key) => columns[key] < 0);
  if (missing.length > 0) {
    return { rows: [], errors: [`Brakuje wymaganych kolumn: ${missing.join(", ")}.`] };
  }

  const rows: ImportedMussiRow[] = [];
  const errors: string[] = [];
  let inheritedDekor = "";
  table.slice(headerIndex + 1).forEach((source, index) => {
    const sourceRow = headerIndex + index + 2;
    const rawDekor = columns.dekor >= 0 ? source[columns.dekor]?.trim() ?? "" : "";
    if (rawDekor) inheritedDekor = rawDekor;
    const dlugosc = numberFrom(source[columns.dlugosc] ?? "");
    const szerokosc = numberFrom(source[columns.szerokosc] ?? "");
    const sztuk = Math.trunc(numberFrom(source[columns.sztuk] ?? ""));
    const obrzeze = parseEdges(columns.obrzeze >= 0 ? source[columns.obrzeze] ?? "" : "");
    const hasAnyFormatkaValue = dlugosc > 0 || szerokosc > 0 || sztuk > 0;
    if (!hasAnyFormatkaValue) return;
    if (dlugosc <= 0 || szerokosc <= 0 || sztuk <= 0) {
      errors.push(`Wiersz ${sourceRow}: długość, szerokość i liczba sztuk muszą być większe od zera.`);
      return;
    }
    if (!obrzeze) {
      errors.push(`Wiersz ${sourceRow}: obrzeże musi mieć cztery wartości 0, 1 lub 2.`);
      return;
    }
    rows.push({
      sourceRow,
      dekor: inheritedDekor,
      dlugosc,
      szerokosc,
      sztuk,
      obrzeze,
      sloje: columns.sloje >= 0 ? parseGrain(source[columns.sloje] ?? "") : false,
    });
  });
  return { rows, errors };
}

async function inflateRaw(data: Uint8Array) {
  const Stream = DecompressionStream as unknown as new (format: string) => TransformStream<Uint8Array, Uint8Array>;
  const payload = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  const stream = new Blob([payload]).stream().pipeThrough(new Stream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function unzip(buffer: ArrayBuffer) {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  let eocd = -1;
  for (let offset = Math.max(0, bytes.length - 65_557); offset <= bytes.length - 22; offset += 1) {
    if (view.getUint32(offset, true) === 0x06054b50) eocd = offset;
  }
  if (eocd < 0) throw new Error("Nie udało się odczytać struktury pliku XLSX.");
  const totalEntries = view.getUint16(eocd + 10, true);
  let cursor = view.getUint32(eocd + 16, true);
  const decoder = new TextDecoder();
  const entries = new Map<string, Uint8Array>();

  for (let index = 0; index < totalEntries; index += 1) {
    if (view.getUint32(cursor, true) !== 0x02014b50) break;
    const method = view.getUint16(cursor + 10, true);
    const compressedSize = view.getUint32(cursor + 20, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const localOffset = view.getUint32(cursor + 42, true);
    const name = decoder.decode(bytes.slice(cursor + 46, cursor + 46 + nameLength));
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = bytes.slice(dataStart, dataStart + compressedSize);
    if (method === 0) entries.set(name, compressed);
    if (method === 8) entries.set(name, await inflateRaw(compressed));
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

function columnIndex(reference: string) {
  const letters = reference.match(/[A-Z]+/i)?.[0]?.toUpperCase() ?? "A";
  return [...letters].reduce((sum, letter) => sum * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

async function parseXlsx(buffer: ArrayBuffer): Promise<string[][]> {
  const entries = await unzip(buffer);
  const decoder = new TextDecoder();
  const parser = new DOMParser();
  const sharedFile = entries.get("xl/sharedStrings.xml");
  const shared = sharedFile
    ? Array.from(parser.parseFromString(decoder.decode(sharedFile), "application/xml").querySelectorAll("si"))
        .map((item) => Array.from(item.querySelectorAll("t")).map((node) => node.textContent ?? "").join(""))
    : [];
  const sheetName = [...entries.keys()].filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(name)).sort()[0];
  const sheetFile = sheetName ? entries.get(sheetName) : undefined;
  if (!sheetFile) throw new Error("Plik XLSX nie zawiera arkusza.");
  const sheet = parser.parseFromString(decoder.decode(sheetFile), "application/xml");
  return Array.from(sheet.querySelectorAll("sheetData > row")).map((row) => {
    const output: string[] = [];
    row.querySelectorAll("c").forEach((cell) => {
      const index = columnIndex(cell.getAttribute("r") ?? "A1");
      const type = cell.getAttribute("t");
      const raw = cell.querySelector("v")?.textContent ?? "";
      const inline = Array.from(cell.querySelectorAll("is t")).map((node) => node.textContent ?? "").join("");
      output[index] = type === "s" ? shared[Number(raw)] ?? "" : type === "inlineStr" ? inline : raw;
    });
    return output;
  });
}

export async function readMussiFile(file: File): Promise<string[][]> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "xlsx") return parseXlsx(await file.arrayBuffer());
  if (extension === "csv" || extension === "tsv" || extension === "txt") {
    return parseDelimited(await file.text());
  }
  throw new Error("Obsługiwane formaty to CSV i XLSX.");
}
