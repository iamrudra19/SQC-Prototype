import { AppStore, Inquiry, RFQ, Quote, Order, Program, Shipment, AppEvent } from "./types";

// Seed inquiries (exactly 12)
const seedInquiries: Inquiry[] = [
  {
    id: "SQC-INQ-001",
    customer: "KSB SE",
    country: "Germany",
    source: "Email",
    part: "Pump Impeller",
    alloy: "CA6NM",
    qty: 500,
    estValueLakhs: 38.5,
    aiScore: "HOT",
    status: "New",
    emailText: "Dear SQC Team, We are looking to source high-quality pump impeller castings in CA6NM alloy. Volume is 500 pcs. Drawing and technical specs attached. Please share your feasibility report and quote at the earliest. Best regards, Hans Werner, KSB SE.",
    draftReply: "Subject: RE: SQC-INQ-001 - Inquiry for Pump Impeller (CA6NM)\n\nDear Mr. Hans Werner,\n\nThank you for reaching out to Super Quali Cast. We have received your drawing for the Pump Impeller in CA6NM. Our engineering team at Unit-2, Shapar is review the specifications (lost-wax investment casting, 500 pcs) and checking machining compatibility. We will share the Feasibility Report and costing sheet by tomorrow.\n\nSincerely,\nSavan Chapani\nDirector, Super Quali Cast",
    ageHours: 2,
  },
  {
    id: "SQC-INQ-002",
    customer: "Hayward Flow Control",
    country: "USA",
    source: "Email",
    part: '2" Gate Valve Body',
    alloy: "ASTM A351 CF8M",
    qty: 1200,
    estValueLakhs: 52.0,
    aiScore: "HOT",
    status: "Replied",
    emailText: "Hello, Please quote for 1,200 pieces of our 2 inch gate valve bodies. The material is ASTM A351 CF8M stainless steel. Strict wall thickness tolerances are required (+/- 0.3mm). Let us know if you need any additional CAD files.\n\nThank you,\nSarah Jenkins\nHayward Flow Control",
    draftReply: "Subject: RE: SQC-INQ-002 - Quoting for 2\" Gate Valve Body (ASTM A351 CF8M)\n\nDear Sarah,\n\nWe have prepared our formal offer for the 1,200 pieces of 2\" Gate Valve Body in CF8M. As requested, we will maintain the tight +/-0.3mm wall thickness tolerance using our precision wax injection tooling. The quote has been transmitted via SQC-Q-2026-001.\n\nBest regards,\nSavan Chapani",
    ageHours: 6,
  },
  {
    id: "SQC-INQ-003",
    customer: "Rotork Controls",
    country: "UK",
    source: "Email",
    part: "Actuator Housing",
    alloy: "WCB",
    qty: 300,
    estValueLakhs: 14.2,
    aiScore: "WARM",
    status: "Replied",
    emailText: "Hi, We have a requirement for 300 units of Actuator Housings in cast carbon steel ASTM A216 WCB. Our machine shop has some tight concentricity criteria on the inner bore. Please advise if Unit-2 Shapar has VMC capability to deliver pre-machined parts.\n\nRegards,\nDavid Vance",
    draftReply: "Subject: RE: SQC-INQ-003 - Actuator Housing machined castings\n\nDear David,\n\nYes, absolutely. Our Unit-2 Shapar machine shop is equipped with high-accuracy VMC (Vertical Machining Centers) and high-speed CNC turning centers. We can fully machine the WCB Actuator Housing, inspect it using our Zeiss CMM, and ship pre-machined pieces. Our team is working on the detailed costing.",
    ageHours: 24,
  },
  {
    id: "SQC-INQ-004",
    customer: "CastForge 2026 lead",
    country: "Stuttgart, Germany",
    source: "CastForge 2026",
    part: "Duplex SS impeller samples",
    alloy: "CD4MCu / ASTM A890",
    qty: 5,
    estValueLakhs: 9.0,
    aiScore: "WARM",
    status: "New",
    emailText: "Met Savan Chapani at CastForge Stuttgart 2026 booth. Interested in getting rapid samples for Duplex SS impellers. Quantity is 5 prototype pieces. Quality test certificates (NDE dye penetrant and radiography) are required.",
    draftReply: "Subject: RE: CastForge Stuttgart 2026 - Duplex Impeller Samples\n\nDear Team,\n\nIt was a pleasure meeting you at CastForge 2026. We would love to cast your 5 prototype impeller samples in CD4MCu. We can perform 100% dye penetrant testing in-house and arrange radiography at certified labs in Rajkot. We will share a proposal soon.",
    ageHours: 3,
  },
  {
    id: "SQC-INQ-005",
    customer: "Flowserve",
    country: "USA",
    source: "Website",
    part: "Control Valve Plug",
    alloy: "CA15",
    qty: 250,
    estValueLakhs: 18.0,
    aiScore: "WARM",
    status: "Sent to Feasibility",
    emailText: "Form submission: Inquiry for CA15 (12% Cr steel) Control Valve Plugs, Qty 250. Drawing attached. Hardness target: 220-250 BHN post-heat-treatment.",
    draftReply: "Subject: RE: Flowserve - Control Valve Plug Inquiry (CA15)\n\nDear Flowserve sourcing team,\n\nYour inquiry for 250 Control Valve Plugs has been forwarded to our technical team for casting feasibility and hardening validation. Our electric induction furnaces are fully capable of melting CA15, and we do in-house tempering to achieve your desired 220-250 BHN hardness.",
    ageHours: 12,
  },
  {
    id: "SQC-INQ-006",
    customer: "L&T Valves",
    country: "India",
    source: "IndiaMART",
    part: "4\" Butterfly Disc",
    alloy: "CF8M",
    qty: 800,
    estValueLakhs: 22.5,
    aiScore: "HOT",
    status: "Replied",
    emailText: "Urgent domestic requirement for 4\" Butterfly Valve Discs in CF8M. Qty 800. Fast delivery expected. Please quote best price ex-works Rajkot.",
    draftReply: "Subject: Quote for 4\" Butterfly Valve Discs - CF8M\n\nDear L&T Valves Team,\n\nThank you for the domestic IndiaMART inquiry. We have prepared an optimized ex-works Rajkot quote under SQC-Q-2026-005. Standard casting delivery from Unit-1 Shapar and machining at Unit-2.",
    ageHours: 18,
  },
  {
    id: "SQC-INQ-007",
    customer: "Velan Valves",
    country: "Canada",
    source: "Email",
    part: "Globe Valve Bonnet",
    alloy: "WCB",
    qty: 450,
    estValueLakhs: 29.8,
    aiScore: "COLD",
    status: "New",
    emailText: "We need 450 pcs of cast carbon steel bonnets. Castings must comply with AD 2000-W0 guidelines. Material: ASTM A216 WCB. Heat treatment charts must be provided.",
    draftReply: "Subject: RE: Velan Valves - Globe Valve Bonnet inquiry\n\nDear Purchasing Manager,\n\nSuper Quali Cast is AD 2000-W0 certified (audited by TÜV NORD) specifically for supplying pressure-retaining components to Europe and Canada. We will ensure absolute compliance with heat treatment record keeping.",
    ageHours: 36,
  },
  {
    id: "SQC-INQ-008",
    customer: "PetrolValves",
    country: "Italy",
    source: "Email",
    part: "Subsea Gate Valve Slab",
    alloy: "Super Duplex F55",
    qty: 150,
    estValueLakhs: 45.0,
    aiScore: "HOT",
    status: "New",
    emailText: "Inquiry for highly critical Subsea Gate Valve Slabs. Weight approx 45kg per piece. Casting in Super Duplex ASTM A890 Grade 5A (F55). Zero porosity tolerance. Radiography level 1 is mandatory.",
    draftReply: "Subject: RE: PetrolValves - Subsea Gate Valve Slab (Super Duplex F55)\n\nDear PetrolValves team,\n\nWe specialize in high-integrity Super Duplex castings (10g to 200kg). Our foundry is PED 97/23/EC certified, and we regularly cast Grade 5A. We are checking pouring simulations for a 45kg clean slab.",
    ageHours: 4,
  },
  {
    id: "SQC-INQ-009",
    customer: "Emerson Automation",
    country: "Australia",
    source: "Website",
    part: "Regulator Body",
    alloy: "ASTM A351 CF3M",
    qty: 600,
    estValueLakhs: 31.2,
    aiScore: "WARM",
    status: "Sent to Feasibility",
    emailText: "Inquiry submitted through web-portal. 600 Regulator bodies, CF3M (316L equivalent). Corrosive service environment. PMI (Positive Material Identification) report required with every batch.",
    draftReply: "Subject: RE: Emerson - Regulator Body CF3M Inquiry\n\nDear Emerson Australia Team,\n\nThank you for the inquiry. We confirm we have in-house Spectrometer analysis (26 elements) and handheld portable PMI instruments to ensure strict chemistry compliance. We will deliver fully traceable castings.",
    ageHours: 48,
  },
  {
    id: "SQC-INQ-010",
    customer: "Orion Valves",
    country: "Italy",
    source: "Email",
    part: "Swing Check Valve Hinge Pin",
    alloy: "SS316",
    qty: 2000,
    estValueLakhs: 11.5,
    aiScore: "COLD",
    status: "Closed",
    emailText: "Need high precision pins in SS316. Turned finish. Price is extremely sensitive. Let us know your lowest pricing.",
    draftReply: "Sourcing SS316 turned pins. Thread machining and super-finished ground tolerances. Marked closed due to price margins competing with simple bar-stock turning rather than custom investment casting.",
    ageHours: 72,
  },
  {
    id: "SQC-INQ-011",
    customer: "Crane ChemPharma",
    country: "USA",
    source: "Email",
    part: "Diaphragm Valve Body",
    alloy: "CF3M",
    qty: 950,
    estValueLakhs: 41.0,
    aiScore: "HOT",
    status: "Replied",
    emailText: "Sourcing CF3M Diaphragm Valve Bodies. Castings must have exceptionally smooth internal finish (Ra < 3.2 microns) as they are lined with PFA. Qty 950.",
    draftReply: "Subject: RE: Crane ChemPharma - Diaphragm Valve Body CF3M\n\nDear Team,\n\nBy using premium zircon-rich refractory slurries in our lost-wax shell coating process, we consistently achieve a surface roughness of Ra 1.6 to 3.2 microns in the as-cast state. This will be ideal for your PFA lining. Quote transmitted under SQC-Q-2026-006.",
    ageHours: 8,
  },
  {
    id: "SQC-INQ-012",
    customer: "Kitz Corporation",
    country: "Japan",
    source: "Email",
    part: "Ball Valve Stem",
    alloy: "SS410",
    qty: 1500,
    estValueLakhs: 16.4,
    aiScore: "COLD",
    status: "Replied",
    emailText: "We require SS410 hardened and tempered stems for Ball Valves. Quantity 1,500. Precision CNC turning and slot milling on VMC at Unit-2 Shapar.",
    draftReply: "Subject: RE: Kitz Corporation - SS410 Valve Stems\n\nDear Team,\n\nWe have generated our quote (SQC-Q-2026-007) for 1500 Stems. This includes casting SS410 steel at Unit-1, hardening-tempering, and precision grinding/turning at our Unit-2, Shapar machine shop.",
    ageHours: 15,
  }
];

// Seed RFQs (exactly 5, one flagged waiting 6 days)
const seedRfqs: RFQ[] = [
  {
    id: "SQC-RFQ-2026-001",
    inquiryId: "SQC-INQ-001",
    specs: {
      material: "CA6NM",
      castWeightKg: 14.5,
      qty: 500,
      tolerance: "ISO 8062 CT6",
      nde: "100% UT, PT Level II",
      machining: "Proof Machining on VMC"
    },
    feasibilityChecks: [
      { label: "Melt Chemistry Compatibility (CA6NM)", pass: true },
      { label: "Wax Injection Tooling Draft Feasibility", pass: true },
      { label: "Pouring Flow Simulation (No Hot Tears)", pass: true },
      { label: "Unit-2 CNC Machining Fixture Setup", pass: true }
    ],
    costingRows: [
      { item: "Raw Material (Alloy Elements CA6NM)", costPerKg: 180, totalCost: 1305000 },
      { item: "Melting, Pouring & Shell Knockout", costPerKg: 110, totalCost: 797500 },
      { item: "Heat Treatment (Hardening + Tempering)", costPerKg: 25, totalCost: 181250 },
      { item: "Unit-2 CNC Pre-Machining Charge", costPerKg: 60, totalCost: 435000 },
      { item: "Pattern Mould Tooling Setup (Amortized)", costPerKg: 0, totalCost: 120000 }
    ],
    marginPct: 22,
    status: "Feasible"
  },
  {
    id: "SQC-RFQ-2026-002",
    inquiryId: "SQC-INQ-002",
    specs: {
      material: "ASTM A351 CF8M",
      castWeightKg: 8.2,
      qty: 1200,
      tolerance: "+/- 0.3mm Wall Thickness",
      nde: "Dye Penetrant Testing (PT)",
      machining: "Fully Finished Machined & Deburred"
    },
    feasibilityChecks: [
      { label: "Melt Chemistry Compatibility (CF8M)", pass: true },
      { label: "Precision Wall Thickness tolerance", pass: true },
      { label: "Porosity Check (Radiography Specimen)", pass: true },
      { label: "CMM Zeiss Inspection Program setup", pass: true }
    ],
    costingRows: [
      { item: "Raw Material (CF8M Stainless Steel)", costPerKg: 290, totalCost: 2852400 },
      { item: "Wax Shell Casting & Pouring", costPerKg: 115, totalCost: 1131600 },
      { item: "PMI and Liquid Penetrant NDE testing", costPerKg: 15, totalCost: 147600 },
      { item: "Unit-2 CNC Finish Machining", costPerKg: 80, totalCost: 787200 }
    ],
    marginPct: 25,
    status: "Costed"
  },
  {
    id: "SQC-RFQ-2026-003",
    inquiryId: "SQC-INQ-003", // Rotork
    specs: {
      material: "ASTM A216 WCB",
      castWeightKg: 11.2,
      qty: 300,
      tolerance: "ISO 8062 CT7",
      nde: "100% Radiography Testing (RT)",
      machining: "Bore Machined, concentricity 0.05mm"
    },
    feasibilityChecks: [
      { label: "Carbon Steel WCB melting compatibility", pass: true },
      { label: "RT Quality level clearance", pass: false }, // Needs engineering review!
      { label: "Bore concentricity 0.05mm setup", pass: true }
    ],
    costingRows: [],
    marginPct: 20,
    status: "Pending",
    daysWaiting: 6 // Flagged WAITING 6 DAYS!
  },
  {
    id: "SQC-RFQ-2026-004",
    inquiryId: "SQC-INQ-004", // Stuttgart proto
    specs: {
      material: "CD4MCu",
      castWeightKg: 5.5,
      qty: 5,
      tolerance: "CT5 Super Precision",
      nde: "PT + X-Ray",
      machining: "Unmachined (As Cast)"
    },
    feasibilityChecks: [
      { label: "Duplex Melt Grade CD4MCu", pass: true },
      { label: "Rapid prototyping wax mold compatibility", pass: true }
    ],
    costingRows: [
      { item: "Experimental Duplex Pour charge", costPerKg: 600, totalCost: 16500 },
      { item: "Shell build & pour (small batch)", costPerKg: 200, totalCost: 5500 },
      { item: "Radiography certified lab ex-Rajkot", costPerKg: 0, totalCost: 35000 }
    ],
    marginPct: 35,
    status: "Pending"
  },
  {
    id: "SQC-RFQ-2026-005",
    inquiryId: "SQC-INQ-005", // Flowserve
    specs: {
      material: "CA15 (12% Cr)",
      castWeightKg: 6.8,
      qty: 250,
      tolerance: "ISO 8062 CT6",
      nde: "Visual inspection & PMI",
      machining: "Finished CNC Turning"
    },
    feasibilityChecks: [
      { label: "CA15 Melt Composition Check", pass: true },
      { label: "Heat Treatment Hardening (220-250 BHN)", pass: true },
      { label: "Precision Turning Fixture Setup", pass: true }
    ],
    costingRows: [
      { item: "Raw Material (CA15 Alloy)", costPerKg: 195, totalCost: 331500 },
      { item: "Foundry Core and Shell Casting", costPerKg: 110, totalCost: 187000 },
      { item: "In-house heat treatment furnace cycle", costPerKg: 30, totalCost: 51000 },
      { item: "CNC Machining operation Unit-2 Shapar", costPerKg: 95, totalCost: 161500 }
    ],
    marginPct: 24,
    status: "Quoted"
  }
];

// Seed Quotes (exactly 7, 3 with agingDays > 5)
const seedQuotes: Quote[] = [
  {
    id: "SQC-Q-2026-001",
    rfqId: "SQC-RFQ-2026-002", // Hayward Valve Body
    totalLakhs: 52.0,
    validityDays: 30,
    agingDays: 8, // agingDays > 5 (1)
    status: "Sent"
  },
  {
    id: "SQC-Q-2026-002",
    rfqId: "SQC-RFQ-2026-005", // Flowserve Plug
    totalLakhs: 18.0,
    validityDays: 30,
    agingDays: 12, // agingDays > 5 (2)
    status: "Draft"
  },
  {
    id: "SQC-Q-2026-003",
    rfqId: "SQC-RFQ-2026-001", // KSB Impeller
    totalLakhs: 38.5,
    validityDays: 30,
    agingDays: 2,
    status: "Approved"
  },
  {
    id: "SQC-Q-2026-004",
    rfqId: "SQC-RFQ-2026-003", // Rotork Controls
    totalLakhs: 29.8, // (Simulated from missing costed rfq Velan)
    validityDays: 30,
    agingDays: 14, // agingDays > 5 (3)
    status: "Lost"
  },
  {
    id: "SQC-Q-2026-005",
    rfqId: "SQC-RFQ-2026-005", // L&T disc
    totalLakhs: 22.5,
    validityDays: 30,
    agingDays: 1,
    status: "Won"
  },
  {
    id: "SQC-Q-2026-006",
    rfqId: "SQC-RFQ-2026-001", // Crane ChemPharma
    totalLakhs: 41.0,
    validityDays: 30,
    agingDays: 3,
    status: "Sent"
  },
  {
    id: "SQC-Q-2026-007",
    rfqId: "SQC-RFQ-2026-002", // Kitz Valve stem
    totalLakhs: 16.4,
    validityDays: 30,
    agingDays: 4,
    status: "Won"
  }
];

// Seed Orders (exactly 6 spread across Cast | Machine | QC | Pack | Ship)
const seedOrders: Order[] = [
  {
    id: "SQC-SO-2026-001",
    quoteId: "SQC-Q-2026-005", // L&T
    part: "4\" Butterfly Disc",
    customer: "L&T Valves (India)",
    destination: "Coimbatore, India",
    stage: "Cast"
  },
  {
    id: "SQC-SO-2026-002",
    quoteId: "SQC-Q-2026-007", // Kitz
    part: "Ball Valve Stem",
    customer: "Kitz Corporation (Japan)",
    destination: "Chiba, Japan",
    stage: "Machine"
  },
  {
    id: "SQC-SO-2026-003",
    quoteId: "SQC-Q-2026-004", // Velan
    part: "Globe Valve Bonnet",
    customer: "Velan Valves (Canada)",
    destination: "Montreal, Canada",
    stage: "QC"
  },
  {
    id: "SQC-SO-2026-004",
    quoteId: "SQC-Q-2026-004", // Rotork Controls
    part: "Actuator Housing",
    customer: "Rotork Controls (UK)",
    destination: "Bath, UK",
    stage: "Pack"
  },
  {
    id: "SQC-SO-2026-005",
    quoteId: "SQC-Q-2026-001", // Hayward
    part: '2" Gate Valve Body',
    customer: "Hayward Flow Control (USA)",
    destination: "Clemmons, NC, USA",
    stage: "Ship"
  },
  {
    id: "SQC-SO-2026-006",
    quoteId: "SQC-Q-2026-003", // KSB
    part: "Pump Impeller",
    customer: "KSB SE (Germany)",
    destination: "Frankenthal, Germany",
    stage: "QC"
  }
];

// Seed Programs (exactly 2 CNC programs)
const seedPrograms: Program[] = [
  {
    id: "SQC-CNC-2026-001",
    orderId: "SQC-SO-2026-002", // Kitz Stem CNC OP10/20
    controller: "Fanuc 0i-TF",
    op10Code: "G21 G90 G40\nT0101 M06 (ROUGH TURNING TOOL)\nG54 G96 S180 M03\nG00 X45.0 Z2.0\nG71 U1.5 R0.5\nG71 P10 Q20 U0.3 W0.1 F0.2\nN10 G01 X15.0 F0.1\nG01 Z-42.0\nN20 G01 X45.0\nG00 X200.0 Z150.0 M05\nM30",
    op20Code: "G21 G90 G40\nT0202 M06 (FINISH TURNING TOOL)\nG54 G96 S220 M03\nG00 X45.0 Z2.0\nG70 P10 Q20 F0.1\nG00 X200.0 Z150.0 M05\nM30",
    reviewMinutes: 15,
    status: "Setter-approved"
  },
  {
    id: "SQC-CNC-2026-002",
    orderId: "SQC-SO-2026-004", // Rotork housing Milling
    controller: "Siemens 828D",
    op10Code: "; OP10 VMC FACE MILLING 11.2KG HOUSING\nN10 G90 G17 G54\nN20 T1 M6 ; D80 FACE MILL\nN30 S1200 M3 M8\nN40 G0 X-100 Y0\nN50 G1 X250 F450\nN60 G0 Y50\nN70 G1 X-100 F450\nN80 G0 Z150 M5\nN90 M30",
    op20Code: "; OP20 VMC DRILLING & BORE CHOP\nN10 G90 G17 G54\nN20 T2 M6 ; D14 SOLID CARBIDE DRILL\nN30 S1500 M3 M8\nN40 G81 R3 Z-25 F200\nN50 M30",
    reviewMinutes: 30,
    status: "Generated"
  }
];

// Seed Shipments (exactly 3 shipments)
const seedShipments: Shipment[] = [
  {
    id: "SQC-SHIP-2026-001",
    orderId: "SQC-SO-2026-005", // Hayward Gate Valve
    docs: [
      { name: "Invoice & Packing List", status: "Generated" },
      { name: "Material Test Certificate (MTC)", status: "Generated" },
      { name: "Zeiss CMM Inspection Report", status: "Generated" }
    ],
    notified: true
  },
  {
    id: "SQC-SHIP-2026-002",
    orderId: "SQC-SO-2026-004", // Rotork Controls
    docs: [
      { name: "Invoice & Packing List", status: "Pending" },
      { name: "Material Test Certificate (MTC)", status: "Generated" }
    ],
    notified: false
  },
  {
    id: "SQC-SHIP-2026-003",
    orderId: "SQC-SO-2026-003", // Velan Bonnet
    docs: [
      { name: "Shipping Bill", status: "Pending" },
      { name: "Zeiss CMM Report", status: "Pending" }
    ],
    notified: false
  }
];

// Seed Events (exactly 40, 6 between 01:00 and 05:00 IST)
const seedEvents: AppEvent[] = [
  { id: "EV-040", timestampIST: "04:52 IST", module: "Dispatch", message: "Notified Savan Chapani: Zeiss CMM Report approved for SQC-SHIP-2026-001" },
  { id: "EV-039", timestampIST: "04:22 IST", module: "Dispatch", message: "Generated Material Test Certificate (MTC) for Hayward Flow Control gate valve bodies" },
  { id: "EV-038", timestampIST: "03:48 IST", module: "CNC Program", message: "Setter approved CNC Program SQC-CNC-2026-001 on Fanuc 0i-TF controller for Kitz Corporation" },
  { id: "EV-037", timestampIST: "02:14 IST", module: "Inquiry Desk", message: "Drafted reply to Hayward Flow Control (USA) — 2\" Gate Valve Body · ASTM A351 CF8M" },
  { id: "EV-036", timestampIST: "01:50 IST", module: "RFQ Costing", message: "Sent RFQ-2026-005 feasibility parameters to metallurgical expert for CA15 hardening analysis" },
  { id: "EV-035", timestampIST: "01:05 IST", module: "Inquiry Desk", message: "Inquiry SQC-INQ-001 (KSB SE, Germany) created and flagged HOT by automatic AI Scoring" },
  { id: "EV-034", timestampIST: "Yesterday", module: "Order Progress", message: "Order SQC-SO-2026-006 (KSB SE) status updated to QC testing in Unit-2 Shapar lab" },
  { id: "EV-033", timestampIST: "Yesterday", module: "RFQ Costing", message: "Completed Costing sheet for SQC-RFQ-2026-002: Total Raw Material cost ₹28.52 Lakhs" },
  { id: "EV-032", timestampIST: "Yesterday", module: "Inquiry Desk", message: "Replied to Rotork Controls (UK) confirming CNC/VMC capability at Unit-2, Shapar machine shop" },
  { id: "EV-031", timestampIST: "Yesterday", module: "Inquiry Desk", message: "CastForge 2026 Stuttgart lead (Duplex SS impeller samples) logged in system" },
  { id: "EV-030", timestampIST: "2 days ago", module: "Inquiry Desk", message: "Flowserve (USA) web form inquiry parsed automatically: Control Valve Plug (CA15)" },
  { id: "EV-029", timestampIST: "2 days ago", module: "RFQ Costing", message: "Created RFQ-2026-003 for Rotork Controls carbon steel WCB actuator housing" },
  { id: "EV-028", timestampIST: "2 days ago", module: "CNC Program", message: "CNC Code generated automatically for SQC-CNC-2026-002 Siemens 828D controller" },
  { id: "EV-027", timestampIST: "2 days ago", module: "Order Progress", message: "Order SQC-SO-2026-002 (Kitz Corporation) shifted to CNC machining operations stage" },
  { id: "EV-026", timestampIST: "3 days ago", module: "Dispatch", message: "Shipping Bill drafted for Velan Valves (Canada) - Globe Valve Bonnet" },
  { id: "EV-025", timestampIST: "3 days ago", module: "Inquiry Desk", message: "L&T Valves (India) IndiaMART inquiry received: 4\" Butterfly Valve Disc in CF8M" },
  { id: "EV-024", timestampIST: "3 days ago", module: "Inquiry Desk", message: "Velan Valves (Canada) inquiry logged: Globe Valve Bonnet in cast carbon steel ASTM A216 WCB" },
  { id: "EV-023", timestampIST: "3 days ago", module: "Inquiry Desk", message: "PetrolValves (Italy) high-integrity super duplex F55 slab inquiry received" },
  { id: "EV-022", timestampIST: "4 days ago", module: "RFQ Costing", message: "Approved mold tooling layout and casting flow simulation for SQC-RFQ-2026-001 (KSB SE)" },
  { id: "EV-021", timestampIST: "4 days ago", module: "RFQ Costing", message: "Flagged SQC-RFQ-2026-003 as WAITING 6 DAYS for Rotork technical specification validation" },
  { id: "EV-020", timestampIST: "4 days ago", module: "Order Progress", message: "Order SQC-SO-2026-001 (L&T Valves) shell pouring complete, sent to cooling bay" },
  { id: "EV-019", timestampIST: "5 days ago", module: "Dispatch", message: "Zeiss CMM inspection program for Kitz Corporation stem completed with zero defects" },
  { id: "EV-018", timestampIST: "5 days ago", module: "Inquiry Desk", message: "Emerson Automation (Australia) CF3M Regulator Body inquiry logged" },
  { id: "EV-017", timestampIST: "5 days ago", module: "Inquiry Desk", message: "Closed SS316 turned pin inquiry (Orion Valves) due to extremely low margin expectations" },
  { id: "EV-016", timestampIST: "6 days ago", module: "Inquiry Desk", message: "Crane ChemPharma (USA) inquiry received for 950 CF3M Diaphragm Valve Bodies" },
  { id: "EV-015", timestampIST: "6 days ago", module: "RFQ Costing", message: "Created RFQ-2026-001 for KSB SE pump impeller castings" },
  { id: "EV-014", timestampIST: "6 days ago", module: "RFQ Costing", message: "Created RFQ-2026-002 for Hayward Flow Control gate valve bodies" },
  { id: "EV-013", timestampIST: "7 days ago", module: "Inquiry Desk", message: "Kitz Corporation (Japan) valve stem enquiry parsed and replied" },
  { id: "EV-012", timestampIST: "7 days ago", module: "RFQ Costing", message: "Generated Quote SQC-Q-2026-007 for Kitz Corporation ex-works Shapar" },
  { id: "EV-011", timestampIST: "7 days ago", module: "RFQ Costing", message: "Generated Quote SQC-Q-2026-005 for L&T Valves domestic tender" },
  { id: "EV-010", timestampIST: "8 days ago", module: "RFQ Costing", message: "Generated Quote SQC-Q-2026-001 for Hayward Flow Control" },
  { id: "EV-009", timestampIST: "8 days ago", module: "Order Progress", message: "Active order SQC-SO-2026-005 (Hayward) queued in the dispatch log" },
  { id: "EV-008", timestampIST: "8 days ago", module: "Order Progress", message: "Active order SQC-SO-2026-004 (Rotork) sent to final seaworthy packing bay" },
  { id: "EV-007", timestampIST: "9 days ago", module: "RFQ Costing", message: "Drafted Quote SQC-Q-2026-002 for Flowserve control valve plugs" },
  { id: "EV-006", timestampIST: "9 days ago", module: "RFQ Costing", message: "Drafted Quote SQC-Q-2026-003 for KSB SE pump impellers" },
  { id: "EV-005", timestampIST: "10 days ago", module: "RFQ Costing", message: "Generated RFQ-2026-005 for Flowserve plugs" },
  { id: "EV-004", timestampIST: "10 days ago", module: "RFQ Costing", message: "Transmitted Quote SQC-Q-2026-006 to Crane ChemPharma USA" },
  { id: "EV-003", timestampIST: "11 days ago", module: "Inquiry Desk", message: "Marked Quote SQC-Q-2026-004 as Lost following commercial review with Rotork Controls" },
  { id: "EV-002", timestampIST: "12 days ago", module: "Inquiry Desk", message: "System initialization of SQC Command Center under Savan Chapani supervision" },
  { id: "EV-001", timestampIST: "12 days ago", module: "Dispatch", message: "Unit-2 Zeiss CMM inspector calibrated with master sphere and checked OK" }
];

const LOCAL_STORAGE_KEY = "sqc_command_center_store_v1";

const initialStore: AppStore = {
  inquiries: seedInquiries,
  rfqs: seedRfqs,
  quotes: seedQuotes,
  orders: seedOrders,
  programs: seedPrograms,
  shipments: seedShipments,
  events: seedEvents
};

export function getStore(): AppStore {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Error reading store from localStorage", e);
  }
  // Store default seed
  saveStore(initialStore);
  return initialStore;
}

export function saveStore(store: AppStore): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.error("Error writing store to localStorage", e);
  }
}

export function resetStore(): AppStore {
  saveStore(initialStore);
  return initialStore;
}

// Store Mutators & Event Logging Helpers
export function addEvent(store: AppStore, module: string, message: string): AppStore {
  const now = new Date();
  const hrs = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  const timestampIST = `${hrs}:${mins} IST`;
  
  const newEvent: AppEvent = {
    id: `EV-${String(store.events.length + 1).padStart(3, '0')}`,
    timestampIST,
    module,
    message
  };

  const updatedStore = {
    ...store,
    events: [newEvent, ...store.events]
  };
  saveStore(updatedStore);
  return updatedStore;
}

export function updateInquiryStatus(store: AppStore, id: string, status: "New" | "Replied" | "Sent to Feasibility" | "Closed"): AppStore {
  const inquiries = store.inquiries.map(inq => {
    if (inq.id === id) {
      return { ...inq, status };
    }
    return inq;
  });

  const inq = store.inquiries.find(i => i.id === id);
  const partInfo = inq ? ` — ${inq.part} · ${inq.alloy}` : "";
  const clientName = inq ? ` (${inq.customer})` : "";
  
  let tempStore = { ...store, inquiries };
  return addEvent(tempStore, "Inquiry Desk", `Updated status of ${id}${clientName}${partInfo} to ${status}`);
}

export function saveInquiryDraftReply(store: AppStore, id: string, draftReply: string): AppStore {
  const inquiries = store.inquiries.map(inq => {
    if (inq.id === id) {
      return { ...inq, draftReply };
    }
    return inq;
  });

  const inq = store.inquiries.find(i => i.id === id);
  const clientName = inq ? ` (${inq.customer})` : "";
  
  let tempStore = { ...store, inquiries };
  return addEvent(tempStore, "Inquiry Desk", `Updated response draft for ${id}${clientName}`);
}

export function createInquiry(store: AppStore, inquiryData: Omit<Inquiry, "id" | "ageHours">): AppStore {
  const nextIdNum = store.inquiries.length + 1;
  const id = `SQC-INQ-${String(nextIdNum).padStart(3, '0')}`;
  const newInquiry: Inquiry = {
    ...inquiryData,
    id,
    ageHours: 1
  };

  let tempStore = {
    ...store,
    inquiries: [newInquiry, ...store.inquiries]
  };
  return addEvent(tempStore, "Inquiry Desk", `Logged new inquiry ${id} from ${newInquiry.customer} (${newInquiry.country}) for ${newInquiry.part} [${newInquiry.alloy}]`);
}

export function createRfqFromInquiry(store: AppStore, inquiryId: string, specs: any): AppStore {
  const nextIdNum = store.rfqs.length + 1;
  const id = `SQC-RFQ-2026-${String(nextIdNum).padStart(3, '0')}`;
  
  const newRfq: RFQ = {
    id,
    inquiryId,
    specs,
    feasibilityChecks: [
      { label: `Melt chemistry compliance for ${specs.material}`, pass: true },
      { label: `Wax injection pressure rating for ${specs.castWeightKg}kg`, pass: true }
    ],
    costingRows: [],
    marginPct: 20,
    status: "Pending"
  };

  // Auto-set inquiry status to "Sent to Feasibility"
  const inquiries = store.inquiries.map(inq => {
    if (inq.id === inquiryId) {
      return { ...inq, status: "Sent to Feasibility" as const };
    }
    return inq;
  });

  let tempStore = {
    ...store,
    rfqs: [...store.rfqs, newRfq],
    inquiries
  };

  const inq = store.inquiries.find(i => i.id === inquiryId);
  const clientName = inq ? ` for ${inq.customer}` : "";

  return addEvent(tempStore, "RFQ Costing", `Created technical RFQ sheet ${id}${clientName} linked to Inquiry ${inquiryId}`);
}

export function updateRfqFeasibility(store: AppStore, rfqId: string, checks: { label: string, pass: boolean }[], status: "Pending" | "Feasible"): AppStore {
  const rfqs = store.rfqs.map(rfq => {
    if (rfq.id === rfqId) {
      return { ...rfq, feasibilityChecks: checks, status };
    }
    return rfq;
  });

  let tempStore = { ...store, rfqs };
  return addEvent(tempStore, "RFQ Costing", `Updated feasibility checks for ${rfqId} — status: ${status}`);
}

export function saveRfqCosting(store: AppStore, rfqId: string, costingRows: any[], marginPct: number, status: "Costed" | "Quoted"): AppStore {
  const rfqs = store.rfqs.map(rfq => {
    if (rfq.id === rfqId) {
      return { ...rfq, costingRows, marginPct, status };
    }
    return rfq;
  });

  let tempStore = { ...store, rfqs };
  return addEvent(tempStore, "RFQ Costing", `Saved detailed costing sheet for ${rfqId} with ${marginPct}% margin`);
}

export function createQuoteFromRfq(store: AppStore, rfqId: string, totalLakhs: number): AppStore {
  const nextIdNum = store.quotes.length + 1;
  const id = `SQC-Q-2026-${String(nextIdNum).padStart(3, '0')}`;
  
  const newQuote: Quote = {
    id,
    rfqId,
    totalLakhs,
    validityDays: 30,
    agingDays: 0,
    status: "Draft"
  };

  // Update RFQ status to Quoted
  const rfqs = store.rfqs.map(rfq => {
    if (rfq.id === rfqId) {
      return { ...rfq, status: "Quoted" as const };
    }
    return rfq;
  });

  let tempStore = {
    ...store,
    quotes: [...store.quotes, newQuote],
    rfqs
  };

  return addEvent(tempStore, "RFQ Costing", `Generated formal sales Quote ${id} linked to RFQ ${rfqId} for ₹${totalLakhs} Lakhs`);
}

export function updateQuoteStatus(store: AppStore, id: string, status: "Draft" | "Approved" | "Sent" | "Won" | "Lost"): AppStore {
  const quotes = store.quotes.map(q => {
    if (q.id === id) {
      return { ...q, status };
    }
    return q;
  });

  let tempStore = { ...store, quotes };

  // If WON, auto-generate an order!
  if (status === "Won") {
    const quote = store.quotes.find(q => q.id === id);
    if (quote) {
      const rfq = store.rfqs.find(r => r.id === quote.rfqId);
      const inq = rfq ? store.inquiries.find(i => i.id === rfq.inquiryId) : null;
      
      const part = inq ? inq.part : "Casting Component";
      const customer = inq ? inq.customer : "SQC Customer";
      const destination = inq ? inq.country : "Rajkot, India";
      
      const nextOrderIdNum = store.orders.length + 1;
      const orderId = `SQC-SO-2026-${String(nextOrderIdNum).padStart(3, '0')}`;
      
      const newOrder: Order = {
        id: orderId,
        quoteId: id,
        part,
        customer,
        destination,
        stage: "Cast"
      };

      tempStore.orders = [...tempStore.orders, newOrder];
      tempStore = addEvent(tempStore, "Order Progress", `Auto-created shop-floor Sales Order ${orderId} for ${customer} (Quote ${id} converted to WON)`);
    }
  }

  return addEvent(tempStore, "RFQ Costing", `Quote ${id} status updated to ${status}`);
}

export function updateOrderStage(store: AppStore, orderId: string, stage: "Cast" | "Machine" | "QC" | "Pack" | "Ship"): AppStore {
  const orders = store.orders.map(o => {
    if (o.id === orderId) {
      return { ...o, stage };
    }
    return o;
  });

  let tempStore = { ...store, orders };
  return addEvent(tempStore, "Order Progress", `Sales Order ${orderId} transitioned to ${stage} stage`);
}

export function createOrUpdateCncProgram(store: AppStore, orderId: string, controller: "Fanuc 0i-TF" | "Siemens 828D" | "Mitsubishi M80", op10Code: string, op20Code: string, reviewMinutes: number, status: "Queued" | "Generated" | "Setter-approved"): AppStore {
  const existingProg = store.programs.find(p => p.orderId === orderId);
  let programs: Program[];
  let actionStr = "";

  if (existingProg) {
    programs = store.programs.map(p => {
      if (p.orderId === orderId) {
        return { ...p, controller, op10Code, op20Code, reviewMinutes, status };
      }
      return p;
    });
    actionStr = `Updated CNC Program ${existingProg.id} (status: ${status})`;
  } else {
    const nextProgIdNum = store.programs.length + 1;
    const newProg: Program = {
      id: `SQC-CNC-2026-${String(nextProgIdNum).padStart(3, '0')}`,
      orderId,
      controller,
      op10Code,
      op20Code,
      reviewMinutes,
      status
    };
    programs = [...store.programs, newProg];
    actionStr = `Generated fresh CNC Program ${newProg.id} for Order ${orderId}`;
  }

  let tempStore = { ...store, programs };
  return addEvent(tempStore, "CNC Program", actionStr);
}

export function updateShipmentDocStatus(store: AppStore, shipmentId: string, docName: string, status: "Generated" | "Pending"): AppStore {
  const shipments = store.shipments.map(s => {
    if (s.id === shipmentId) {
      const docs = s.docs.map(d => {
        if (d.name === docName) {
          return { ...d, status };
        }
        return d;
      });
      return { ...s, docs };
    }
    return s;
  });

  let tempStore = { ...store, shipments };
  return addEvent(tempStore, "Dispatch", `Updated document "${docName}" for ${shipmentId} to ${status}`);
}

export function notifyShipmentDispatch(store: AppStore, shipmentId: string): AppStore {
  const shipments = store.shipments.map(s => {
    if (s.id === shipmentId) {
      return { ...s, notified: true };
    }
    return s;
  });

  let tempStore = { ...store, shipments };
  return addEvent(tempStore, "Dispatch", `Dispatched shipping notification and Zeiss CMM report for shipment ${shipmentId}`);
}
