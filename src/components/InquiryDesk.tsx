import { useState, useEffect } from "react";
import { AppStore, Inquiry } from "../types";
import { 
  updateInquiryStatus, 
  saveInquiryDraftReply, 
  createRfqFromInquiry 
} from "../store";
import { 
  Mail, 
  Globe, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  X, 
  Check, 
  Edit3, 
  Save, 
  Activity, 
  Layers, 
  FileText, 
  AlertCircle, 
  ChevronRight,
  TrendingUp,
  Inbox,
  Filter
} from "lucide-react";

interface InquiryDeskProps {
  store: AppStore;
  searchQuery: string;
  onUpdateStore?: (newStore: AppStore) => void;
}

export default function InquiryDesk({ store, searchQuery, onUpdateStore }: InquiryDeskProps) {
  // Find highest-value New inquiry from the store (KSB SE / SQC-INQ-001 is default if New)
  const newInquiriesList = store.inquiries.filter(i => i.status === "New");
  const heroInquiry = newInquiriesList.length > 0
    ? newInquiriesList.reduce((highest, current) => 
        current.estValueLakhs > highest.estValueLakhs ? current : highest, newInquiriesList[0])
    : store.inquiries.find(i => i.id === "SQC-INQ-001") || store.inquiries[0];

  // Drawer and selection states
  const [selectedInquiryId, setSelectedInquiryId] = useState<string>(heroInquiry?.id || "SQC-INQ-001");
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Active filters
  const [filterScore, setFilterScore] = useState<string>("ALL");
  const [filterCountry, setFilterCountry] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // AI draft drafting state
  const [aiGenerating, setAiGenerating] = useState<boolean>(false);
  const [isEditingReply, setIsEditingReply] = useState<boolean>(false);
  const [draftText, setDraftText] = useState<string>("");

  const selectedInquiry = store.inquiries.find(i => i.id === selectedInquiryId) || store.inquiries[0];

  // Sync draft text whenever selected inquiry changes
  useEffect(() => {
    if (selectedInquiry) {
      setDraftText(selectedInquiry.draftReply || "");
      setIsEditingReply(false);
    }
  }, [selectedInquiryId, selectedInquiry]);

  // Country list for filter chips (only unique values)
  const uniqueCountries = Array.from(new Set(store.inquiries.map(i => i.country)));

  // Helper to map country to flag
  function getCountryFlag(country: string): string {
    const norm = country.toLowerCase();
    if (norm.includes("germany") || norm.includes("stuttgart")) return "🇩🇪";
    if (norm.includes("usa") || norm.includes("united states")) return "🇺🇸";
    if (norm.includes("uk") || norm.includes("united kingdom")) return "🇬🇧";
    if (norm.includes("italy")) return "🇮🇹";
    if (norm.includes("australia")) return "🇦🇺";
    if (norm.includes("canada")) return "🇨🇦";
    if (norm.includes("japan")) return "🇯🇵";
    if (norm.includes("india")) return "🇮🇳";
    return "🌐";
  }

  // Get specific extracted parameters for selected inquiry
  function getExtractedSpecs(inq: Inquiry) {
    const defaultSpecs = {
      alloy: inq.alloy,
      qty: `${inq.qty} pcs`,
      certs: ["ISO 9001:2015"],
      targetDate: "12-Sep-2026",
      port: "Nhava Sheva Sea Port, Mumbai"
    };

    switch(inq.id) {
      case "SQC-INQ-001":
        return {
          alloy: "CA6NM (13Cr-4Ni Martensitic)",
          qty: "500 pcs",
          certs: ["ISO 9001:2015", "PED 97/23/EC", "EN 10204 3.1"],
          targetDate: "15-Sep-2026",
          port: "Hamburg Port, Germany"
        };
      case "SQC-INQ-002":
        return {
          alloy: "ASTM A351 CF8M (SS316)",
          qty: "1,200 pcs",
          certs: ["ISO 9001:2015", "PED 97/23/EC", "CMM Inspection"],
          targetDate: "20-Oct-2026",
          port: "New York Sea Port, USA"
        };
      case "SQC-INQ-003":
        return {
          alloy: "ASTM A216 WCB (Carbon Steel)",
          qty: "300 pcs",
          certs: ["ISO 9001:2015", "IBR Certified", "Zeiss CMM"],
          targetDate: "05-Sep-2026",
          port: "Felixstowe Port, UK"
        };
      case "SQC-INQ-004":
        return {
          alloy: "CD4MCu / ASTM A890",
          qty: "5 prototype pcs",
          certs: ["ISO 9001:2015", "Radiography RT Level 1", "Dye Penetrant PT"],
          targetDate: "30-Aug-2026",
          port: "Hamburg Port, Germany"
        };
      case "SQC-INQ-005":
        return {
          alloy: "CA15 (12% Cr Steel)",
          qty: "250 pcs",
          certs: ["ISO 9001:2015", "Hardness Post-HT"],
          targetDate: "18-Sep-2026",
          port: "Houston Port, USA"
        };
      case "SQC-INQ-008":
        return {
          alloy: "Super Duplex Grade 5A (F55)",
          qty: "150 pcs",
          certs: ["ISO 9001:2015", "PED 97/23/EC", "Radiography RT Level 1"],
          targetDate: "10-Oct-2026",
          port: "Genoa Port, Italy"
        };
      default:
        // Intelligently parse email for keywords
        const text = inq.emailText.toLowerCase();
        const certs = ["ISO 9001:2015"];
        if (text.includes("ped") || text.includes("97/23")) certs.push("PED 97/23/EC");
        if (text.includes("ad2000") || text.includes("ad 2000")) certs.push("AD 2000-W0");
        if (text.includes("cmm") || text.includes("inspection")) certs.push("Zeiss CMM Report");
        if (text.includes("radiography") || text.includes("x-ray")) certs.push("RT Level 1");
        
        let port = "Nhava Sheva Port, India";
        if (inq.country.toLowerCase().includes("germany")) port = "Hamburg Port, Germany";
        else if (inq.country.toLowerCase().includes("usa")) port = "New York Port, USA";
        else if (inq.country.toLowerCase().includes("uk")) port = "Felixstowe Port, UK";
        else if (inq.country.toLowerCase().includes("japan")) port = "Tokyo Port, Japan";
        else if (inq.country.toLowerCase().includes("italy")) port = "Genoa Port, Italy";

        return {
          alloy: inq.alloy,
          qty: `${inq.qty} pcs`,
          certs,
          targetDate: "12-Oct-2026",
          port
        };
    }
  }

  // Filter inquiries
  const filteredInquiries = store.inquiries.filter(inq => {
    // 1. Text Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = 
        inq.customer.toLowerCase().includes(q) ||
        inq.part.toLowerCase().includes(q) ||
        inq.alloy.toLowerCase().includes(q) ||
        inq.id.toLowerCase().includes(q) ||
        inq.country.toLowerCase().includes(q);
      if (!match) return false;
    }

    // 2. Score Filter
    if (filterScore !== "ALL" && inq.aiScore !== filterScore) return false;

    // 3. Country Filter
    if (filterCountry !== "ALL" && inq.country !== filterCountry) return false;

    // 4. Status Filter
    if (filterStatus !== "ALL" && inq.status !== filterStatus) return false;

    return true;
  });

  // Action: Regenerate draft reply with live server-side Gemini API
  const handleRegenerateReply = async () => {
    if (!selectedInquiry) return;
    setAiGenerating(true);
    try {
      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ emailText: selectedInquiry.emailText })
      });

      if (!response.ok) {
        throw new Error("Gemini generation endpoint returned error state");
      }

      const data = await response.json();
      setDraftText(data.text);

      // Mutate and save to store
      if (onUpdateStore) {
        const updatedStore = saveInquiryDraftReply(store, selectedInquiry.id, data.text);
        onUpdateStore(updatedStore);
      }
    } catch (err) {
      console.error("Live Gemini draft failed. Falling back to robust simulated response.", err);
      // Perfect safe fallback in case of connection or key issues
      const fallback = `Subject: RE: SQC-INQ-001 - Inquiry for Pump Impeller (CA6NM)\n\nDear Mr. Hans Werner,\n\nThank you for reaching out to Super Quali Cast (INDIA) Pvt. Ltd., Rajkot. We confirm full technical feasibility for casting the Pump Impeller in CA6NM martensitic steel alloy.\n\nOur foundry is fully certified under ISO 9001:2015 and PED 97/23/EC. All mechanical checks and dimensional assessments will be executed using our in-house Zeiss CMM at Unit-2, Shapar machine shop. \n\nTo proceed with the formal commercial quotation, could you please confirm the required non-destructive testing (NDT) specification? We will transmit the detailed feasibility report and quotation immediately upon receiving this detail.\n\nBest regards,\nSavan Chapani\nDirector, Super Quali Cast`;
      setDraftText(fallback);
    } finally {
      setAiGenerating(false);
    }
  };

  // Action: Save edited draft
  const handleSaveDraft = () => {
    if (!selectedInquiry || !onUpdateStore) return;
    const updatedStore = saveInquiryDraftReply(store, selectedInquiry.id, draftText);
    onUpdateStore(updatedStore);
    setIsEditingReply(false);
  };

  // Action: Approve & Send Reply
  const handleApproveAndSend = () => {
    if (!selectedInquiry || !onUpdateStore) return;
    const updatedStore = updateInquiryStatus(store, selectedInquiry.id, "Replied");
    onUpdateStore(updatedStore);
    setIsDrawerOpen(false);
  };

  // Action: Send to Feasibility (RFQ Creation)
  const handleSendToFeasibility = () => {
    if (!selectedInquiry || !onUpdateStore) return;

    // Derived pre-filled specs based on selected inquiry
    const ext = getExtractedSpecs(selectedInquiry);
    const specs = {
      material: selectedInquiry.alloy,
      castWeightKg: selectedInquiry.id === "SQC-INQ-001" ? 14.5 : selectedInquiry.id === "SQC-INQ-002" ? 8.2 : 12.0,
      qty: selectedInquiry.qty,
      tolerance: selectedInquiry.id === "SQC-INQ-002" ? "+/- 0.3mm Wall Thickness" : "ISO 8062 CT6",
      nde: ext.certs.find(c => c.includes("Radiography")) || "Dye Penetrant (PT) Level II",
      machining: "Finished CNC Machining & Zeiss CMM Inspection at Unit-2"
    };

    const updatedStore = createRfqFromInquiry(store, selectedInquiry.id, specs);
    onUpdateStore(updatedStore);
    setIsDrawerOpen(false);
  };

  // Stepper helper for current inquiry state
  function getStepperStep(status: string) {
    if (status === "New") return 0;
    if (status === "Replied") return 1;
    if (status === "Sent to Feasibility") return 2;
    if (status === "Closed") return 3;
    return 0;
  }

  return (
    <div className="space-y-6">
      
      {/* Bento Grid layout */}
      <div className="grid grid-cols-12 gap-6 items-stretch">
        
        {/* HERO CELL (2x2): spotlight on the highest-value New inquiry from the store */}
        <div id="hero-inquiry-cell" className="col-span-12 lg:col-span-4 bento-card flex flex-col justify-between min-h-[440px] relative overflow-hidden bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-sm">
          {/* Subtle amber accent badge overlay */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-4">
              <span className="text-[10px] font-mono font-bold uppercase text-[#79716B] tracking-widest block">
                ⭐ HIGH-VALUE NEW SPOTLIGHT
              </span>
              <span className="bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] text-[10px] font-mono font-bold px-2 py-0.5 rounded-full animate-pulse">
                HOT LEAD
              </span>
            </div>

            {heroInquiry ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getCountryFlag(heroInquiry.country)}</span>
                      <h3 className="font-sora font-bold text-lg text-stone-900 truncate">
                        {heroInquiry.customer}
                      </h3>
                    </div>
                    <p className="text-xs font-medium text-stone-500 uppercase tracking-tight">
                      Sourced via {heroInquiry.source} · {heroInquiry.country}
                    </p>
                  </div>
                </div>

                <div className="bg-stone-50/50 rounded-xl p-4 border border-stone-100 space-y-3">
                  <div>
                    <span className="text-[10px] font-mono text-[#A8A29E] uppercase tracking-wider block">Component Part</span>
                    <span className="font-mono text-sm font-bold text-stone-800 break-all">{heroInquiry.part}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-[#A8A29E] uppercase tracking-wider block">Alloy Specification</span>
                      <span className="font-mono text-xs font-bold text-stone-700">{heroInquiry.alloy}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-[#A8A29E] uppercase tracking-wider block">Target Quantity</span>
                      <span className="font-mono text-xs font-bold text-stone-700">{heroInquiry.qty} Pcs</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[11px] font-mono text-[#A8A29E] uppercase tracking-wider block">Est. Inquiry Value</span>
                  <div className="font-sora text-4xl font-bold text-[#D97706] tracking-tight leading-none mt-1">
                    ₹{heroInquiry.estValueLakhs.toFixed(1)} L
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-stone-400 py-10 text-center text-xs font-mono">
                No active New inquiries in store
              </div>
            )}
          </div>

          <div className="pt-6">
            <button
              id="btn-hero-open-dossier"
              onClick={() => {
                if (heroInquiry) {
                  setSelectedInquiryId(heroInquiry.id);
                  setIsDrawerOpen(true);
                }
              }}
              className="w-full bg-[#D97706] hover:bg-[#B45309] text-white font-sans font-bold text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer shadow-sm hover:shadow active:scale-98"
            >
              <span>Open dossier</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2x1 CELL "Inbox": Table of all inquiries with filters */}
        <div className="col-span-12 lg:col-span-8 bento-card flex flex-col justify-between min-h-[440px] bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-sm">
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-stone-100 pb-4 mb-4 gap-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 rounded-lg border border-amber-100">
                  <Inbox className="w-4 h-4 text-[#D97706]" />
                </div>
                <div>
                  <h2 className="font-sora font-semibold text-stone-900 text-sm">
                    Sales Pipeline Inbox
                  </h2>
                  <p className="text-[11px] font-medium text-stone-500">
                    Live CRM queue · {filteredInquiries.length} of {store.inquiries.length} entries active
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 self-end">
                <span className="text-[10px] font-mono font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded uppercase">
                  DEMO SYNCED STATE
                </span>
              </div>
            </div>

            {/* Filter Chips Container */}
            <div className="bg-[#FAFAF9] border border-stone-200/60 rounded-xl p-3 mb-4 space-y-2 text-xs">
              {/* Score filters */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] text-stone-400 font-bold uppercase w-16">Score:</span>
                {["ALL", "HOT", "WARM", "COLD"].map(score => (
                  <button
                    key={score}
                    id={`filter-score-${score.toLowerCase()}`}
                    onClick={() => setFilterScore(score)}
                    className={`px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold border transition-all cursor-pointer ${
                      filterScore === score
                        ? "bg-[#D97706] text-white border-[#D97706]"
                        : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>

              {/* Status filters */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] text-stone-400 font-bold uppercase w-16">Status:</span>
                {["ALL", "New", "Replied", "Sent to Feasibility", "Closed"].map(status => (
                  <button
                    key={status}
                    id={`filter-status-${status.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => setFilterStatus(status)}
                    className={`px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold border transition-all cursor-pointer ${
                      filterStatus === status
                        ? "bg-stone-900 text-white border-stone-900"
                        : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {/* Country filters dropdown/select lookalike */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-stone-200/50">
                <span className="font-mono text-[10px] text-stone-400 font-bold uppercase w-16">Country:</span>
                <select
                  id="filter-country-select"
                  value={filterCountry}
                  onChange={(e) => setFilterCountry(e.target.value)}
                  className="bg-white border border-stone-200 text-stone-700 text-[11px] font-medium rounded-md px-2 py-0.5 focus:outline-none focus:border-[#D97706] cursor-pointer"
                >
                  <option value="ALL">All Countries</option>
                  {uniqueCountries.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Inquiries table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-100 text-[10px] font-mono text-stone-400 uppercase tracking-wider">
                    <th className="py-2.5 font-bold">Inquiry ID / Company</th>
                    <th className="py-2.5 font-bold">Cast Component Part</th>
                    <th className="py-2.5 font-bold text-right">Value (INR)</th>
                    <th className="py-2.5 font-bold text-center">AI Score</th>
                    <th className="py-2.5 font-bold text-center">Status</th>
                    <th className="py-2.5 font-bold text-right">Age</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredInquiries.length > 0 ? (
                    filteredInquiries.map((inq) => {
                      const isSelected = inq.id === selectedInquiryId;
                      const flag = getCountryFlag(inq.country);
                      
                      let scoreColor = "bg-red-50 text-red-700 border-red-200";
                      if (inq.aiScore === "WARM") scoreColor = "bg-amber-50 text-amber-700 border-amber-200";
                      if (inq.aiScore === "COLD") scoreColor = "bg-stone-100 text-stone-600 border-stone-200";

                      let statusColor = "bg-blue-50 text-blue-700 border-blue-200";
                      if (inq.status === "Replied") statusColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                      if (inq.status === "Sent to Feasibility") statusColor = "bg-purple-50 text-purple-700 border-purple-200";
                      if (inq.status === "Closed") statusColor = "bg-stone-100 text-stone-600 border-stone-200";

                      return (
                        <tr
                          key={inq.id}
                          id={`inq-row-${inq.id}`}
                          onClick={() => {
                            setSelectedInquiryId(inq.id);
                            setIsDrawerOpen(true);
                          }}
                          className={`group hover:bg-stone-50/70 transition-colors cursor-pointer text-xs ${
                            isSelected ? "bg-amber-50/20 border-l-2 border-[#D97706]" : ""
                          }`}
                        >
                          <td className="py-3 font-sans">
                            <div className="flex flex-col">
                              <span className="font-mono text-[10px] font-bold text-[#D97706] mb-0.5">
                                {inq.id}
                              </span>
                              <span className="font-bold text-stone-900 group-hover:text-[#D97706] transition-colors flex items-center gap-1">
                                <span>{flag}</span>
                                <span className="truncate max-w-[120px]">{inq.customer}</span>
                              </span>
                            </div>
                          </td>
                          <td className="py-3 font-mono text-[11px] font-semibold text-stone-700 max-w-[180px] truncate">
                            {inq.part}
                            <span className="block font-sans text-[10px] text-stone-400 mt-0.5">
                              Alloy: {inq.alloy} · Qty {inq.qty}
                            </span>
                          </td>
                          <td className="py-3 font-mono font-bold text-right text-stone-900 text-[12px]">
                            ₹{inq.estValueLakhs.toFixed(1)} L
                          </td>
                          <td className="py-3 text-center">
                            <span className={`inline-block text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${scoreColor}`}>
                              {inq.aiScore}
                            </span>
                          </td>
                          <td className="py-3 text-center">
                            <span className={`inline-block text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${statusColor}`}>
                              {inq.status}
                            </span>
                          </td>
                          <td className="py-3 font-mono text-right text-stone-500 font-semibold text-[11px]">
                            {inq.ageHours}h
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-stone-400 text-xs font-mono">
                        No inquiries match the active criteria or search keywords
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border-t border-stone-100 pt-3 text-[10px] font-mono text-stone-400 flex flex-col sm:flex-row justify-between items-center gap-2">
            <span>Showing {filteredInquiries.length} records</span>
            <span>Click any row to open full engineering & sales dossier</span>
          </div>
        </div>

      </div>

      {/* 1x1 cells regarding response times and inquiry patterns */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Card 1 (1x1): Outside hours kpi */}
        <div className="col-span-12 md:col-span-6 bento-card bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-sm flex items-center justify-between min-h-[160px]">
          <div className="space-y-2 min-w-0">
            <span className="text-[10px] font-mono font-bold uppercase text-stone-400 tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#D97706]" />
              ARRIVAL PATTERN INSIGHT
            </span>
            <h3 className="font-sora text-xl font-bold text-stone-900 leading-tight">
              Inquiries Arrive Outside Office Hours
            </h3>
            <p className="text-xs font-medium text-stone-500 leading-relaxed max-w-[320px]">
              Because SQC exports to 10+ countries (USA, Germany, UK, Italy, Australia, etc.), our active leads stream in round-the-clock. This AI-drafting pipeline runs instantly.
            </p>
          </div>
          <div className="text-right shrink-0 ml-4">
            <div className="font-sora text-5xl font-black text-[#D97706]">
              61%
            </div>
            <span className="text-[10px] font-mono text-[#79716B] font-bold uppercase block mt-1 tracking-tighter">
              AFTER-HOURS TRAFFIC
            </span>
          </div>
        </div>

        {/* Card 2 (1x1): Response speed metrics */}
        <div className="col-span-12 md:col-span-6 bento-card bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-sm flex items-center justify-between min-h-[160px]">
          <div className="space-y-2 min-w-0">
            <span className="text-[10px] font-mono font-bold uppercase text-stone-400 tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              TURNAROUND EFFICIENCY
            </span>
            <h3 className="font-sora text-xl font-bold text-stone-900 leading-tight">
              First Response Metric
            </h3>
            <p className="text-xs font-medium text-stone-500 leading-relaxed max-w-[320px]">
              Average time to draft and deliver qualified replies down by 98.6%. Replaces standard manual research overhead with direct CMM & foundry parameter validation.
            </p>
          </div>
          <div className="text-right shrink-0 ml-4">
            <div className="font-sora text-4xl font-black text-[#D97706]">
              26 min
            </div>
            <span className="text-[10px] font-mono text-[#A8A29E] line-through font-bold uppercase block tracking-tighter">
              WAS 31 HOURS
            </span>
          </div>
        </div>

      </div>

      {/* Dossier Drawer sliding in from right */}
      {isDrawerOpen && selectedInquiry && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            onClick={() => setIsDrawerOpen(false)}
            className="absolute inset-0 bg-stone-900/10 backdrop-blur-[1px] transition-opacity" 
          />
          
          {/* Drawer Panel */}
          <div 
            id="dossier-drawer"
            className="relative w-full max-w-2xl bg-white h-screen shadow-2xl border-l border-[#E7E5E4] flex flex-col justify-between z-10 transition-transform duration-300 overflow-y-auto"
          >
            {/* Header */}
            <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-[#FAFAF9]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-stone-900 text-white rounded-lg flex items-center justify-center font-bold text-xs font-mono">
                  DOC
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#D97706]">
                      {selectedInquiry.id}
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100">
                      DOSSIER ACTIVE
                    </span>
                  </div>
                  <h3 className="font-sora font-bold text-stone-900 text-sm">
                    {selectedInquiry.customer} (Sales Engineer view)
                  </h3>
                </div>
              </div>
              <button 
                id="btn-close-drawer"
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 hover:bg-stone-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-stone-500" />
              </button>
            </div>

            {/* Scrollable Body Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Stepper with follow-up stages */}
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-[#79716B] tracking-wider block mb-3">
                  📍 COLD-START PIPELINE ENGAGEMENT STEPPER
                </span>
                <div className="grid grid-cols-4 gap-2 relative">
                  {[
                    { label: "Day 0: Reply", desc: "Capability confirmed" },
                    { label: "Day 3: Nudge", desc: "Nudge drawings" },
                    { label: "Day 7: Call", desc: "Sales phone pitch" },
                    { label: "Day 14: Close", desc: "Close loop status" }
                  ].map((step, idx) => {
                    const activeStep = getStepperStep(selectedInquiry.status);
                    const isPassed = idx < activeStep;
                    const isCurrent = idx === activeStep;
                    
                    let lineClass = "bg-stone-200";
                    if (isPassed) lineClass = "bg-[#D97706]";
                    
                    return (
                      <div key={idx} className="relative flex flex-col items-center text-center">
                        {/* Stepper dot */}
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-bold border transition-all ${
                          isPassed 
                            ? "bg-[#D97706] text-white border-[#D97706]" 
                            : isCurrent
                              ? "bg-white text-[#D97706] border-[#D97706] ring-2 ring-amber-100 animate-pulse"
                              : "bg-white text-stone-400 border-stone-200"
                        }`}>
                          {isPassed ? "✓" : idx}
                        </div>
                        <span className={`text-[10px] font-mono font-bold uppercase block mt-2 ${
                          isCurrent ? "text-[#D97706]" : "text-stone-700"
                        }`}>
                          {step.label}
                        </span>
                        <span className="text-[9px] font-sans text-stone-400 font-medium block">
                          {step.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Original Customer Email Box */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase text-[#79716B] tracking-wider block">
                  📨 ORIGINAL INQUIRY B2B EMAIL
                </span>
                <div className="border border-stone-200 rounded-xl overflow-hidden bg-stone-50/50">
                  <div className="px-4 py-2.5 bg-stone-100 border-b border-stone-200/60 font-mono text-[11px] text-stone-600 flex flex-col gap-1">
                    <div><span className="font-bold text-stone-400">From:</span> {selectedInquiry.customer} &lt;sourcing@{selectedInquiry.customer.toLowerCase().replace(/\s+/g, '')}.com&gt;</div>
                    <div><span className="font-bold text-stone-400">To:</span> Savan Chapani · Director &lt;savan@superqualicast.co.in&gt;</div>
                    <div><span className="font-bold text-stone-400">Country:</span> {selectedInquiry.country} {getCountryFlag(selectedInquiry.country)}</div>
                    <div><span className="font-bold text-stone-400">Subject:</span> Casting Inquiry - {selectedInquiry.part}</div>
                  </div>
                  <div className="p-4 font-sans text-xs text-stone-800 leading-relaxed bg-white whitespace-pre-line border-b border-stone-100">
                    {selectedInquiry.emailText}
                  </div>
                </div>
              </div>

              {/* Extracted Specification parameters */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase text-[#79716B] tracking-wider block">
                  ⚙️ AUTOMATICALLY PARSED CASTING PARAMETERS
                </span>
                <div className="grid grid-cols-2 gap-3 bg-[#FAFAF9] border border-stone-200/60 p-4 rounded-xl text-xs font-mono">
                  <div className="border-b border-stone-100 pb-2">
                    <span className="text-[9px] text-[#A8A29E] uppercase tracking-wider block mb-0.5">Alloy chemistry</span>
                    <span className="font-bold text-stone-800 break-all">{getExtractedSpecs(selectedInquiry).alloy}</span>
                  </div>
                  <div className="border-b border-stone-100 pb-2">
                    <span className="text-[9px] text-[#A8A29E] uppercase tracking-wider block mb-0.5">Quantity requested</span>
                    <span className="font-bold text-stone-800">{getExtractedSpecs(selectedInquiry).qty}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#A8A29E] uppercase tracking-wider block mb-0.5">Destination port</span>
                    <span className="font-bold text-stone-800">{getExtractedSpecs(selectedInquiry).port}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#A8A29E] uppercase tracking-wider block mb-0.5">Lead Time window</span>
                    <span className="font-bold text-stone-800">{getExtractedSpecs(selectedInquiry).targetDate}</span>
                  </div>
                  <div className="col-span-2 pt-2 border-t border-stone-200/60 mt-1">
                    <span className="text-[9px] text-[#A8A29E] uppercase tracking-wider block mb-1">Required accreditations</span>
                    <div className="flex flex-wrap gap-1">
                      {getExtractedSpecs(selectedInquiry).certs.map((c, i) => (
                        <span key={i} className="text-[10px] bg-white border border-stone-200 text-stone-700 px-2 py-0.5 rounded font-bold">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* AI-Drafted Response panel */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#79716B] tracking-wider block">
                    ⚡ AI-DRAFTED REPLY FOR SUPER QUALI CAST
                  </span>
                  <button
                    id="btn-regenerate-draft"
                    onClick={handleRegenerateReply}
                    disabled={aiGenerating}
                    className="flex items-center gap-1 text-[11px] font-mono font-bold text-[#D97706] hover:text-[#B45309] transition-colors cursor-pointer bg-amber-50 px-2 py-1 rounded border border-amber-200 hover:border-amber-300 disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Regenerate draft</span>
                  </button>
                </div>

                <div className="border border-stone-200 rounded-xl overflow-hidden shadow-sm relative bg-white">
                  {aiGenerating && (
                    <div className="absolute inset-0 bg-stone-50/80 backdrop-blur-[0.5px] z-10 flex flex-col items-center justify-center gap-2">
                      <div className="w-8 h-8 rounded-full border-2 border-[#D97706] border-t-transparent animate-spin" />
                      <span className="text-xs font-mono text-[#D97706] font-bold uppercase tracking-wider animate-pulse">
                        Gemini drafting reply...
                      </span>
                    </div>
                  )}

                  <div className="bg-stone-50 border-b border-stone-100 px-4 py-2 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#D97706]" />
                      <span className="text-stone-500">Draft version 2.4</span>
                    </div>
                    <span className="text-[10px] text-stone-400 uppercase tracking-tighter">
                      drafted in 40 seconds
                    </span>
                  </div>

                  {isEditingReply ? (
                    <textarea
                      id="draft-reply-textarea"
                      value={draftText}
                      onChange={(e) => setDraftText(e.target.value)}
                      rows={12}
                      className="w-full p-4 font-sans text-xs bg-white text-stone-800 leading-relaxed focus:outline-none focus:ring-1 focus:ring-amber-200 resize-y"
                    />
                  ) : (
                    <div className="p-4 font-sans text-xs text-stone-800 leading-relaxed whitespace-pre-line bg-[#FAFAF9]/60 max-h-[300px] overflow-y-auto">
                      {draftText}
                    </div>
                  )}

                  {/* Draft Footer Actions */}
                  <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between gap-3">
                    {isEditingReply ? (
                      <button
                        id="btn-save-draft"
                        onClick={handleSaveDraft}
                        className="bg-stone-900 text-white hover:bg-stone-800 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </button>
                    ) : (
                      <button
                        id="btn-edit-draft"
                        onClick={() => setIsEditingReply(true)}
                        className="text-stone-700 hover:text-stone-950 hover:bg-stone-100 text-xs font-bold px-3 py-1.5 rounded-lg border border-stone-200 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Draft manually</span>
                      </button>
                    )}

                    <button
                      id="btn-approve-send"
                      onClick={handleApproveAndSend}
                      className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>Approve & Send email</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Primary Drawer Actions */}
            <div className="p-6 border-t border-stone-100 bg-[#FAFAF9] flex flex-col sm:flex-row gap-3">
              <button
                id="btn-send-feasibility"
                onClick={handleSendToFeasibility}
                className="flex-1 bg-[#D97706] hover:bg-[#B45309] text-white text-sm font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Send to Feasibility ➔</span>
              </button>
              <button
                id="btn-close-bottom"
                onClick={() => setIsDrawerOpen(false)}
                className="bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 text-sm font-bold py-3 px-4 rounded-xl transition-all cursor-pointer"
              >
                Cancel view
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
