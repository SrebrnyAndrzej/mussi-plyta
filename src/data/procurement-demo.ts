import type { Akcesorium } from "@/data/akcesoria";
import type { Rezerwacja } from "@/lib/rezerwacje";

export type ProcurementUrgency = "krytyczne" | "pilne" | "planowe";
export type PurchaseOrderStatus = "Robocze" | "Wysłane" | "Potwierdzone" | "Dostawa częściowa" | "Przyjęte";

export type Supplier = {
  id: string;
  name: string;
  scope: string;
  leadTimeDays: number;
  contact: string;
  minimumOrderNet: number;
};

export type ProcurementRequest = {
  id: string;
  sku: string;
  supplierId: string;
  unit: string;
  required: number;
  neededBy: string;
  urgency: ProcurementUrgency;
  customerOrders: string[];
};

export type ProcurementDemand = ProcurementRequest & {
  name: string;
  unit: string;
  available: number;
  toOrder: number;
  unitNet: number;
  stockState: "zgodne" | "ponizej-minimum" | "brak";
};

export type PurchaseOrder = {
  id: string;
  supplierId: string;
  status: PurchaseOrderStatus;
  sentAt: string | null;
  expectedAt: string;
  valueNet: number;
  lines: Array<{ demandId: string; quantity: number; received: number }>;
  customerOrders: string[];
};

export const suppliers: Supplier[] = [
  { id: "blum", name: "Blum Polska", scope: "Prowadnice, zawiasy i systemy szuflad", leadTimeDays: 3, contact: "zamowienia@blum-demo.pl", minimumOrderNet: 1500 },
  { id: "hranipex", name: "Hranipex", scope: "Obrzeża ABS i kleje", leadTimeDays: 2, contact: "b2b@hranipex-demo.pl", minimumOrderNet: 600 },
  { id: "kronospan", name: "Kronospan", scope: "Płyty laminowane i HDF", leadTimeDays: 4, contact: "dostawy@kronospan-demo.pl", minimumOrderNet: 3500 },
  { id: "peka", name: "Peka", scope: "Cargo i wyposażenie kuchenne", leadTimeDays: 5, contact: "handel@peka-demo.pl", minimumOrderNet: 1200 },
];

/** Surowe stany. Dostępność i klasyfikację wylicza `src/lib/magazyn.ts`. */
export const procurementInventory: Akcesorium[] = [
  { sku: "BLU-TAND-500", nazwa: "Prowadnica Blum Tandem 500 mm", producent: "Blum", kategoria: "okucia", jednostka: "kpl", cena: 62, stanSystemowy: 4, rezerwacje: 4, stanMinimalny: 20 },
  { sku: "OB-5981-ABS2", nazwa: "Obrzeże ABS 2 mm 5981", producent: "Hranipex", kategoria: "obrzeza", jednostka: "mb", cena: 3.6, stanSystemowy: 147, rezerwacje: 95, stanMinimalny: 200 },
  { sku: "HDF-BIA-3", nazwa: "HDF biały 3 mm", producent: "Kronospan", kategoria: "okucia", jednostka: "opak", cena: 74, stanSystemowy: 31, rezerwacje: 9, stanMinimalny: 30 },
  { sku: "KR-5981-BS-18", nazwa: "Płyta 5981 BS Dąb Palmowy 18 mm", producent: "Kronospan", kategoria: "okucia", jednostka: "opak", cena: 220.72, stanSystemowy: 24, rezerwacje: 7, stanMinimalny: 24 },
  { sku: "PEK-CARGO-400", nazwa: "Kosz cargo Peka 400 mm", producent: "Peka", kategoria: "kosze", jednostka: "kpl", cena: 412, stanSystemowy: 7, rezerwacje: 3, stanMinimalny: 5 },
  { sku: "BLU-AVENT-HK", nazwa: "Podnośnik Blum Aventos HK", producent: "Blum", kategoria: "okucia", jednostka: "kpl", cena: 189, stanSystemowy: 18, rezerwacje: 6, stanMinimalny: 8 },
];

/** Istniejące blokady stanów potrzebne silnikowi rezerwacji do obliczenia pokrycia. */
export const procurementReservations: Rezerwacja[] = procurementInventory
  .filter((item) => item.rezerwacje > 0)
  .map((item) => ({
    id: `stan-poczatkowy-${item.sku}`,
    zamowienie: `istniejace-${item.sku}`,
    sku: item.sku,
    ilosc: item.rezerwacje,
    utworzona: "2026-08-31T08:00:00.000Z",
    wygasa: null,
    stan: "aktywna",
  }));

/** Zapotrzebowanie klientów bez powielonej dostępności i ilości do zakupu. */
export const procurementRequests: ProcurementRequest[] = [
  { id: "d-01", sku: "BLU-TAND-500", supplierId: "blum", unit: "kpl", required: 20, neededBy: "3 września", urgency: "krytyczne", customerOrders: ["M-2026-0842", "M-2026-0835"] },
  { id: "d-02", sku: "OB-5981-ABS2", supplierId: "hranipex", unit: "mb", required: 198, neededBy: "3 września", urgency: "krytyczne", customerOrders: ["M-2026-0842"] },
  { id: "d-03", sku: "HDF-BIA-3", supplierId: "kronospan", unit: "ark", required: 38, neededBy: "4 września", urgency: "pilne", customerOrders: ["M-2026-0847", "M-2026-0848"] },
  { id: "d-04", sku: "KR-5981-BS-18", supplierId: "kronospan", unit: "ark", required: 29, neededBy: "4 września", urgency: "pilne", customerOrders: ["M-2026-0847"] },
  { id: "d-05", sku: "PEK-CARGO-400", supplierId: "peka", unit: "kpl", required: 8, neededBy: "8 września", urgency: "planowe", customerOrders: ["M-2026-0835"] },
  { id: "d-06", sku: "BLU-AVENT-HK", supplierId: "blum", unit: "kpl", required: 15, neededBy: "8 września", urgency: "planowe", customerOrders: ["M-2026-0835"] },
];

export const initialPurchaseOrders: PurchaseOrder[] = [
  { id: "ZD-2026-0318", supplierId: "hranipex", status: "Potwierdzone", sentAt: "29 sierpnia, 09:14", expectedAt: "2 września, 11:00", valueNet: 1842.6, lines: [{ demandId: "d-02", quantity: 300, received: 0 }], customerOrders: ["M-2026-0842", "M-2026-0847"] },
  { id: "ZD-2026-0316", supplierId: "blum", status: "Dostawa częściowa", sentAt: "28 sierpnia, 14:06", expectedAt: "2 września, 08:30", valueNet: 3936, lines: [{ demandId: "d-01", quantity: 48, received: 28 }], customerOrders: ["M-2026-0842", "M-2026-0835"] },
  { id: "ZD-2026-0314", supplierId: "kronospan", status: "Wysłane", sentAt: "28 sierpnia, 10:22", expectedAt: "3 września", valueNet: 7824.32, lines: [{ demandId: "d-03", quantity: 32, received: 0 }, { demandId: "d-04", quantity: 24, received: 0 }], customerOrders: ["M-2026-0847", "M-2026-0848"] },
];

export function supplierById(id: string) {
  return suppliers.find((supplier) => supplier.id === id);
}
