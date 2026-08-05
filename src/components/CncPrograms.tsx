import { useState, useEffect } from "react";
import { AppStore, Order, OrderStage, Program, ProgramController } from "../types";
import { addEvent } from "../store";
import { 
  AlertCircle, 
  Cpu, 
  FileCode2, 
  Check, 
  Upload, 
  Pencil, 
  Copy, 
  Download, 
  RefreshCw, 
  Lock, 
  Clock, 
  ArrowRight,
  Sparkles
} from "lucide-react";

interface CncProgramsProps {
  store: AppStore;
  searchQuery: string;
  onUpdateStore: (store: AppStore) => void;
  addToast: (message: string, type?: "success" | "info" | "warning") => void;
}

// Verbatim CNC programs as templates
const FANUC_OP10 = `O4025 (SQC-VB-4025 GATE VALVE BODY - OP10 TURNING - FANUC 0i-TF)
(CAST CF8M - 2.0MM MACHINING ALLOWANCE ON MARKED FACES)
(DATUM: AS-CAST OD IN SOFT JAWS - SETTER CONFIRM GRIP)
N10 G21 G40 G80 G99
N20 G28 U0 W0
N30 T0101 (CNMG FACE ROUGH)
N40 G50 S1500
N50 G96 S180 M03
N60 G00 X160.0 Z2.0 M08
N70 G01 Z0.0 F0.25 (FACE FLANGE - REMOVE 2.0 ALLOWANCE)
N80 G01 X88.0
N90 (RAISED FACE FINISH RA3.2)
N100 T0202 (FINISH FACE)
N110 G96 S220
N120 G01 Z0.0 F0.12
N130 T0303 (BORING BAR)
N140 G00 X46.0 Z2.0
N150 G01 Z-42.0 F0.2 (ROUGH BORE)
N160 G00 X50.8 Z2.0
N170 G01 Z-42.0 F0.1 (FINISH BORE 50.8 H8)
N180 G00 Z5.0
N190 G28 U0 W0 M09
N200 M30`;

const FANUC_OP20 = `O4026 (SQC-VB-4025 - OP20 VMC FLANGE HOLES - FANUC 0i-MF)
(LOCATE ON OP10 MACHINED FACE + BORE - CONFIRM FIXTURE)
N10 G21 G17 G40 G80 G90
N20 G54 G00 X0 Y0
N30 T01 M06 (NC SPOT DRILL)
N40 S1200 M03
N50 G43 H01 Z25.0 M08
N60 G81 G98 X60.3 Y0 Z-3.0 R3.0 F100 (SPOT 4X PCD 120.6)
N70 X0 Y60.3
N80 X-60.3 Y0
N90 X0 Y-60.3
N100 G80
N110 T02 M06 (DIA 19.0 DRILL)
N120 S650 M03
N130 G43 H02 Z25.0
N140 G83 G98 X60.3 Y0 Z-26.0 R3.0 Q6.0 F90 (PECK 4X THRU)
N150 X0 Y60.3
N160 X-60.3 Y0
N170 X0 Y-60.3
N180 G80 G49 Z100.0 M09
N190 G28 G91 Z0
N200 M30`;

const SIEMENS_OP10 = `; SQC-VB-4025 OP10 — SINUMERIK 828D
; CAST CF8M - 2.0MM MACHINING ALLOWANCE ON MARKED FACES
; DATUM: AS-CAST OD IN SOFT JAWS - SETTER CONFIRM GRIP
N10 G21 G40 G800
N20 SUPA G0 Z0 D0
N30 T="ROUGH_FACE" D1 ; CNMG FACE ROUGH
N40 LIMS=1500
N50 G96 S180 M3
N60 G0 X160 Z2 M8
N70 G1 Z0 F0.25 ; FACE FLANGE - REMOVE 2.0 ALLOWANCE
N80 G1 X88
N90 ; RAISED FACE FINISH RA3.2
N100 T="FINISH_FACE" D1 ; FINISH FACE
N110 G96 S220
N120 G1 Z0 F0.12
N130 T="BORING_BAR" D1 ; BORING BAR
N140 G0 X46 Z2
N150 G1 Z-42 F0.2 ; ROUGH BORE
N160 G0 X50.8 Z2
N170 G1 Z-42 F0.1 ; FINISH BORE 50.8 H8
N180 G0 Z5
N190 G0 Z200 Y200 M9
N200 M30`;

const SIEMENS_OP20 = `; SQC-VB-4025 OP20 — SINUMERIK 828D
; LOCATE ON OP10 MACHINED FACE + BORE - CONFIRM FIXTURE
N10 G21 G17 G40 G90
N20 TRANS X0 Y0 Z0
N30 T="SPOT_DRILL" D1 ; NC SPOT DRILL
N40 S1200 M3
N50 G0 Z25 M8
N60 CYCLE81(25.0, 0.0, 3.0, -3.0, 0.0) ; SPOT 4X PCD 120.6
N65 G0 X60.3 Y0
N70 G0 X0 Y60.3
N80 G0 X-60.3 Y0
N90 G0 X0 Y-60.3
N100 MCALL
N110 T="DRILL_19" D1 ; DIA 19.0 DRILL
N120 S650 M3
N130 G0 Z25
N140 CYCLE83(25.0, 0.0, 3.0, -26.0, 0.0, 6.0, 6.0, 0.0, 0, 0, 1, 0) ; PECK 4X THRU
N145 G0 X60.3 Y0
N150 G0 X0 Y60.3
N160 G0 X-60.3 Y0
N170 G0 X0 Y-60.3
N180 MCALL M9
N190 G0 Z100
N200 M30`;

const MITSUBISHI_OP10 = `(MITSUBISHI M80)
O4025 (SQC-VB-4025 GATE VALVE BODY - OP10 TURNING - MITSUBISHI M80)
(CAST CF8M - 2.0MM MACHINING ALLOWANCE ON MARKED FACES)
(DATUM: AS-CAST OD IN SOFT JAWS - SETTER CONFIRM GRIP)
N10 G21 G40 G80 G99
N20 G28 U0 W0
N30 T0101 (CNMG FACE ROUGH)
N40 G50 S1500
N50 G96 S180 M03
N60 G00 X160.0 Z2.0 M08
N70 G01 Z0.0 F0.25 (FACE FLANGE - REMOVE 2.0 ALLOWANCE)
N80 G01 X88.0
N90 (RAISED FACE FINISH RA3.2)
N100 T0202 (FINISH FACE)
N110 G96 S220
N120 G01 Z0.0 F0.12
N130 T0303 (BORING BAR)
N140 G00 X46.0 Z2.0
N150 G01 Z-42.0 F0.2 (ROUGH BORE)
N160 G00 X50.8 Z2.0
N170 G01 Z-42.0 F0.1 (FINISH BORE 50.8 H8)
N180 G00 Z5.0
N190 G28 U0 W0 M09
N200 M30`;

const MITSUBISHI_OP20 = `(MITSUBISHI M80)
O4026 (SQC-VB-4025 - OP20 VMC FLANGE HOLES - MITSUBISHI M80)
(LOCATE ON OP10 MACHINED FACE + BORE - CONFIRM FIXTURE)
N10 G21 G17 G40 G80 G90
N20 G54 G00 X0 Y0
N30 T01 M06 (NC SPOT DRILL)
N40 S1200 M03
N50 G43 H01 Z25.0 M08
N60 G81 G98 X60.3 Y0 Z-3.0 R3.0 F100 (SPOT 4X PCD 120.6)
N70 X0 Y60.3
N80 X-60.3 Y0
N90 X0 Y-60.3
N100 G80
N110 T02 M06 (DIA 19.0 DRILL)
N120 S650 M03
N130 G43 H02 Z25.0
N140 G83 G98 X60.3 Y0 Z-26.0 R3.0 Q6.0 F90 (PECK 4X THRU)
N150 X0 Y60.3
N160 X-60.3 Y0
N170 X0 Y-60.3
N180 G80 G49 Z100.0 M09
N190 G28 G91 Z0
N200 M30`;

export default function CncPrograms({ store, searchQuery, onUpdateStore, addToast }: CncProgramsProps) {
  // Step tracker
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isShimmering, setIsShimmering] = useState<boolean>(false);
  const [shimmerText, setShimmerText] = useState<string>("");

  // Selected order for queue tracking
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");

  // Selection state for controller
  const [selectedController, setSelectedController] = useState<ProgramController>("Fanuc 0i-TF");

  // G-code text editor states (initialized with Fanuc defaults)
  const [op10Code, setOp10Code] = useState<string>(FANUC_OP10);
  const [op20Code, setOp20Code] = useState<string>(FANUC_OP20);

  // Active Editor Tab: "OP10" | "OP20" | "CMM"
  const [activeEditorTab, setActiveEditorTab] = useState<"OP10" | "OP20" | "CMM">("OP10");

  // Timer states for Step 03 review
  const [seconds, setSeconds] = useState<number>(0);

  // Download Tracker to show the success card
  const [hasDownloaded, setHasDownloaded] = useState<boolean>(false);

  // Extraction chips state
  const [chips, setChips] = useState([
    { id: 1, label: "Material", value: "ASTM A351 CF8M (cast SS316)", tag: null },
    { id: 2, label: "Condition", value: "Investment casting · 2.0 mm machining allowance", tag: null },
    { id: 3, label: "Machined surfaces", value: "Flange face, raised face, bore, bolt holes (rest as-cast)", tag: null },
    { id: 4, label: "Flange OD", value: "152.4 mm (as-cast, ref.)", tag: "AS-CAST" },
    { id: 5, label: "Raised face", value: "Ø92.0 · Ra 3.2", tag: "MACHINED" },
    { id: 6, label: "Bore", value: "Ø50.8 H8 · depth 42.0", tag: "MACHINED" },
    { id: 7, label: "Bolt holes", value: "4× Ø19.0 on PCD 120.6 ±0.2", tag: "MACHINED" },
    { id: 8, label: "Face flatness", value: "0.05", tag: "MACHINED" },
    { id: 9, label: "Datum", value: "B = machined flange face", tag: null },
    { id: 10, label: "Quantity", value: "500 pcs", tag: null },
  ]);
  const [editingChipId, setEditingChipId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");

  // Helper to format UTC to IST for logging
  const getISTTime = (): string => {
    const utcDate = new Date();
    const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000));
    const hh = String(istDate.getUTCHours()).padStart(2, "0");
    const mm = String(istDate.getUTCMinutes()).padStart(2, "0");
    return `${hh}:${mm} IST`;
  };

  // Dialect code swapper mapping
  const getOp10Template = (ctrl: ProgramController) => {
    if (ctrl === "Siemens 828D") return SIEMENS_OP10;
    if (ctrl === "Mitsubishi M80") return MITSUBISHI_OP10;
    return FANUC_OP10;
  };

  const getOp20Template = (ctrl: ProgramController) => {
    if (ctrl === "Siemens 828D") return SIEMENS_OP20;
    if (ctrl === "Mitsubishi M80") return MITSUBISHI_OP20;
    return FANUC_OP20;
  };

  // Triggered when step 4 review timer is active
  useEffect(() => {
    let interval: any;
    if (currentStep === 4) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else if (currentStep < 4) {
      setSeconds(0);
    }
    return () => clearInterval(interval);
  }, [currentStep]);

  // Sync controller selection changes to G-code text editor with a toast
  const handleControllerChange = (ctrl: ProgramController) => {
    setSelectedController(ctrl);
    setOp10Code(getOp10Template(ctrl));
    setOp20Code(getOp20Template(ctrl));
    addToast(`Program regenerated for ${ctrl}`, "success");
  };

  // Step 1 handler
  const handleUseSample = () => {
    setIsShimmering(true);
    setShimmerText("AI reading drawing…");
    setTimeout(() => {
      setIsShimmering(false);
      setCurrentStep(2);
    }, 1400);
  };

  // Step 2 handler
  const handleGenerateCode = () => {
    setIsShimmering(true);
    setShimmerText("Generating program…");
    setTimeout(() => {
      setIsShimmering(false);
      setCurrentStep(3);
    }, 1200);
  };

  // Step 3 handler
  const handleReviewComplete = () => {
    setCurrentStep(4);
  };

  // G-code downloads & utilities
  const handleCopy = () => {
    const activeText = activeEditorTab === "OP10" ? op10Code : op20Code;
    navigator.clipboard.writeText(activeText);
    addToast(`Copied ${activeEditorTab}`, "success");
  };

  const handleDownloadNc = () => {
    const activeText = activeEditorTab === "OP10" ? op10Code : op20Code;
    const filename = `SQC-VB-4025-${activeEditorTab}.nc`;
    
    const blob = new Blob([activeText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setHasDownloaded(true);
    addToast(`Downloaded ${filename}`, "success");
  };

  const handleDownloadBoth = () => {
    const combinedText = `===== OP10 — CNC TURNING =====\n\n${op10Code}\n\n===== OP20 — VMC =====\n\n${op20Code}`;
    const filename = "SQC-VB-4025-CNC-PROGRAMS.txt";
    
    const blob = new Blob([combinedText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setHasDownloaded(true);
    addToast(`Downloaded both as ${filename}`, "success");
  };

  const handleResetToGenerated = () => {
    setOp10Code(getOp10Template(selectedController));
    setOp20Code(getOp20Template(selectedController));
    addToast("Restored verbatim program templates.", "info");
  };

  const handleStartNewDrawing = () => {
    setCurrentStep(1);
    setSeconds(0);
    setHasDownloaded(false);
    addToast("Reset drawing intake wizard", "info");
  };

  // Chip inline-editing handlers
  const startEditingChip = (id: number, val: string) => {
    setEditingChipId(id);
    setEditingValue(val);
  };

  const saveChipValue = (id: number) => {
    setChips((prev) =>
      prev.map((c) => (c.id === id ? { ...c, value: editingValue } : c))
    );
    setEditingChipId(null);
  };

  // Pipeline Action: Setter Approved & Mutate shared store
  const handleSetterApproved = () => {
    const targetOrderId = selectedOrderId || "SQC-SO-2026-002";
    
    // Create programmatic index based on total programs
    const programId = `SQC-PRG-${store.programs.length + 1}`;
    const minutesReviewed = Math.ceil(seconds / 60) || 1;

    // Create the Program entry
    const newProgram: Program = {
      id: programId,
      orderId: targetOrderId,
      controller: selectedController,
      op10Code,
      op20Code,
      reviewMinutes: minutesReviewed,
      status: "Setter-approved"
    };

    // Map through orders to advance stage from "Machine" to "QC"
    const updatedOrders = store.orders.map((order) => {
      if (order.id === targetOrderId) {
        return { ...order, stage: "QC" as OrderStage };
      }
      return order;
    });

    // Merge into store
    const updatedPrograms = [...store.programs, newProgram];

    const tempStore = {
      ...store,
      orders: updatedOrders,
      programs: updatedPrograms
    };

    // Event entry logging formatted exactly as requested
    const istTime = getISTTime();
    const eventMsg = `${istTime} — CNC program ${programId} setter-approved · Order ${targetOrderId} moved to QC`;
    const finalStore = addEvent(tempStore, "CNC Programs", eventMsg);

    // Call state update callback to synchronize global store
    onUpdateStore(finalStore);

    // Display precise toast
    addToast("Order moved to QC — visible in Dispatch & Docs", "success");

    // Reset wizard back to Step 1
    setCurrentStep(1);
    setSeconds(0);
    setHasDownloaded(false);
  };

  // Format mm:ss string
  const formatTime = (totalSecs: number) => {
    const mm = String(Math.floor(totalSecs / 60)).padStart(2, "0");
    const ss = String(totalSecs % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  // Live query for orders with stage = Machine
  const machineOrders = store.orders.filter((o) => o.stage === "Machine");

  // Helper to extract Alloy and Qty for orders in queue
  const getOrderSpecs = (order: Order) => {
    const quote = store.quotes.find((q) => q.id === order.quoteId);
    if (quote) {
      const rfq = store.rfqs.find((r) => r.id === quote.rfqId);
      if (rfq) {
        return {
          alloy: rfq.specs.material || "ASTM A351 CF8M",
          qty: rfq.specs.qty || 500
        };
      }
    }
    // Context-appropriate fallbacks
    if (order.part.toLowerCase().includes("stem")) return { alloy: "SS410", qty: 1500 };
    if (order.part.toLowerCase().includes("disc")) return { alloy: "CF8M", qty: 500 };
    if (order.part.toLowerCase().includes("housing")) return { alloy: "WCB", qty: 300 };
    return { alloy: "ASTM A351 CF8M", qty: 500 };
  };

  // Auto-select first order with stage = Machine on mount if none is active
  useEffect(() => {
    if (!selectedOrderId && machineOrders.length > 0) {
      setSelectedOrderId(machineOrders[0].id);
    }
  }, [machineOrders, selectedOrderId]);

  // Live program count from store
  const totalPrograms = store.programs.length;
  const hoursSaved = (totalPrograms * 3.3).toFixed(1);

  // Stepper elements
  const steps = [
    { num: "01", label: "Upload Drawing" },
    { num: "02", label: "AI Extraction" },
    { num: "03", label: "Setter Review" },
    { num: "04", label: "CNC Program" }
  ];

  return (
    <div className="space-y-6">
      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-6 items-stretch">
        
        {/* HERO CELL (2x2): Wizard Workspace */}
        <div className="col-span-12 lg:col-span-8 border border-[#E7E5E4] bg-white rounded-2xl p-6 flex flex-col justify-between shadow-sm min-h-[640px] relative overflow-hidden">
          
          {/* Shimmer loading overlay */}
          {isShimmering && (
            <div className="absolute inset-0 bg-white/95 z-30 flex flex-col items-center justify-center transition-all duration-200">
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-stone-100 border-t-[#D97706] animate-spin"></div>
                <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#D97706] animate-pulse" />
                </div>
              </div>
              <p className="font-mono text-sm text-[#D97706] font-bold tracking-tight animate-pulse">
                {shimmerText}
              </p>
              <span className="text-xs font-sans text-stone-500 mt-1 font-medium">
                Unit-2 Shapar CNC Engine processing...
              </span>
            </div>
          )}

          <div>
            {/* Persistent Kicker */}
            <div className="font-mono text-xs font-bold text-[#79716B] tracking-tight mb-4 border-b border-stone-100 pb-2.5 flex items-center justify-between">
              <span>SQC-VB-4025 · 2" GATE VALVE BODY · ASTM A351 CF8M · INVESTMENT CASTING · Qty 500</span>
              <span className="text-[10px] bg-stone-100 border border-stone-200 text-stone-600 px-2 py-0.5 rounded uppercase font-semibold">
                Model Showcase
              </span>
            </div>

            {/* Stepper Header */}
            <div className="grid grid-cols-4 gap-4 border-b border-stone-100 pb-4 mb-6">
              {steps.map((step, idx) => {
                const stepNum = idx + 1;
                const isActive = currentStep === stepNum;
                const isCompleted = currentStep > stepNum;

                return (
                  <div 
                    key={step.num}
                    className={`flex flex-col pb-2 transition-all duration-150 relative ${
                      isActive ? "border-b-2 border-[#D97706]" : ""
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      {isCompleted ? (
                        <span className="w-4 h-4 rounded-full bg-[#D97706]/10 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-[#D97706] stroke-[3]" />
                        </span>
                      ) : (
                        <span className={`text-xs font-mono font-bold ${isActive ? "text-[#D97706]" : "text-stone-400"}`}>
                          {step.num}
                        </span>
                      )}
                      <span className={`text-[10px] font-mono uppercase tracking-wider font-bold hidden md:inline ${
                        isActive ? "text-stone-900" : isCompleted ? "text-[#D97706]" : "text-stone-400"
                      }`}>
                        {step.label.split(" ").slice(1).join(" ")}
                      </span>
                    </div>
                    <span className={`text-xs font-sans font-bold leading-tight truncate ${
                      isActive ? "text-stone-900" : isCompleted ? "text-stone-700" : "text-stone-400"
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Step 1: Upload Drawing */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-fade-in">
                {/* Dashed Dropzone */}
                <div className="border-2 border-dashed border-[#E7E5E4] hover:border-amber-400 rounded-2xl p-8 bg-stone-50/50 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-150">
                  <Upload className="w-8 h-8 text-stone-400 mb-3" />
                  <p className="text-sm font-sans font-semibold text-stone-700 mb-1">
                    Drag & drop casting drawing files here
                  </p>
                  <span className="text-xs font-mono text-stone-500">
                    Supports PDF, DXF, DWG · Max 25 MB
                  </span>
                </div>

                {/* Sample drawing card */}
                <div className="border border-[#E7E5E4] rounded-2xl p-5 bg-white space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-stone-100 pb-3">
                    <div>
                      <h3 className="font-sora font-semibold text-lg text-stone-900 leading-snug">
                        SQC-VB-4025 Rev B — 2" Gate Valve Body
                      </h3>
                      <p className="text-xs font-mono text-[#79716B] mt-0.5">
                        ASTM A351 CF8M · Investment casting · 2.0 mm machining allowance on marked surfaces
                      </p>
                    </div>
                    <button
                      id="use-sample-btn"
                      onClick={handleUseSample}
                      className="bg-[#D97706] hover:bg-amber-700 active:scale-[0.98] text-white px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider shrink-0 transition-all shadow-sm"
                    >
                      Use sample drawing (demo)
                    </button>
                  </div>

                  {/* Inline Technical SVG Blueprint */}
                  <div className="bg-white border border-stone-200/80 rounded-xl p-2 overflow-x-auto">
                    <svg viewBox="0 0 600 240" className="w-full min-w-[550px] bg-white rounded-lg">
                      <defs>
                        <pattern id="grid-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
                          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#F5F5F4" strokeWidth="1" />
                        </pattern>
                        <pattern id="hatch-pattern" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                          <line x1="0" y1="0" x2="0" y2="8" stroke="#E7E5E4" strokeWidth="0.8" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid-pattern)" />

                      {/* FRONT VIEW (Left, X=160) */}
                      <g transform="translate(160, 110)">
                        {/* Outer Circle */}
                        <circle r="60" fill="none" stroke="#1C1917" strokeWidth="1.5" />
                        {/* Center dasher */}
                        <line x1="-70" y1="0" x2="70" y2="0" stroke="#A8A29E" strokeWidth="1" strokeDasharray="6,3,1,3" />
                        <line x1="0" y1="-70" x2="0" y2="70" stroke="#A8A29E" strokeWidth="1" strokeDasharray="6,3,1,3" />
                        {/* PCD Circle */}
                        <circle r="48" fill="none" stroke="#78716C" strokeWidth="0.8" strokeDasharray="3,3" />
                        {/* Raised Face Circle */}
                        <circle r="36" fill="none" stroke="#44403C" strokeWidth="1" />
                        {/* Inner Bore */}
                        <circle r="20" fill="none" stroke="#1C1917" strokeWidth="2" />
                        {/* 4 holes of radius 6 on PCD */}
                        <circle cx="48" cy="0" r="6" fill="none" stroke="#1C1917" strokeWidth="1.2" />
                        <circle cx="0" cy="48" r="6" fill="none" stroke="#1C1917" strokeWidth="1.2" />
                        <circle cx="-48" cy="0" r="6" fill="none" stroke="#1C1917" strokeWidth="1.2" />
                        <circle cx="0" cy="-48" r="6" fill="none" stroke="#1C1917" strokeWidth="1.2" />

                        {/* Bolt hole indicator ticks */}
                        <line x1="42" y1="0" x2="54" y2="0" stroke="#44403C" strokeWidth="1" />
                        <line x1="-42" y1="0" x2="-54" y2="0" stroke="#44403C" strokeWidth="1" />

                        {/* Dimension Label Outer Flange */}
                        <path d="M -60 -15 L -80 -15" stroke="#D97706" strokeWidth="1" />
                        <path d="M 60 -15 L 80 -15" stroke="#D97706" strokeWidth="1" />
                        <line x1="-75" y1="-15" x2="75" y2="-15" stroke="#D97706" strokeWidth="1" />
                        <polygon points="-75,-17 -81,-15 -75,-13" fill="#D97706" />
                        <polygon points="75,-17 81,-15 75,-13" fill="#D97706" />
                        <text x="0" y="-19" textAnchor="middle" fill="#D97706" className="font-mono text-[9px] font-bold">Ø152.4 (as-cast)</text>

                        {/* Dimension: Hole pattern */}
                        <path d="M 48 0 L 80 45 L 105 45" fill="none" stroke="#78716C" strokeWidth="1" />
                        <polygon points="48,0 54,6 50,9" fill="#78716C" />
                        <text x="100" y="41" textAnchor="middle" fill="#1C1917" className="font-mono text-[8.5px] font-semibold">4× Ø19 on PCD 120.6</text>
                      </g>

                      {/* SECTION A-A (Right, X=420) */}
                      <g transform="translate(420, 110)">
                        {/* Flange walls section (Left side) */}
                        <rect x="-45" y="-55" width="16" height="35" fill="url(#hatch-pattern)" stroke="#1C1917" strokeWidth="1.2" />
                        <rect x="-45" y="20" width="16" height="35" fill="url(#hatch-pattern)" stroke="#1C1917" strokeWidth="1.2" />

                        {/* Flange walls section (Right side) */}
                        <rect x="29" y="-55" width="16" height="35" fill="url(#hatch-pattern)" stroke="#1C1917" strokeWidth="1.2" />
                        <rect x="29" y="20" width="16" height="35" fill="url(#hatch-pattern)" stroke="#1C1917" strokeWidth="1.2" />

                        {/* Connected pipe throat outline */}
                        <rect x="-29" y="-35" width="58" height="70" fill="none" stroke="#1C1917" strokeWidth="1.2" />

                        {/* Inner bore chamber */}
                        <rect x="-20" y="-55" width="40" height="110" fill="#FFFFFF" stroke="#1C1917" strokeWidth="1.2" />

                        {/* Bore Depth step at depth 42.0 */}
                        <line x1="-20" y1="-13" x2="20" y2="-13" stroke="#1C1917" strokeWidth="1.8" />

                        {/* Centerline */}
                        <line x1="0" y1="-65" x2="0" y2="65" stroke="#A8A29E" strokeWidth="1" strokeDasharray="6,3,1,3" />

                        {/* Dimension: Ø50.8 Bore */}
                        <line x1="-20" y1="-40" x2="20" y2="-40" stroke="#78716C" strokeWidth="1" />
                        <polygon points="-20,-42 -26,-40 -20,-38" fill="#78716C" />
                        <polygon points="20,-42 26,-40 20,-38" fill="#78716C" />
                        <text x="0" y="-44" textAnchor="middle" fill="#1C1917" className="font-mono text-[9px] font-bold">Ø50.8 H8</text>

                        {/* Dimension Depth 42.0 */}
                        <line x1="20" y1="-55" x2="55" y2="-55" stroke="#78716C" strokeWidth="0.8" />
                        <line x1="20" y1="-13" x2="55" y2="-13" stroke="#78716C" strokeWidth="0.8" />
                        <line x1="50" y1="-55" x2="50" y2="-13" stroke="#78716C" strokeWidth="0.8" />
                        <polygon points="48,-55 50,-61 52,-55" fill="#78716C" />
                        <polygon points="48,-13 50,-7 52,-13" fill="#78716C" />
                        <text x="58" y="-31" textAnchor="start" fill="#1C1917" className="font-mono text-[8px] font-semibold">42.0 DP</text>

                        {/* Dimension Raised Face Ø92.0 */}
                        <line x1="-36" y1="58" x2="36" y2="58" stroke="#78716C" strokeWidth="0.8" />
                        <polygon points="-36,56 -42,58 -36,60" fill="#78716C" />
                        <polygon points="36,56 42,58 36,60" fill="#78716C" />
                        <text x="0" y="69" textAnchor="middle" fill="#1C1917" className="font-mono text-[8.5px]">Ø92.0 Raised Face</text>
                      </g>

                      {/* Legend Notes Block */}
                      <text x="15" y="230" fill="#78716C" className="font-mono text-[8.5px] font-bold">▽ 2.0 MACH. ALLOW. ON MARKED SURFACES</text>

                      {/* Technical block border bottom right */}
                      <rect x="360" y="195" width="230" height="38" fill="#FAFAF9" stroke="#E7E5E4" strokeWidth="1" />
                      <text x="368" y="209" fill="#44403C" className="font-mono text-[8px] font-bold">SQC-VB-4025 Rev B | CF8M | QTY 500</text>
                      <text x="368" y="224" fill="#1C1917" className="font-mono text-[8.5px] font-bold">SUPER QUALI CAST (INDIA) PVT. LTD.</text>
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: AI Extraction */}
            {currentStep === 2 && (
              <div className="space-y-5 animate-fade-in">
                {/* Routing Card */}
                <div className="border border-[#E7E5E4] rounded-xl p-4 bg-stone-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
                  <div className="text-stone-700 space-y-0.5">
                    <p className="font-bold">Complexity: Standard — 8 dimensions, single part, no family table</p>
                    <p className="text-stone-500">Routed to: Claude Sonnet · Est. AI cost this drawing: $0.04 (~₹3.5)</p>
                  </div>
                  <span className="bg-amber-50 text-[#D97706] border border-amber-200 px-2 py-0.5 rounded uppercase font-bold text-[10px]">
                    Extraction Complete
                  </span>
                </div>

                {/* Grid of 10 extraction chips */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {chips.map((chip) => {
                    const isEditing = editingChipId === chip.id;

                    return (
                      <div 
                        key={chip.id}
                        className="bg-white border border-[#E7E5E4] rounded-2xl p-4 hover:border-stone-400 transition-all duration-150 flex flex-col justify-between min-h-[92px] relative"
                      >
                        {/* Label & Tag Row */}
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5 text-emerald-700 stroke-[3]" />
                            </span>
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400">
                              {chip.label}
                            </span>
                          </div>
                          
                          {chip.tag && (
                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wide border ${
                              chip.tag === "MACHINED" 
                                ? "bg-amber-50 text-[#D97706] border-amber-200" 
                                : "bg-stone-50 text-stone-500 border-stone-200"
                            }`}>
                              {chip.tag}
                            </span>
                          )}
                        </div>

                        {/* Interactive Edit / Value Display */}
                        <div className="flex items-end justify-between gap-4 mt-auto">
                          {isEditing ? (
                            <div className="flex items-center gap-2 w-full">
                              <input
                                type="text"
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveChipValue(chip.id);
                                }}
                                className="flex-1 font-mono text-xs text-stone-900 border border-stone-300 rounded px-2 py-1 focus:outline-none focus:border-[#D97706] bg-amber-50/20"
                                autoFocus
                              />
                              <button 
                                onClick={() => saveChipValue(chip.id)}
                                className="bg-[#D97706] text-white font-mono text-[10px] uppercase font-bold px-2 py-1 rounded hover:bg-amber-700 shrink-0"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <p className="font-mono text-xs text-stone-900 font-bold leading-relaxed break-words flex-1 pr-2">
                              {chip.value}
                            </p>
                          )}

                          {!isEditing && (
                            <button
                              onClick={() => startEditingChip(chip.id, chip.value)}
                              className="text-stone-400 hover:text-stone-700 p-1 shrink-0"
                              title="Edit Value"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Process recommendation banner */}
                <div className="border-l-4 border-[#D97706] bg-stone-50 p-4 rounded-r-xl">
                  <p className="text-xs font-mono text-stone-700 leading-relaxed font-semibold">
                    2 operations required — OP10 turning (face + raised face + bore), OP20 VMC (4× flange bolt holes). Locate OP20 on OP10 machined face + bore. Setter confirms fixturing.
                  </p>
                </div>

                {/* Checkpoint 1 card */}
                <div className="bg-[#FFFBEB] border border-amber-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-xs font-sans font-bold text-stone-900">Checkpoint 1 — Confirm the extracted values before program generation</p>
                    <p className="text-[11px] font-mono text-[#79716B]">Setter sign-off is logged with the program.</p>
                  </div>
                  <button
                    onClick={handleGenerateCode}
                    className="bg-[#D97706] hover:bg-amber-700 active:scale-[0.98] text-white px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider shrink-0 transition-all shadow-sm"
                  >
                    Confirm & Generate G-Code
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Setter Review */}
            {currentStep === 3 && (
              <div className="space-y-5 animate-fade-in">
                {/* 3 Controller Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Card A */}
                  <div 
                    onClick={() => handleControllerChange("Fanuc 0i-TF")}
                    className={`cursor-pointer border rounded-2xl p-4 transition-all duration-150 flex flex-col justify-between min-h-[140px] bg-white ${
                      selectedController === "Fanuc 0i-TF" 
                        ? "ring-2 ring-[#D97706] border-transparent" 
                        : "border-[#E7E5E4] hover:border-stone-400 hover:translate-y-[-1px]"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-sora font-semibold text-base text-stone-900">
                          Fanuc 0i-TF / 0i-MF
                        </h4>
                        <span className="text-[9px] font-mono bg-amber-50 text-[#D97706] border border-amber-200 px-1.5 py-0.5 rounded font-bold">
                          ⭐ Recommended
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-stone-500">
                        ISO G-code · Rajkot SME standard
                      </p>
                    </div>
                    <p className="text-[10px] font-sans font-medium text-stone-600 border-t border-stone-100 pt-2 mt-2">
                      OP10 turning on 0i-TF · OP20 VMC on 0i-MF
                    </p>
                  </div>

                  {/* Card B */}
                  <div 
                    onClick={() => handleControllerChange("Siemens 828D")}
                    className={`cursor-pointer border rounded-2xl p-4 transition-all duration-150 flex flex-col justify-between min-h-[140px] bg-white ${
                      selectedController === "Siemens 828D" 
                        ? "ring-2 ring-[#D97706] border-transparent" 
                        : "border-[#E7E5E4] hover:border-stone-400 hover:translate-y-[-1px]"
                    }`}
                  >
                    <div className="space-y-1">
                      <h4 className="font-sora font-semibold text-base text-stone-900">
                        Siemens SINUMERIK 828D
                      </h4>
                      <p className="text-[11px] font-mono text-stone-500">
                        CYCLE81 / CYCLE83 · TRANS · named tools
                      </p>
                    </div>
                    <p className="text-[10px] font-sans font-medium text-stone-600 border-t border-stone-100 pt-2 mt-2">
                      For imported machining cells
                    </p>
                  </div>

                  {/* Card C */}
                  <div 
                    onClick={() => handleControllerChange("Mitsubishi M80")}
                    className={`cursor-pointer border rounded-2xl p-4 transition-all duration-150 flex flex-col justify-between min-h-[140px] bg-white ${
                      selectedController === "Mitsubishi M80" 
                        ? "ring-2 ring-[#D97706] border-transparent" 
                        : "border-[#E7E5E4] hover:border-stone-400 hover:translate-y-[-1px]"
                    }`}
                  >
                    <div className="space-y-1">
                      <h4 className="font-sora font-semibold text-base text-stone-900">
                        Mitsubishi M80
                      </h4>
                      <p className="text-[11px] font-mono text-stone-500">
                        Fanuc-compatible dialect
                      </p>
                    </div>
                    <p className="text-[10px] font-sans font-medium text-stone-600 border-t border-stone-100 pt-2 mt-2">
                      For M8-series machines
                    </p>
                  </div>

                </div>

                <p className="text-xs font-mono text-stone-400 text-center uppercase tracking-wider">
                  Program syntax adapts to the selected controller.
                </p>

                {/* Action button review complete */}
                <div className="flex justify-end pt-4 border-t border-stone-100">
                  <button
                    onClick={handleReviewComplete}
                    className="bg-[#D97706] hover:bg-amber-700 active:scale-[0.98] text-white px-6 py-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm"
                  >
                    Review complete → View program
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: CNC Program */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-fade-in">
                
                {/* Header row details */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-stone-100 pb-2">
                  <span className="text-xs font-mono text-[#79716B]">
                    Export format: {selectedController === "Siemens 828D" ? "Siemens SINUMERIK 828D" : selectedController === "Mitsubishi M80" ? "Mitsubishi M80" : "Fanuc ISO G-code"} · dialect follows selected controller
                  </span>
                  <div className="flex items-center gap-3 font-mono text-xs text-stone-500">
                    <span className={activeEditorTab === "OP10" ? "text-stone-800 font-bold underline" : ""}>SQC-VB-4025-OP10.nc</span>
                    <span>·</span>
                    <span className={activeEditorTab === "OP20" ? "text-stone-800 font-bold underline" : ""}>SQC-VB-4025-OP20.nc</span>
                  </div>
                </div>

                {/* Datum callout card */}
                <div className="border-l-4 border-[#D97706] bg-stone-50 p-4 rounded-r-xl">
                  <p className="text-xs font-mono text-stone-700 leading-relaxed font-semibold">
                    OP10 grips as-cast OD in soft jaws → OP20 locates on OP10 machined face + bore. Setter confirms fixturing before first cut.
                  </p>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[#E7E5E4] gap-1 bg-stone-50 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveEditorTab("OP10")}
                    className={`flex-1 text-center py-2 rounded-lg text-xs font-mono font-bold transition-all ${
                      activeEditorTab === "OP10"
                        ? "bg-white text-stone-900 shadow-sm border border-stone-200"
                        : "text-stone-500 hover:text-stone-900"
                    }`}
                  >
                    [ OP10 — CNC TURNING ]
                  </button>

                  <button
                    onClick={() => setActiveEditorTab("OP20")}
                    className={`flex-1 text-center py-2 rounded-lg text-xs font-mono font-bold transition-all ${
                      activeEditorTab === "OP20"
                        ? "bg-white text-stone-900 shadow-sm border border-stone-200"
                        : "text-stone-500 hover:text-stone-900"
                    }`}
                  >
                    [ OP20 — VMC ]
                  </button>

                  {/* Disabled Tooltip CMM Tab */}
                  <div className="flex-1 relative group cursor-not-allowed">
                    <button
                      disabled
                      className="w-full text-center py-2 rounded-lg text-xs font-mono font-bold text-stone-300 cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      [ CMM Inspection Program <Lock className="w-3 h-3 text-stone-300" /> ]
                    </button>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-stone-900 text-white text-[10px] font-sans rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-center shadow-lg leading-relaxed z-50">
                      Available in pilot — Zeiss CMM · Unit-2. Same extracted features can draft the inspection routine.
                    </div>
                  </div>
                </div>

                {/* Scroll-Synced Custom Code Editor Panel */}
                <div>
                  {activeEditorTab === "OP10" && (
                    <div className="flex font-mono text-xs md:text-sm bg-[#1C1917] text-stone-300 rounded-xl overflow-hidden border border-stone-800">
                      <div className="bg-[#181614] text-stone-500 py-4 px-3 text-right select-none border-r border-stone-800 min-w-[3.5rem] flex flex-col font-medium">
                        {op10Code.split("\n").map((_, i) => (
                          <span key={i} className="leading-6 h-6">{String(i + 1).padStart(2, "0")}</span>
                        ))}
                      </div>
                      <textarea
                        value={op10Code}
                        onChange={(e) => setOp10Code(e.target.value)}
                        className="flex-1 bg-transparent text-amber-500 p-4 font-mono leading-6 h-[280px] resize-none focus:outline-none overflow-y-auto selection:bg-amber-800/40"
                        spellCheck="false"
                      />
                    </div>
                  )}

                  {activeEditorTab === "OP20" && (
                    <div className="flex font-mono text-xs md:text-sm bg-[#1C1917] text-stone-300 rounded-xl overflow-hidden border border-stone-800">
                      <div className="bg-[#181614] text-stone-500 py-4 px-3 text-right select-none border-r border-stone-800 min-w-[3.5rem] flex flex-col font-medium">
                        {op20Code.split("\n").map((_, i) => (
                          <span key={i} className="leading-6 h-6">{String(i + 1).padStart(2, "0")}</span>
                        ))}
                      </div>
                      <textarea
                        value={op20Code}
                        onChange={(e) => setOp20Code(e.target.value)}
                        className="flex-1 bg-transparent text-amber-500 p-4 font-mono leading-6 h-[280px] resize-none focus:outline-none overflow-y-auto selection:bg-amber-800/40"
                        spellCheck="false"
                      />
                    </div>
                  )}
                </div>

                {/* Editor Utility Actions */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-100">
                  <button
                    onClick={handleCopy}
                    className="border border-[#E7E5E4] hover:bg-stone-50 text-stone-700 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copy
                  </button>

                  <button
                    onClick={handleDownloadNc}
                    className="border border-[#E7E5E4] hover:bg-stone-50 text-stone-700 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download .nc
                  </button>

                  <button
                    onClick={handleDownloadBoth}
                    className="border border-[#E7E5E4] hover:bg-stone-50 text-stone-700 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download both (.txt)
                  </button>

                  <button
                    onClick={handleResetToGenerated}
                    className="border border-[#E7E5E4] hover:bg-stone-50 text-stone-700 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Reset to generated
                  </button>

                  <button
                    onClick={handleStartNewDrawing}
                    className="text-stone-500 hover:text-[#D97706] text-xs font-mono font-bold hover:underline py-1.5 px-3 shrink-0"
                  >
                    Start new drawing
                  </button>
                </div>

                {/* Export Success Card */}
                {hasDownloaded && (
                  <div className="bg-stone-50 border border-stone-200/60 rounded-xl p-4 font-mono text-xs text-stone-600 leading-relaxed space-y-0.5 animate-fade-in">
                    <p className="font-bold text-stone-800">
                      Saved: SQC-VB-4025-OP10.nc  ·  Controller: {selectedController}
                    </p>
                    <p>
                      Setter review: {formatTime(seconds)}  ·  Target: 10:00
                    </p>
                    <p className="text-[#D97706] font-semibold">
                      Baseline program — setter validates before first cut.
                    </p>
                  </div>
                )}

                {/* Pipeline action trigger */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-stone-100">
                  {/* Compact Setter Review Timer */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 text-stone-700 shrink-0">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-bold">
                      Setter Review Timer:
                    </span>
                    <div className={`font-mono text-xs font-bold tracking-tight flex items-center gap-1 ${
                      seconds >= 600 ? "text-[#D97706]" : "text-stone-900"
                    }`}>
                      <Clock className="w-3.5 h-3.5 animate-pulse text-[#D97706]" />
                      {formatTime(seconds)}
                    </div>
                  </div>

                  <button
                    onClick={handleSetterApproved}
                    className="bg-[#D97706] hover:bg-amber-700 active:scale-[0.98] text-white px-6 py-3 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    Setter approved →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Persistent Amber Disclaimer Banner */}
          {currentStep >= 3 && (
            <div className="mt-6 bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-sans font-bold text-[#D97706] uppercase tracking-wider">
                  Baseline Program Notice
                </span>
                <p className="text-xs text-stone-700 leading-relaxed font-medium">
                  Baseline program shown. Tool offsets, feeds/speeds for cast CF8M, and fixture check are completed by your setter before first cut.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN containing 1x1 KPIs */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          
          {/* KPI 1 (1x1): Programming turnaround */}
          <div className="border border-[#E7E5E4] bg-white rounded-2xl p-6 flex flex-col justify-between shadow-sm h-[268px]">
            <div>
              <span className="text-xs font-mono font-bold uppercase text-stone-400 tracking-wider block mb-1">
                Process Velocity
              </span>
              <h3 className="font-sora font-semibold text-base text-stone-800">
                Programming Cycle Time
              </h3>
            </div>
            
            <div className="my-auto py-2">
              <div className="font-sora text-3xl xl:text-4xl font-semibold tracking-tight text-[#D97706] leading-none">
                3.5 hrs → 10 min
              </div>
            </div>

            <div>
              <p className="font-mono text-xs text-stone-500 leading-normal">
                Target turnaround after drawing intake & feature extraction review.
              </p>
            </div>
          </div>

          {/* KPI 2 (1x1): Programs this month */}
          <div className="border border-[#E7E5E4] bg-white rounded-2xl p-6 flex flex-col justify-between shadow-sm h-[268px]">
            <div>
              <span className="text-xs font-mono font-bold uppercase text-stone-400 tracking-wider block mb-1">
                Production Output
              </span>
              <h3 className="font-sora font-semibold text-base text-stone-800">
                Programs This Month
              </h3>
            </div>

            <div className="my-auto py-2">
              <div className="font-sora text-5xl xl:text-6xl font-bold tracking-tight text-[#D97706] leading-none">
                {totalPrograms}
              </div>
            </div>

            <div>
              <p className="font-mono text-xs text-stone-500 leading-normal">
                ≈ {hoursSaved} hrs saved through automated drafting templates.
              </p>
            </div>
          </div>

        </div>

        {/* BOTTOM ROW: Program queue (2x1) */}
        <div className="col-span-12 border border-[#E7E5E4] bg-white rounded-2xl p-6 flex flex-col shadow-sm min-h-[320px]">
          <div className="border-b border-stone-100 pb-4 mb-4 flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-xs font-mono font-bold uppercase text-stone-400 tracking-wider block mb-0.5">
                Unit-2 Shapar CNC
              </span>
              <h3 className="font-sora font-semibold text-lg text-stone-900 leading-none">
                Program Queue
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold bg-amber-50 text-[#D97706] border border-amber-200 px-2.5 py-1 rounded uppercase">
              {machineOrders.length} orders at machine stage
            </span>
          </div>

          <p className="text-xs text-stone-500 leading-relaxed font-sans mb-4">
            Orders from the shared store with <code className="font-mono text-[11px] font-bold bg-stone-100 px-1 py-0.5 rounded text-stone-700">stage = Machine</code> appear here automatically. Select an order row to link and sign off its program.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead>
                <tr className="border-b border-stone-100 text-[#79716B] font-mono uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3 px-2">Order ID</th>
                  <th className="py-3 px-2">Customer</th>
                  <th className="py-3 px-2">Part</th>
                  <th className="py-3 px-2">Alloy</th>
                  <th className="py-3 px-2">Qty</th>
                  <th className="py-3 px-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {machineOrders.length > 0 ? (
                  machineOrders.map((order) => {
                    const isSelected = selectedOrderId === order.id;
                    const specs = getOrderSpecs(order);

                    // Find if a program is already approved for this order
                    const existingProg = store.programs.find(p => p.orderId === order.id);
                    const status = existingProg ? existingProg.status : "Queued";

                    return (
                      <tr
                        key={order.id}
                        onClick={() => {
                          setSelectedOrderId(order.id);
                          addToast(`Linked order ${order.id} to drawing intake workspace`, "info");
                        }}
                        className={`cursor-pointer transition-colors duration-150 group ${
                          isSelected 
                            ? "bg-amber-50/40 font-semibold" 
                            : "hover:bg-stone-50"
                        }`}
                      >
                        <td className="py-3.5 px-2 font-mono font-bold text-stone-900">
                          <span className={`inline-block px-1.5 py-0.5 rounded ${
                            isSelected ? "bg-amber-100/60 text-[#D97706]" : "bg-stone-100 text-stone-700"
                          }`}>
                            {order.id}
                          </span>
                        </td>
                        <td className="py-3.5 px-2 text-stone-800">
                          {order.customer}
                        </td>
                        <td className="py-3.5 px-2 text-stone-600">
                          {order.part}
                        </td>
                        <td className="py-3.5 px-2 font-mono text-stone-500">
                          {specs.alloy}
                        </td>
                        <td className="py-3.5 px-2 font-mono text-stone-500">
                          {specs.qty}
                        </td>
                        <td className="py-3.5 px-2 text-right">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wide border ${
                            status === "Setter-approved"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : status === "Generated"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-stone-50 text-stone-500 border-stone-200"
                          }`}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-stone-400 font-mono">
                      No active orders at Machine stage in the system.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
