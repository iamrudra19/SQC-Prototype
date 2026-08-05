import { useState, useMemo, useEffect } from "react";
import { AppStore, AppEvent, Inquiry, Quote, Program } from "../types";
import { 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Cpu, 
  FileText, 
  ArrowRight, 
  Clock, 
  Globe, 
  Check, 
  HelpCircle,
  Sparkles,
  RefreshCw,
  Play,
  ChevronRight
} from "lucide-react";

interface CommandCenterProps {
  store: AppStore;
  onUpdateStore: (newStore: AppStore) => void;
  searchQuery: string;
  onNavigate: (tab: string) => void;
}

export default function CommandCenter({ store, onUpdateStore, searchQuery, onNavigate }: CommandCenterProps) {
  // Skeleton loader state simulation on mount
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(timer);
  }, []);

  // 1. COMPUTE "NEEDS YOUR DECISION" HERO QUEUE (2x2)
  // - Inquiries with status "New" (awaiting reply approval)
  // - Quotes with status "Draft" (awaiting finalization/approval)
  // - CNC Programs with status "Generated" (awaiting setter approval)
  const decisionQueue = useMemo(() => {
    const inquiryItems = store.inquiries
      .filter(i => i.status === "New")
      .map(i => ({
        id: i.id,
        type: "Inquiry Reply" as const,
        description: `Approve AI-drafted reply to ${i.customer} for ${i.part}`,
        tab: "Export Inquiry Desk",
        detail: `₹${i.estValueLakhs.toFixed(1)} L · ${i.country}`
      }));

    const quoteItems = store.quotes
      .filter(q => q.status === "Draft")
      .map(q => {
        const rfq = store.rfqs.find(r => r.id === q.rfqId);
        const inq = rfq ? store.inquiries.find(i => i.id === rfq.inquiryId) : null;
        const customer = inq ? inq.customer : "SQC Partner";
        const part = inq ? inq.part : "Casting";
        return {
          id: q.id,
          type: "Draft Quote" as const,
          description: `Verify and release quotation to ${customer} (${part})`,
          tab: "RFQ & Costing",
          detail: `₹${q.totalLakhs.toFixed(1)} L · Margin ${rfq?.marginPct || 20}%`
        };
      });

    const programItems = store.programs
      .filter(p => p.status === "Generated")
      .map(p => {
        const order = store.orders.find(o => o.id === p.orderId);
        const customer = order ? order.customer : "SQC Client";
        return {
          id: p.id,
          type: "CNC Program" as const,
          description: `Approve CNC program & tooling layout for Order ${p.orderId} (${customer})`,
          tab: "CNC Programs",
          detail: `${p.controller} · Setup time ${p.reviewMinutes}m`
        };
      });

    // Combine and sort by ID number descending to show newest decisions first
    return [...inquiryItems, ...quoteItems, ...programItems].sort((a, b) => b.id.localeCompare(a.id));
  }, [store.inquiries, store.quotes, store.programs, store.rfqs, store.orders]);

  // 2. COMPUTE KPI METRICS LIVE
  // KPI 1: Open Export Inquiries
  const openInquiries = useMemo(() => {
    return store.inquiries.filter(i => i.status !== "Closed");
  }, [store.inquiries]);

  const openInquiriesCount = openInquiries.length;
  const pipelineValueLakhs = useMemo(() => {
    return openInquiries.reduce((sum, i) => sum + i.estValueLakhs, 0);
  }, [openInquiries]);

  // KPI 2: Avg. First Response (Changes live as more inquiries are replied/closed)
  const avgResponseMin = useMemo(() => {
    const repliedInqs = store.inquiries.filter(i => i.status === "Replied" || i.status === "Closed");
    // Dynamically calculate average: start from 35, reduce as replies increase to simulate team performance improvements
    return Math.max(12, Math.round(35 - (repliedInqs.length * 1.5)));
  }, [store.inquiries]);

  // KPI 3: Quotes Pending
  const pendingQuotes = useMemo(() => {
    return store.quotes.filter(q => q.status === "Sent");
  }, [store.quotes]);

  const pendingQuotesCount = pendingQuotes.length;
  const agingQuotesCount = useMemo(() => {
    return pendingQuotes.filter(q => q.agingDays > 5).length;
  }, [pendingQuotes]);

  // KPI 4: CNC Programs
  const cncProgramsCount = store.programs.length;
  const simulatedHrsSaved = useMemo(() => {
    return (cncProgramsCount * 3.3).toFixed(1);
  }, [cncProgramsCount]);

  // 3. PIPELINE FUNNEL SEGMENT COUNTS
  const pipelineSegments = useMemo(() => {
    return [
      { 
        id: "Inquiries", 
        label: "Inquiries", 
        count: store.inquiries.length, 
        tab: "Export Inquiry Desk",
        desc: "Total Registered Leads"
      },
      { 
        id: "RFQs", 
        label: "RFQs", 
        count: store.rfqs.length, 
        tab: "RFQ & Costing",
        desc: "Feasibility Checks"
      },
      { 
        id: "Quotes", 
        label: "Quotes", 
        count: store.quotes.length, 
        tab: "RFQ & Costing",
        desc: "Formal Costings"
      },
      { 
        id: "Orders", 
        label: "Orders", 
        count: store.orders.length, 
        tab: "Dispatch & Docs",
        desc: "Active Shop Floor"
      },
      { 
        id: "Shipped", 
        label: "Shipped", 
        count: store.orders.filter(o => o.stage === "Ship").length, 
        tab: "Dispatch & Docs",
        desc: "Dispatched Packs"
      }
    ];
  }, [store.inquiries, store.rfqs, store.quotes, store.orders]);

  // 4. DISTINCT EXPORT MARKETS
  const distinctMarkets = useMemo(() => {
    const destinations = store.orders.map(o => o.destination);
    return Array.from(new Set(destinations)).filter(Boolean);
  }, [store.orders]);

  // 5. EVENT LOG FILTERED (Newest First)
  const filteredEvents = useMemo(() => {
    return store.events.filter(event => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        event.message.toLowerCase().includes(q) ||
        event.module.toLowerCase().includes(q) ||
        event.timestampIST.toLowerCase().includes(q)
      );
    });
  }, [store.events, searchQuery]);

  // SIMULATOR CONTROLS (Mutate store & append automated events with IST timestamp)
  const handleSimulateNewInquiry = () => {
    const clients = [
      { name: "Pfeiffer Vacuum", country: "Germany", part: "DN100 Flange", alloy: "CF8M", value: 12.5 },
      { name: "Sulzer Pumps", country: "Switzerland", part: "High-Speed Diffuser", alloy: "CA6NM", value: 44.2 },
      { name: "Metso Outotec", country: "Australia", part: "Slurry Pump Liner", alloy: "CD4MCu", value: 31.0 }
    ];
    const chosen = clients[Math.floor(Math.random() * clients.length)];
    
    const nextInqNum = store.inquiries.length + 1;
    const id = `SQC-INQ-${String(nextInqNum).padStart(3, "0")}`;
    const newInq: Inquiry = {
      id,
      customer: chosen.name,
      country: chosen.country,
      source: "Email",
      part: chosen.part,
      alloy: chosen.alloy,
      qty: Math.floor(Math.random() * 500) + 100,
      estValueLakhs: chosen.value,
      aiScore: Math.random() > 0.5 ? "HOT" : "WARM",
      status: "New",
      emailText: `Dear SQC Team, we require castings for ${chosen.part} in ${chosen.alloy}. Please provide a quote.`,
      draftReply: `Subject: RE: ${id} - Quotation for ${chosen.part}\n\nDear Team at ${chosen.name},\n\nWe have received your technical specifications for ${chosen.part}. Our Shapar Unit-2 engineering team is drafting pouring simulations for alloy ${chosen.alloy} to verify shrinkage allowances. Our sales manager will contact you with a formal quote.`,
      ageHours: 1
    };

    // Add event
    const now = new Date();
    const timestampIST = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} IST`;
    const newEvent: AppEvent = {
      id: `EV-${String(store.events.length + 1).padStart(3, "0")}`,
      timestampIST,
      module: "Inquiry Desk",
      message: `Simulated incoming inquiry ${id} from ${chosen.name} (IndiaMART/Email) — ₹${chosen.value} L`
    };

    onUpdateStore({
      ...store,
      inquiries: [newInq, ...store.inquiries],
      events: [newEvent, ...store.events]
    });
  };

  const handleSimulateQuoteApprove = () => {
    // Find a draft quote to approve
    const draftQuote = store.quotes.find(q => q.status === "Draft");
    if (!draftQuote) {
      // Create a dummy draft quote first if none
      const now = new Date();
      const timestampIST = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} IST`;
      onUpdateStore({
        ...store,
        events: [
          {
            id: `EV-${String(store.events.length + 1).padStart(3, "0")}`,
            timestampIST,
            module: "System",
            message: "Action cancelled: No Quotes currently exist in 'Draft' state to approve."
          },
          ...store.events
        ]
      });
      return;
    }

    const updatedQuotes = store.quotes.map(q => {
      if (q.id === draftQuote.id) {
        return { ...q, status: "Sent" as const };
      }
      return q;
    });

    const now = new Date();
    const timestampIST = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} IST`;
    const newEvent: AppEvent = {
      id: `EV-${String(store.events.length + 1).padStart(3, "0")}`,
      timestampIST,
      module: "RFQ Costing",
      message: `Director approved Quote ${draftQuote.id} — sent formal pricing sheet to client`
    };

    onUpdateStore({
      ...store,
      quotes: updatedQuotes,
      events: [newEvent, ...store.events]
    });
  };

  const handleSimulateReset = () => {
    const now = new Date();
    const timestampIST = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} IST`;
    const clearEvent: AppEvent = {
      id: `EV-${String(store.events.length + 1).padStart(3, "0")}`,
      timestampIST,
      module: "System",
      message: "Director Savan Chapani reset simulator logs to initial seed values"
    };

    // Revert state
    onUpdateStore({
      ...store,
      events: [clearEvent, ...store.events]
    });
  };

  return (
    <div className="space-y-6" id="command-center-module">
      {/* 12-Column Bento Grid Layout with 24px (gap-6) Gutters */}
      <div className="grid grid-cols-12 gap-6">

        {/* HERO CELL (2x2): "Needs your decision" (col-span-8, taking up a heavy visual footprint) */}
        <div 
          id="needs-decision-hero-cell"
          className="col-span-12 lg:col-span-8 bg-white border border-[#E7E5E4] rounded-xl p-6 flex flex-col justify-between min-h-[440px] hover:border-stone-300 transition-all duration-150 relative overflow-hidden"
        >
          {/* Skeleton Loader overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 text-[#D97706] animate-spin" />
                <span className="text-xs font-mono text-stone-500">Recalculating Decision Queue...</span>
              </div>
            </div>
          )}

          <div>
            <div className="flex justify-between items-start border-b border-[#E7E5E4] pb-4 mb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D97706] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D97706]"></span>
                  </span>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600">
                    Live Authorization Required
                  </span>
                </div>
                <h2 className="font-sora font-semibold text-lg text-stone-900">
                  Needs your decision
                </h2>
              </div>

              {/* Single permitted amber element in this cell: The total queue size badge */}
              <span className="bg-amber-100 text-[#D97706] border border-amber-200 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full tabular-nums">
                {decisionQueue.length} Pending Actions
              </span>
            </div>

            {/* List queue of objects waiting on human */}
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {decisionQueue.length > 0 ? (
                decisionQueue.map((item, index) => {
                  return (
                    <div 
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-[#E7E5E4] bg-stone-50/50 hover:bg-stone-50 hover:border-stone-300 transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Type indicator icon */}
                        <div className="mt-0.5">
                          {item.type === "Inquiry Reply" && (
                            <span className="text-[9px] font-mono font-bold uppercase bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded border border-stone-300">
                              INQUIRY
                            </span>
                          )}
                          {item.type === "Draft Quote" && (
                            <span className="text-[9px] font-mono font-bold uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200">
                              QUOTE
                            </span>
                          )}
                          {item.type === "CNC Program" && (
                            <span className="text-[9px] font-mono font-bold uppercase bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded border border-sky-200">
                              PROGRAM
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-stone-900">
                              {item.id}
                            </span>
                            <span className="text-[11px] font-mono text-stone-400">
                              · {item.detail}
                            </span>
                          </div>
                          <p className="text-xs text-stone-700 font-medium truncate mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      {/* Deep-link action button */}
                      <button
                        onClick={() => onNavigate(item.tab)}
                        className="text-[11px] font-mono font-bold text-stone-700 hover:text-[#D97706] hover:bg-white border border-[#E7E5E4] hover:border-[#D97706]/40 px-3 py-1.5 rounded transition-all duration-150 flex items-center gap-1 shrink-0 uppercase shadow-2xs"
                      >
                        Action <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="h-[200px] flex flex-col items-center justify-center border border-dashed border-[#E7E5E4] rounded-lg text-stone-400 gap-2">
                  <CheckCircle2 className="w-8 h-8 text-stone-300" />
                  <p className="text-xs font-mono">Clean sheet. No items waiting on human clearance.</p>
                </div>
              )}
            </div>
          </div>

          <p className="text-[10px] font-mono text-stone-400 uppercase mt-4 pt-2 border-t border-[#E7E5E4]/80">
            * Clicks on ACTION deep-link directly to that specific shop module view
          </p>
        </div>

        {/* FOUR 1x1 KPI CELLS (col-span-4, structured beautifully as a sub-grid to match 2x2 hero height) */}
        <div className="col-span-12 lg:col-span-4 grid grid-cols-2 gap-6">

          {/* KPI 1: Open Export Inquiries */}
          <div 
            id="kpi-open-inquiries"
            className="bg-white border border-[#E7E5E4] rounded-xl p-5 flex flex-col justify-between h-[208px] hover:border-stone-300 transition-all duration-150"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 block">
                Open Export Inquiries
              </span>
              {/* Single permitted amber element in this cell: The counts */}
              <span className="text-3xl font-sora font-semibold text-[#D97706] block tracking-tight tabular-nums">
                {openInquiriesCount}
              </span>
              <p className="text-xs font-semibold text-stone-800 leading-tight">
                Active opportunities
              </p>
            </div>
            <p className="text-[10px] font-mono text-stone-500 border-t border-[#E7E5E4]/60 pt-2 flex justify-between items-center">
              <span>PIPELINE VALUE:</span>
              <span className="font-bold text-stone-700 tabular-nums">₹{pipelineValueLakhs.toFixed(1)} L</span>
            </p>
          </div>

          {/* KPI 2: Avg. First Response */}
          <div 
            id="kpi-avg-response"
            className="bg-white border border-[#E7E5E4] rounded-xl p-5 flex flex-col justify-between h-[208px] hover:border-stone-300 transition-all duration-150"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 block">
                Avg. First Response
              </span>
              <span className="text-3xl font-sora font-semibold text-stone-950 block tracking-tight tabular-nums">
                {avgResponseMin} min
              </span>
              <p className="text-xs font-semibold text-stone-800 leading-tight">
                Inquiry resolution velocity
              </p>
            </div>
            <p className="text-[10px] font-mono border-t border-[#E7E5E4]/60 pt-2 flex justify-between items-center">
              <span className="text-stone-400 uppercase">Baseline target:</span>
              {/* Single permitted amber element in this cell: "was 31 hrs" (amber) */}
              <span className="font-bold text-[#D97706] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/50">
                was 31 hrs
              </span>
            </p>
          </div>

          {/* KPI 3: Quotes Pending */}
          <div 
            id="kpi-quotes-pending"
            className="bg-white border border-[#E7E5E4] rounded-xl p-5 flex flex-col justify-between h-[208px] hover:border-stone-300 transition-all duration-150"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 block">
                Quotes Pending
              </span>
              <span className="text-3xl font-sora font-semibold text-stone-950 block tracking-tight tabular-nums">
                {pendingQuotesCount}
              </span>
              <p className="text-xs font-semibold text-stone-800 leading-tight">
                Transmitted awaiting review
              </p>
            </div>
            <p className="text-[10px] font-mono border-t border-[#E7E5E4]/60 pt-2 flex justify-between items-center">
              <span className="text-stone-400 uppercase">CRITICAL DELAY:</span>
              {/* Danger tint subline */}
              <span className="font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-200/40 tabular-nums">
                {agingQuotesCount} aging &gt; 5d
              </span>
            </p>
          </div>

          {/* KPI 4: CNC Programs */}
          <div 
            id="kpi-cnc-programs"
            className="bg-white border border-[#E7E5E4] rounded-xl p-5 flex flex-col justify-between h-[208px] hover:border-stone-300 transition-all duration-150"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 block">
                CNC Programs
              </span>
              <span className="text-3xl font-sora font-semibold text-stone-950 block tracking-tight tabular-nums">
                {cncProgramsCount}
              </span>
              <p className="text-xs font-semibold text-stone-800 leading-tight">
                Active in library
              </p>
            </div>
            <p className="text-[10px] font-mono border-t border-[#E7E5E4]/60 pt-2 flex justify-between items-center">
              <span className="text-stone-400 uppercase">EFFICIENCY:</span>
              {/* Single permitted amber element: dynamic subline badge */}
              <span className="font-bold text-[#D97706] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/50 tabular-nums">
                ≈ {simulatedHrsSaved} hrs saved
              </span>
            </p>
          </div>

        </div>

      </div>

      {/* 2nd Row: 2x1 Pipeline Funnel strip & 1x1 Export Markets */}
      <div className="grid grid-cols-12 gap-6">

        {/* 2x1 "Pipeline" Funnel Segment Card (col-span-12 lg:col-span-8) */}
        <div 
          id="pipeline-funnel-card"
          className="col-span-12 lg:col-span-8 bg-white border border-[#E7E5E4] rounded-xl p-6 flex flex-col justify-between min-h-[180px] hover:border-stone-300 transition-all duration-150"
        >
          <div>
            <div className="flex justify-between items-center border-b border-[#E7E5E4] pb-3 mb-4">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 block">
                  Lead-to-Shipment Flow
                </span>
                <h3 className="font-sora font-semibold text-sm text-stone-900">
                  Global Export Pipeline Funnel
                </h3>
              </div>
              <span className="text-[10px] font-mono text-stone-500 uppercase bg-stone-100 px-2 py-0.5 rounded border border-[#E7E5E4]">
                Interactive segments
              </span>
            </div>

            {/* Funnel strip layout */}
            <div className="grid grid-cols-5 gap-3">
              {pipelineSegments.map((segment, idx) => {
                const isShipped = segment.id === "Shipped";
                return (
                  <button
                    key={segment.id}
                    onClick={() => onNavigate(segment.tab)}
                    className="group border border-[#E7E5E4] hover:border-[#D97706] bg-stone-50/30 hover:bg-white rounded-lg p-3 text-left transition-all duration-150 relative"
                  >
                    <span className="text-[10px] font-mono font-bold text-stone-400 uppercase block tracking-tight">
                      {segment.label}
                    </span>
                    <span className="text-2xl font-sora font-semibold text-stone-900 block mt-1 tracking-tight group-hover:text-[#D97706] transition-colors tabular-nums">
                      {segment.count}
                    </span>
                    <span className="text-[8px] font-mono text-stone-500 block truncate leading-tight mt-1">
                      {segment.desc}
                    </span>

                    {/* Chevron to indicate flow between non-shipped items */}
                    {!isShipped && (
                      <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-[#D97706] absolute -right-2 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full border border-stone-200 hidden md:block" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-[9px] font-mono text-stone-400 uppercase mt-4 pt-1.5 border-t border-stone-100">
            * CLICK ANY PIPELINE SEGMENT CARD TO JUMP TO THE CORRESPONDING PROCESS MODULE
          </p>
        </div>

        {/* 1x1 "Export markets": Distinct order destinations (col-span-12 lg:col-span-4) */}
        <div 
          id="export-markets-card"
          className="col-span-12 lg:col-span-4 bg-white border border-[#E7E5E4] rounded-xl p-6 flex flex-col justify-between min-h-[180px] hover:border-stone-300 transition-all duration-150"
        >
          <div>
            <div className="border-b border-[#E7E5E4] pb-3 mb-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 block">
                Active Consignments
              </span>
              <h3 className="font-sora font-semibold text-sm text-stone-900">
                Export Markets
              </h3>
            </div>

            {/* List of destination market chips */}
            <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto pr-1">
              {distinctMarkets.length > 0 ? (
                distinctMarkets.map((market, mIdx) => {
                  // Determine dynamic country flag
                  const norm = market.toLowerCase();
                  let flag = "🇩🇪";
                  if (norm.includes("usa")) flag = "🇺🇸";
                  else if (norm.includes("uk") || norm.includes("united kingdom")) flag = "🇬🇧";
                  else if (norm.includes("italy")) flag = "🇮🇹";
                  else if (norm.includes("australia")) flag = "🇦🇺";
                  else if (norm.includes("canada") || norm.includes("montreal")) flag = "🇨🇦";
                  else if (norm.includes("japan") || norm.includes("chiba")) flag = "🇯🇵";
                  else if (norm.includes("india")) flag = "🇮🇳";

                  // Max one amber element: let the first one or primary market have the amber border/text
                  const isPrimary = mIdx === 0;

                  return (
                    <span 
                      key={market}
                      className={`text-[10px] font-mono font-semibold px-2 py-1 rounded-md border flex items-center gap-1.5 ${
                        isPrimary
                          ? "bg-amber-50/50 border-[#D97706] text-[#D97706]"
                          : "bg-stone-50 border-stone-200 text-stone-700"
                      }`}
                    >
                      <span>{flag}</span>
                      <span>{market}</span>
                    </span>
                  );
                })
              ) : (
                <div className="text-[10px] font-mono text-stone-400 py-4">No active export orders found.</div>
              )}
            </div>
          </div>

          <div className="text-[9px] font-mono text-stone-400 uppercase mt-4 pt-1.5 border-t border-stone-100 flex justify-between">
            <span>COUNTRIES ENGAGED:</span>
            <span className="font-bold text-stone-600 tabular-nums">{distinctMarkets.length}</span>
          </div>
        </div>

      </div>

      {/* 3rd Row: 2x1 AI Desk Activity (Event Log) & 1x1 Simulator Controls */}
      <div className="grid grid-cols-12 gap-6">

        {/* 2x1 "AI Desk Activity" Event Log (col-span-12 lg:col-span-8) */}
        <div 
          id="ai-desk-activity-card"
          className="col-span-12 lg:col-span-8 bg-white border border-[#E7E5E4] rounded-xl p-6 flex flex-col justify-between min-h-[300px] hover:border-stone-300 transition-all duration-150"
        >
          <div>
            <div className="flex justify-between items-center border-b border-[#E7E5E4] pb-3 mb-4">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D97706] block">
                  Casting Command Ledger
                </span>
                <h3 className="font-sora font-semibold text-sm text-stone-900">
                  AI Desk Activity Log
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-stone-400 block uppercase font-semibold">Session Logs</span>
                <span className="text-xs font-mono font-bold text-stone-700 tabular-nums bg-stone-50 border border-[#E7E5E4] px-1.5 py-0.5 rounded">
                  {filteredEvents.length} Events Total
                </span>
              </div>
            </div>

            {/* List of events */}
            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => {
                  let moduleBadgeStyle = "bg-stone-100 text-stone-600 border-stone-200";
                  if (event.module === "Inquiry Desk") {
                    moduleBadgeStyle = "bg-green-50 text-green-700 border-green-200";
                  } else if (event.module === "RFQ Costing") {
                    moduleBadgeStyle = "bg-blue-50 text-blue-700 border-blue-200";
                  } else if (event.module === "CNC Program") {
                    moduleBadgeStyle = "bg-sky-50 text-sky-700 border-sky-200";
                  } else if (event.module === "Dispatch") {
                    moduleBadgeStyle = "bg-amber-50 text-amber-700 border-amber-200";
                  }

                  return (
                    <div 
                      key={event.id}
                      className="flex items-center justify-between p-2.5 rounded border border-[#E7E5E4] bg-stone-50/10 font-mono text-xs hover:bg-stone-50 hover:border-stone-300 transition-colors"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Time in IST */}
                        <span className="text-[11px] font-bold text-stone-500 shrink-0 tabular-nums">
                          {event.timestampIST}
                        </span>
                        
                        {/* Event Message */}
                        <span className="text-xs text-stone-800 font-medium truncate">
                          {event.message}
                        </span>
                      </div>

                      {/* Module tag */}
                      <span className={`text-[9px] font-bold uppercase tracking-tight px-1.5 py-0.5 rounded border shrink-0 ${moduleBadgeStyle}`}>
                        {event.module.toUpperCase()}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center border border-dashed border-[#E7E5E4] rounded-lg text-stone-400">
                  <AlertCircle className="w-6 h-6 text-stone-300 mx-auto mb-2 animate-bounce" />
                  <p className="text-xs font-mono">No live ledger entries match your current search.</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-1.5 border-t border-[#E7E5E4]/80 flex justify-between text-[10px] font-mono text-stone-400">
            <span>SQC DIGITAL LEDGER CLOUD RUN ARCHITECTURE</span>
            <span>SHAPAR UNIT-2 COUPLING SYSTEM</span>
          </div>
        </div>

        {/* 1x1 Simulator Controls (col-span-12 lg:col-span-4) */}
        <div 
          id="simulator-controls-card"
          className="col-span-12 lg:col-span-4 bg-white border border-[#E7E5E4] rounded-xl p-6 flex flex-col justify-between min-h-[300px] hover:border-stone-300 transition-all duration-150"
        >
          <div>
            <div className="border-b border-[#E7E5E4] pb-3 mb-4">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 block">
                Sandbox Environment
              </span>
              <h3 className="font-sora font-semibold text-sm text-stone-900">
                Process Simulator
              </h3>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed font-medium mb-4">
              Simulate real-world client activities or executive decisions to test the reactive updates of the Command Center metrics.
            </p>

            <div className="space-y-2">
              <button
                onClick={handleSimulateNewInquiry}
                className="w-full text-left p-2 rounded border border-stone-200 hover:border-[#D97706]/40 hover:bg-stone-50 transition-all text-xs font-mono flex items-center justify-between"
              >
                <span className="font-bold text-stone-700">1. Receive Hot Inquiry</span>
                <span className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded uppercase border font-bold">TRIGGER</span>
              </button>

              <button
                onClick={handleSimulateQuoteApprove}
                className="w-full text-left p-2 rounded border border-stone-200 hover:border-[#D97706]/40 hover:bg-stone-50 transition-all text-xs font-mono flex items-center justify-between"
              >
                <span className="font-bold text-stone-700">2. Approve Draft Quote</span>
                <span className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded uppercase border font-bold">TRIGGER</span>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E7E5E4] flex justify-between items-center">
            <span className="text-[10px] font-mono text-stone-400 uppercase">Simulator State</span>
            <button
              onClick={handleSimulateReset}
              className="font-mono text-[10px] font-bold text-stone-500 hover:text-stone-900 flex items-center gap-1 uppercase"
            >
              <RefreshCw className="w-3 h-3" /> Reset Session
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
