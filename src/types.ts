export type InquirySource = "Email" | "Website" | "IndiaMART" | "CastForge 2026";
export type AIScore = "HOT" | "WARM" | "COLD";
export type InquiryStatus = "New" | "Replied" | "Sent to Feasibility" | "Closed";

export interface Inquiry {
  id: string; // SQC-INQ-###
  customer: string;
  country: string;
  source: InquirySource;
  part: string;
  alloy: string;
  qty: number;
  estValueLakhs: number;
  aiScore: AIScore;
  status: InquiryStatus;
  emailText: string;
  draftReply: string;
  ageHours: number;
}

export interface RfqSpecs {
  material: string;
  castWeightKg: number;
  qty: number;
  tolerance: string;
  nde: string; // Non-Destructive Examination (UT/PT/RT/etc.)
  machining: string;
}

export interface FeasibilityCheck {
  label: string;
  pass: boolean;
}

export interface CostingRow {
  item: string;
  costPerKg?: number;
  totalCost?: number;
}

export type RfqStatus = "Pending" | "Feasible" | "Costed" | "Quoted" | "Spec-locked";

export interface RFQ {
  id: string; // SQC-RFQ-2026-###
  inquiryId: string;
  specs: RfqSpecs;
  feasibilityChecks: FeasibilityCheck[];
  costingRows: CostingRow[];
  marginPct: number;
  status: RfqStatus;
  daysWaiting?: number; // Exactly one should be 6
  specSheet?: Record<string, { value: string; sourceTurn: number }>;
  turns?: number;
  completenessPct?: number;
}

export type QuoteStatus = "Draft" | "Approved" | "Sent" | "Won" | "Lost";

export interface Quote {
  id: string; // SQC-Q-2026-###
  rfqId: string;
  totalLakhs: number;
  validityDays: number; // default 30
  agingDays: number;
  status: QuoteStatus;
}

export type OrderStage = "Cast" | "Machine" | "QC" | "Pack" | "Ship";

export interface Order {
  id: string; // SQC-SO-2026-###
  quoteId: string;
  part: string;
  customer: string;
  destination: string;
  stage: OrderStage;
}

export type ProgramController = "Fanuc 0i-TF" | "Siemens 828D" | "Mitsubishi M80";
export type ProgramStatus = "Queued" | "Generated" | "Setter-approved";

export interface Program {
  id: string;
  orderId: string;
  controller: ProgramController;
  op10Code: string;
  op20Code: string;
  reviewMinutes: number;
  status: ProgramStatus;
}

export interface ShipmentDoc {
  name: string;
  status: "Generated" | "Pending";
}

export interface Shipment {
  id: string;
  orderId: string;
  docs: ShipmentDoc[];
  notified: boolean;
}

export interface AppEvent {
  id: string;
  timestampIST: string; // e.g. "02:14 IST" or full timestamp with "IST"
  module: string;
  message: string;
}

export interface AppStore {
  inquiries: Inquiry[];
  rfqs: RFQ[];
  quotes: Quote[];
  orders: Order[];
  programs: Program[];
  shipments: Shipment[];
  events: AppEvent[];
}
