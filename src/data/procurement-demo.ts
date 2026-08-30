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

export type ProcurementDemand = {
  id: string;
  sku: string;
  name: string;
  supplierId: string;
  unit: string;
  required: number;
  available: number;
  toOrder: number;
  unitNet: number;
  neededBy: string;
  urgency: ProcurementUrgency;
  customerOrders: string[];
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

export const procurementDemand: ProcurementDemand[] = [
  { id: "d-01", sku: "BLU-TAND-500", name: "Prowadnica Blum Tandem 500 mm", supplierId: "blum", unit: "kpl", required: 20, available: 0, toOrder: 20, unitNet: 62, neededBy: "3 września", urgency: "krytyczne", customerOrders: ["M-2026-0842", "M-2026-0835"] },
  { id: "d-02", sku: "OB-5981-ABS2", name: "Obrzeże ABS 2 mm 5981", supplierId: "hranipex", unit: "mb", required: 198, available: 52, toOrder: 146, unitNet: 3.6, neededBy: "3 września", urgency: "krytyczne", customerOrders: ["M-2026-0842"] },
  { id: "d-03", sku: "HDF-BIA-3", name: "HDF biały 3 mm", supplierId: "kronospan", unit: "ark", required: 38, available: 22, toOrder: 16, unitNet: 74, neededBy: "4 września", urgency: "pilne", customerOrders: ["M-2026-0847", "M-2026-0848"] },
  { id: "d-04", sku: "KR-5981-BS-18", name: "Płyta 5981 BS Dąb Palmowy 18 mm", supplierId: "kronospan", unit: "ark", required: 29, available: 17, toOrder: 12, unitNet: 220.72, neededBy: "4 września", urgency: "pilne", customerOrders: ["M-2026-0847"] },
  { id: "d-05", sku: "PEK-CARGO-400", name: "Kosz cargo Peka 400 mm", supplierId: "peka", unit: "kpl", required: 8, available: 4, toOrder: 4, unitNet: 412, neededBy: "8 września", urgency: "planowe", customerOrders: ["M-2026-0835"] },
  { id: "d-06", sku: "BLU-AVENT-HK", name: "Podnośnik Blum Aventos HK", supplierId: "blum", unit: "kpl", required: 15, available: 12, toOrder: 3, unitNet: 189, neededBy: "8 września", urgency: "planowe", customerOrders: ["M-2026-0835"] },
];

export const initialPurchaseOrders: PurchaseOrder[] = [
  { id: "ZD-2026-0318", supplierId: "hranipex", status: "Potwierdzone", sentAt: "29 sierpnia, 09:14", expectedAt: "2 września, 11:00", valueNet: 1842.6, lines: [{ demandId: "d-02", quantity: 300, received: 0 }], customerOrders: ["M-2026-0842", "M-2026-0847"] },
  { id: "ZD-2026-0316", supplierId: "blum", status: "Dostawa częściowa", sentAt: "28 sierpnia, 14:06", expectedAt: "2 września, 08:30", valueNet: 3936, lines: [{ demandId: "d-01", quantity: 48, received: 28 }], customerOrders: ["M-2026-0842", "M-2026-0835"] },
  { id: "ZD-2026-0314", supplierId: "kronospan", status: "Wysłane", sentAt: "28 sierpnia, 10:22", expectedAt: "3 września", valueNet: 7824.32, lines: [{ demandId: "d-03", quantity: 32, received: 0 }, { demandId: "d-04", quantity: 24, received: 0 }], customerOrders: ["M-2026-0847", "M-2026-0848"] },
];

export function supplierById(id: string) {
  return suppliers.find((supplier) => supplier.id === id);
}

export function demandById(id: string) {
  return procurementDemand.find((item) => item.id === id);
}
