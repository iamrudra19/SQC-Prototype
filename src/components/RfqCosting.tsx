import { useState, useEffect, useRef } from "react";
import { AppStore, RFQ } from "../types";
import { 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ChevronRight, 
  ChevronDown, 
  Send, 
  RefreshCw, 
  Paperclip, 
  ArrowRight,
  Clock,
  Activity,
  FileCheck
} from "lucide-react";
import { addEvent } from "../store";

interface RfqCostingProps {
  store: AppStore;
  searchQuery: string;
  onUpdateStore?: (newStore: AppStore) => void;
}

interface SpecField {
  label: string;
  sectionId: number;
  critical?: boolean;
}

const SPEC_FIELDS: SpecField[] = [
  // 1. PART & APPLICATION
  { label: "Part name / drawing rev", sectionId: 1, critical: true },
  { label: "End-use / industry", sectionId: 1, critical: true },
  { label: "Service conditions", sectionId: 1, critical: true },
  
  // 2. MATERIAL
  { label: "Alloy grade", sectionId: 2, critical: true },
  { label: "Heat treatment", sectionId: 2, critical: true },
  { label: "Hardness spec", sectionId: 2 },
  { label: "Chemistry restrictions", sectionId: 2 },

  // 3. GEOMETRY
  { label: "Cast weight (kg)", sectionId: 3, critical: true },
  { label: "Overall envelope", sectionId: 3 },
  { label: "Critical wall thickness", sectionId: 3 },
  { label: "Feature list", sectionId: 3 },

  // 4. QUANTITY & FREQUENCY
  { label: "First-order quantity", sectionId: 4, critical: true },
  { label: "One-off / pilot / repeat", sectionId: 4, critical: true },
  { label: "Estimated annual usage (EAU)", sectionId: 4 },
  { label: "Delivery schedule", sectionId: 4 },

  // 5. TOLERANCES & DATUMS
  { label: "Overall tolerance grade", sectionId: 5, critical: true },
  { label: "Machined feature tolerances", sectionId: 5 },
  { label: "GD&T datums", sectionId: 5 },
  { label: "Face flatness / concentricity requirements", sectionId: 5 },

  // 6. SURFACE & NDE
  { label: "Surface finish as-cast", sectionId: 6 },
  { label: "Surface finish machined", sectionId: 6 },
  { label: "NDE required", sectionId: 6, critical: true },
  { label: "Acceptance standard", sectionId: 6 },

  // 7. CERTIFICATION & DOCUMENTATION
  { label: "Material cert level", sectionId: 7, critical: true },
  { label: "Positive Material Identification (PMI) required?", sectionId: 7 },
  { label: "Applicable certifications", sectionId: 7, critical: true },
  { label: "Test reports required", sectionId: 7 },

  // 8. MACHINING (Unit-2 Shapar)
  { label: "Machining required?", sectionId: 8, critical: true },
  { label: "Features to be machined", sectionId: 8 },
  { label: "Machined tolerances", sectionId: 8 },
  { label: "CMM inspection required?", sectionId: 8 },

  // 9. PACKING & LOGISTICS
  { label: "Packing", sectionId: 9 },
  { label: "Incoterm", sectionId: 9, critical: true },
  { label: "Destination port / city", sectionId: 9, critical: true },
  { label: "Marking", sectionId: 9 },

  // 10. COMMERCIAL
  { label: "Target price range", sectionId: 10 },
  { label: "Currency", sectionId: 10 },
  { label: "Payment terms", sectionId: 10 },
  { label: "Quote validity requested", sectionId: 10, critical: true },
  { label: "RFQ deadline", sectionId: 10 },

  // 11. ATTACHMENTS
  { label: "2D drawing", sectionId: 11, critical: true },
  { label: "3D model", sectionId: 11 },
  { label: "Reference sample photo", sectionId: 11 },
  { label: "Approved supplier questionnaire", sectionId: 11 }
];

const SECTION_NAMES: Record<number, string> = {
  1: "1. PART & APPLICATION",
  2: "2. MATERIAL",
  3: "3. GEOMETRY",
  4: "4. QUANTITY & FREQUENCY",
  5: "5. TOLERANCES & DATUMS",
  6: "6. SURFACE & NDE",
  7: "7. CERTIFICATION & DOCUMENTATION",
  8: "8. MACHINING (Unit-2 Shapar)",
  9: "9. PACKING & LOGISTICS",
  10: "10. COMMERCIAL",
  11: "11. ATTACHMENTS"
};

interface ChatMessage {
  id: string;
  sender: "CUSTOMER" | "SQC";
  senderName?: string;
  text: string;
  turn: number;
  timestamp: string;
  isSimulated?: boolean;
  isEdited?: boolean;
  clarifyingQuestion?: string | null;
}

interface RfqIntakeState {
  thread: ChatMessage[];
  specSheet: Record<string, { value: string; sourceTurn: number; confidence?: "high" | "medium" | "low" }>;
  composerText: string;
  turnCount: number;
  status: string;
  justUpdatedFields: Set<string>;
}

export default function RfqCosting({ store, searchQuery, onUpdateStore }: RfqCostingProps) {
  // Selection of active RFQ in queue
  const [activeRfqId, setActiveRfqId] = useState<string>("SQC-RFQ-2026-001");
  const activeRfq = store.rfqs.find(r => r.id === activeRfqId) || store.rfqs[0];

  // Conversation & Spec sheet states index by RFQ ID
  const [intakeStates, setIntakeStates] = useState<Record<string, RfqIntakeState>>({});
  
  // Transient interaction states
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isWaitingForCustomer, setIsWaitingForCustomer] = useState<boolean>(false);
  const [expandedSection, setExpandedSection] = useState<number | null>(1);
  const [showDrawer, setShowDrawer] = useState<boolean>(false);

  // Scroll ref for chat threads
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Helper to initialize state for an RFQ
  const getInitialStateForRfq = (rfqId: string): RfqIntakeState => {
    return {
      thread: [],
      specSheet: {},
      composerText: "",
      turnCount: 0,
      status: "Pending",
      justUpdatedFields: new Set()
    };
  };

  // Get current state for selected active RFQ
  const currentState = activeRfq ? (intakeStates[activeRfq.id] || getInitialStateForRfq(activeRfq.id)) : getInitialStateForRfq("SQC-RFQ-2026-001");

  // Keep internal dictionary state synced
  const updateCurrentState = (updated: Partial<RfqIntakeState>) => {
    if (!activeRfq) return;
    setIntakeStates(prev => ({
      ...prev,
      [activeRfq.id]: {
        ...(prev[activeRfq.id] || getInitialStateForRfq(activeRfq.id)),
        ...updated
      }
    }));
  };

  // Scroll chat to bottom on thread changes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentState.thread.length, isGenerating, isWaitingForCustomer]);

  // Compute completeness statistics
  const totalCriticalCount = SPEC_FIELDS.filter(f => f.critical).length; // 17
  const filledCriticalCount = SPEC_FIELDS.filter(f => f.critical && currentState.specSheet[f.label]?.value && currentState.specSheet[f.label]?.confidence !== "low").length;
  const completenessPct = Math.round((filledCriticalCount / totalCriticalCount) * 100);

  // Reset conversation handler
  const handleResetConversation = () => {
    if (!activeRfq) return;
    if (window.confirm("Are you sure you want to clear this thread and reset the spec sheet for this RFQ?")) {
      setIntakeStates(prev => ({
        ...prev,
        [activeRfq.id]: getInitialStateForRfq(activeRfq.id)
      }));
    }
  };

  // Click a field row to verify/confirm low-confidence data
  const handleConfirmConfidence = (fieldLabel: string) => {
    const currentCell = currentState.specSheet[fieldLabel];
    if (!currentCell) return;
    
    const updatedSpec = {
      ...currentState.specSheet,
      [fieldLabel]: {
        ...currentCell,
        confidence: "high" as const
      }
    };
    
    updateCurrentState({
      specSheet: updatedSpec
    });
    
    // Flash updated highlight
    const nextUpdated = new Set<string>(currentState.justUpdatedFields);
    nextUpdated.add(fieldLabel);
    updateCurrentState({
      specSheet: updatedSpec,
      justUpdatedFields: nextUpdated
    });
    
    setTimeout(() => {
      setIntakeStates(prev => {
        const s = prev[activeRfq.id];
        if (!s) return prev;
        const cleanUpdated = new Set<string>(s.justUpdatedFields);
        cleanUpdated.delete(fieldLabel);
        return {
          ...prev,
          [activeRfq.id]: {
            ...s,
            justUpdatedFields: cleanUpdated
          }
        };
      });
    }, 1000);
  };

  // Trigger live Gemini call
  const triggerGeminiCall = async (rfqId: string, currentThread: ChatMessage[], turnNum: number) => {
    setIsGenerating(true);
    
    // Create temporary placeholder message for SQC RFQ Assistant with empty text (represents 3-dot pulse)
    const placeholderMsgId = `placeholder-${Date.now()}`;
    const placeholderMsg: ChatMessage = {
      id: placeholderMsgId,
      sender: "SQC",
      text: "",
      turn: turnNum,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    // Append placeholder
    setIntakeStates(prev => {
      const s = prev[rfqId] || getInitialStateForRfq(rfqId);
      return {
        ...prev,
        [rfqId]: {
          ...s,
          thread: [...s.thread, placeholderMsg]
        }
      };
    });

    try {
      // Fetch and force a minimum 800ms shimmer/pulse delay
      const [response] = await Promise.all([
        fetch("/api/gemini/intake", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            thread: currentThread,
            currentSpecSheet: currentState.specSheet,
            persona: "Walk-in prospect",
            turnCount: turnNum
          })
        }),
        new Promise(resolve => setTimeout(resolve, 800))
      ]);
      
      const data = await response.json();
      
      if (data && !data.error) {
        const replyText = data.reply || "";
        const newlyExtracted = data.extracted || {};
        const clarifyingQuestion = data.clarifyingQuestion || null;
        
        const mergedSpecs = { ...currentState.specSheet };
        const newlyUpdated = new Set<string>();
        
        for (const [key, val] of Object.entries(newlyExtracted)) {
          if (val && typeof val === "object" && "value" in val) {
            mergedSpecs[key] = {
              value: (val as any).value,
              sourceTurn: typeof (val as any).sourceTurn === "number" ? (val as any).sourceTurn : turnNum,
              confidence: (val as any).confidence || "high"
            };
            newlyUpdated.add(key);
          }
        }
        
        // Auto-expand first updated section
        const firstUpdatedField = SPEC_FIELDS.find(f => newlyUpdated.has(f.label));
        if (firstUpdatedField) {
          setExpandedSection(firstUpdatedField.sectionId);
        }

        // Start character typewriter stream
        simulateTypeIn(rfqId, replyText, placeholderMsgId, clarifyingQuestion);

        setIntakeStates(prev => {
          const s = prev[rfqId] || getInitialStateForRfq(rfqId);
          return {
            ...prev,
            [rfqId]: {
              ...s,
              specSheet: mergedSpecs,
              justUpdatedFields: newlyUpdated
            }
          };
        });

        setTimeout(() => {
          setIntakeStates(prev => {
            const s = prev[rfqId];
            if (!s) return prev;
            return {
              ...prev,
              [rfqId]: {
                ...s,
                justUpdatedFields: new Set()
              }
            };
          });
        }, 2500);
      } else {
        updatePlaceholderText(rfqId, placeholderMsgId, `Technical response issue: ${data?.error || "Invalid response structure"}`);
      }
    } catch (err: any) {
      console.error("Gemini API error:", err);
      updatePlaceholderText(rfqId, placeholderMsgId, `Technical connection issue: ${err.message || "Failed to reach foundry servers"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const updatePlaceholderText = (rfqId: string, msgId: string, text: string) => {
    setIntakeStates(prev => {
      const s = prev[rfqId];
      if (!s) return prev;
      return {
        ...prev,
        [rfqId]: {
          ...s,
          thread: s.thread.map(m => m.id === msgId ? { ...m, text } : m)
        }
      };
    });
  };

  const simulateTypeIn = (rfqId: string, fullText: string, messageId: string, clarifyingQuestion: string | null) => {
    let currentLength = 0;
    const totalChars = fullText.length;
    const speedMs = 15;
    const charsPerTick = Math.max(1, Math.ceil((totalChars * speedMs) / 3000)); // Cap typewriter to 3s

    const interval = setInterval(() => {
      currentLength += charsPerTick;
      if (currentLength >= totalChars) {
        currentLength = totalChars;
        clearInterval(interval);
      }
      
      const chunk = fullText.slice(0, currentLength);
      setIntakeStates(prev => {
        const s = prev[rfqId];
        if (!s) return prev;
        return {
          ...prev,
          [rfqId]: {
            ...s,
            thread: s.thread.map(m => m.id === messageId ? { 
              ...m, 
              text: chunk,
              clarifyingQuestion: currentLength >= totalChars ? clarifyingQuestion : null
            } : m)
          }
        };
      });
    }, speedMs);
  };

  // Send message from composer
  const handleSend = async () => {
    if (!activeRfq || isGenerating) return;

    const rfqId = activeRfq.id;
    const currentComposerText = currentState.composerText;
    if (!currentComposerText.trim()) return;

    const nextTurn = currentState.turnCount + 1;

    // Create CLIENT bubble (left-aligned)
    const newClientMsg: ChatMessage = {
      id: `msg-client-${Date.now()}`,
      sender: "CUSTOMER",
      senderName: "You",
      text: currentComposerText,
      turn: nextTurn,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedThread = [...currentState.thread, newClientMsg];

    updateCurrentState({
      thread: updatedThread,
      composerText: "",
      turnCount: nextTurn
    });

    await triggerGeminiCall(rfqId, updatedThread, nextTurn);
  };

  // Lock spec and transition downstream
  const handleLockSpec = () => {
    if (!activeRfq || !onUpdateStore) return;
    const rfqId = activeRfq.id;

    const updatedRfqs = store.rfqs.map(r => {
      if (r.id === rfqId) {
        return {
          ...r,
          status: "Spec-locked" as const,
          specSheet: currentState.specSheet,
          turns: currentState.turnCount,
          completenessPct: completenessPct
        };
      }
      return r;
    });

    const nextStore = {
      ...store,
      rfqs: updatedRfqs
    };

    const actionStr = `RFQ ${rfqId} spec-locked in ${currentState.turnCount} turns · sent to costing`;
    const finalizedStore = addEvent(nextStore, "RFQ Intake", actionStr);
    onUpdateStore(finalizedStore);
    
    setShowDrawer(true);
  };

  // Search filter implementation
  const filteredRfqs = store.rfqs.filter(rfq => {
    const linkedInq = store.inquiries.find(i => i.id === rfq.inquiryId);
    const inqCustomer = linkedInq ? linkedInq.customer.toLowerCase() : "";
    const inqPart = linkedInq ? linkedInq.part.toLowerCase() : "";

    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      rfq.id.toLowerCase().includes(query) ||
      rfq.specs.material.toLowerCase().includes(query) ||
      inqCustomer.includes(query) ||
      inqPart.includes(query)
    );
  });

  // Country flags helper
  const getCountryFlagByCustomer = (customer: string): string => {
    const norm = customer.toLowerCase();
    if (norm.includes("ksb") || norm.includes("germany")) return "🇩🇪";
    if (norm.includes("hayward") || norm.includes("usa") || norm.includes("crane")) return "🇺🇸";
    if (norm.includes("rotork") || norm.includes("uk")) return "🇬🇧";
    if (norm.includes("petrol") || norm.includes("italy")) return "🇮🇹";
    if (norm.includes("kitz") || norm.includes("japan")) return "🇯🇵";
    if (norm.includes("velan") || norm.includes("canada")) return "🇨🇦";
    return "🌐";
  };

  const activeInquiry = activeRfq ? store.inquiries.find(i => i.id === activeRfq.inquiryId) : null;
  const activeCustomerFlag = activeInquiry ? getCountryFlagByCustomer(activeInquiry.customer) : "🌐";

  return (
    <div id="rfq-intake-module" className="space-y-6">
      
      {/* 4-COLUMN BENTO GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* HERO CELL (2x2) — Live Conversational Workspace */}
        <div 
          id="bento-hero-workspace"
          className="lg:col-span-2 lg:row-span-2 flex flex-col bg-white border border-[#E7E5E4] rounded-lg p-6 min-h-[580px] justify-between relative shadow-sm"
        >
          {/* Header */}
          <div className="flex flex-col border-b border-[#E7E5E4] pb-4 mb-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-bold text-stone-900 tracking-tight flex items-center gap-1.5">
                    {activeInquiry?.customer || "Walk-In"} {activeCustomerFlag}
                  </span>
                  <span className="text-[11px] font-mono bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">
                    {activeRfq?.id}
                  </span>
                </div>
                <p className="text-[13px] text-stone-500 font-medium mt-1">
                  {activeInquiry?.part || "Custom Casting Inquiry"}
                </p>
              </div>
              
              <div className="text-right">
                <span className="text-[11px] font-mono text-stone-400 uppercase tracking-wider block">
                  Intake Session
                </span>
                <span className="text-[12px] font-mono font-bold text-[#D97706]">
                  Turn {currentState.turnCount}
                </span>
              </div>
            </div>
          </div>

          {/* Scrolling Chat Thread / Empty state */}
          <div className="flex-1 overflow-y-auto space-y-4 max-h-[310px] pr-2 mb-4 scrollbar-thin">
            {currentState.thread.length === 0 ? (
              <div className="flex flex-col items-center justify-center border border-dashed border-stone-200 rounded-lg p-5 bg-stone-50/50 text-center min-h-[220px]">
                <Activity className="w-8 h-8 text-stone-300 mb-2" />
                <h4 className="text-[13px] font-bold text-stone-700 mb-1 uppercase tracking-wider">
                  Start the RFQ conversation
                </h4>
                <p className="text-[11px] font-mono text-stone-400 max-w-xs mb-3 leading-normal">
                  Select a quick-start chip below to load a realistic client message, then click Send to chat live with Super Quali Cast!
                </p>
                
                <div className="grid grid-cols-1 gap-2 w-full max-w-md">
                  {[
                    { title: "★ Ask about alloy & casting limits", txt: "Hi, can you pour A351 CF8M for a valve body around 12 kg? Need EN 10204 3.1." },
                    { title: "★ Send detailed customer RFQ", txt: "Hello, requesting a quote for 500 pcs of a pump impeller, CA6NM, cast weight approx 8.4 kg, PED 97/23/EC Cat II, delivery to Hamburg in 16 weeks. Drawing to follow." },
                    { title: "★ Ask about super-duplex limits", txt: "What is the largest single-piece casting you can pour, and can you do super-duplex like UNS S32760?" },
                    { title: "★ Prototype / small one-off qty", txt: "We need one prototype casting in Inconel 625, ~4 kg. Do you take one-off orders?" }
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => updateCurrentState({ composerText: chip.txt })}
                      className="p-2 border border-stone-200 bg-white rounded text-left hover:bg-[#FFFBEB] hover:border-[#D97706] transition-all text-[11px] font-mono text-stone-700 cursor-pointer"
                    >
                      <span className="font-bold text-[#D97706] block mb-0.5">{chip.title}</span>
                      <span className="text-stone-500 truncate block">"{chip.txt}"</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              currentState.thread.map((msg, idx) => {
                const isCust = msg.sender === "CUSTOMER";
                
                // If it is the 3-dot pulse placeholder bubble
                const isPlaceholder = msg.text === "";
                
                let cleanReplyText = msg.text;
                if (msg.clarifyingQuestion && cleanReplyText.endsWith(msg.clarifyingQuestion)) {
                  cleanReplyText = cleanReplyText.slice(0, -msg.clarifyingQuestion.length).trim();
                }

                return (
                  <div 
                    key={msg.id || idx}
                    className={`flex flex-col group ${isCust ? "items-start" : "items-end"}`}
                  >
                    {/* Sender & Timestamp */}
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-[10px] font-mono font-bold text-stone-400">
                        {isCust ? `${msg.senderName || "Client"} · Sourcing` : "SQC · Design Engineering"}
                      </span>
                      <span className="text-[9px] font-mono text-stone-300">
                        {msg.timestamp}
                      </span>
                    </div>

                    {/* Message Bubble */}
                    <div 
                      className={`max-w-[85%] p-3.5 rounded-lg text-[13px] font-mono leading-relaxed border relative ${
                        isCust 
                          ? "bg-white border-[#E7E5E4] text-stone-800 rounded-tl-none" 
                          : "bg-[#FFFBEB] border-[#FDE68A] text-stone-900 rounded-tr-none"
                      }`}
                    >
                      {isPlaceholder ? (
                        <div className="flex flex-col gap-1 px-1">
                          <div className="flex items-center gap-1.5 py-1">
                            <span className="w-1.5 h-1.5 bg-[#D97706] rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-1.5 h-1.5 bg-[#D97706] rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-1.5 h-1.5 bg-[#D97706] rounded-full animate-bounce" />
                          </div>
                          <span className="text-[9.5px] font-mono text-[#D97706] animate-pulse">SQC is typing...</span>
                        </div>
                      ) : (
                        <>
                          <div className="whitespace-pre-line text-stone-800">
                            {cleanReplyText}
                          </div>
                          
                          {/* Step C: Clarifying Question Highlight with Left Stripe */}
                          {msg.clarifyingQuestion && (
                            <div className="mt-3 pl-2.5 border-l-2 border-[#D97706] text-amber-900 font-medium italic text-[12.5px] bg-amber-50/50 py-1.5 rounded-r">
                              {msg.clarifyingQuestion}
                            </div>
                          )}
                        </>
                      )}

                      {/* Hover actions & info tags */}
                      {!isCust && !isPlaceholder && (
                        <div className="mt-2 pt-2 border-t border-amber-200/50 flex justify-between items-center text-[9px] text-amber-600">
                          <span className="flex items-center gap-1 font-mono uppercase tracking-wider text-[8.5px]">
                            <Sparkles className="w-2.5 h-2.5" /> SQC Assistant
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Composer / Controls */}
          <div className="border-t border-[#E7E5E4] pt-4">
            <div className="flex justify-between items-center mb-1.5 px-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                You are the client — type your message
              </span>
            </div>
            <div className="relative">
              <textarea
                value={currentState.composerText}
                onChange={(e) => updateCurrentState({ composerText: e.target.value })}
                disabled={isGenerating}
                className={`w-full min-h-[80px] p-3 text-[13px] font-mono rounded border text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#D97706] transition-all ${
                  isGenerating 
                    ? "bg-stone-50 text-stone-400 border-stone-200 animate-pulse" 
                    : "bg-white border-[#E7E5E4]"
                }`}
                placeholder="Ask about capability or send an RFQ..."
              />
            </div>

            {/* Action buttons bar */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex gap-2">
                <button
                  onClick={handleResetConversation}
                  disabled={isGenerating || currentState.thread.length === 0}
                  className="px-2.5 py-1.5 border border-[#E7E5E4] hover:bg-stone-50 text-stone-500 hover:text-stone-800 rounded font-mono text-[10.5px] uppercase tracking-wide flex items-center gap-1 transition-all disabled:opacity-40 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reset Conversation
                </button>
              </div>

              {/* Step C (e): Unified lock or send button */}
              {completenessPct >= 80 && filledCriticalCount === totalCriticalCount ? (
                <button
                  onClick={handleLockSpec}
                  className="px-4 py-2 bg-[#D97706] hover:bg-[#B45309] text-white rounded font-mono text-[11px] uppercase tracking-wider flex items-center gap-1.5 shadow transition-all cursor-pointer animate-bounce"
                >
                  <FileCheck className="w-4 h-4" />
                  Lock Spec & Cost →
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={isGenerating || !currentState.composerText.trim()}
                  className="px-4 py-2 bg-[#D97706] hover:bg-[#B45309] text-white rounded font-mono text-[11px] uppercase tracking-wider flex items-center gap-1.5 shadow transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send to SQC
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 1x1 KPI 1 — Avg RFQ Intake Velocity */}
        <div className="bg-white border border-[#E7E5E4] rounded-lg p-6 flex flex-col justify-between h-[180px] shadow-sm">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
              Avg RFQ Intake Velocity
            </div>
            <div className="text-[32px] font-bold text-[#D97706] mt-4 tracking-tight leading-none">
              4 days → 2 hrs
            </div>
          </div>
          <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest leading-none mt-2">
            AI-DRIVEN WORKSPACE CO-PILOT
          </p>
        </div>

        {/* 1x1 KPI 2 — Spec Completeness (this RFQ) */}
        <div className="bg-white border border-[#E7E5E4] rounded-lg p-6 flex flex-col justify-between h-[180px] shadow-sm">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
              Spec Completeness (This RFQ)
            </div>
            <div className="text-[36px] font-bold text-stone-900 mt-4 tracking-tight leading-none">
              {completenessPct}%
            </div>
          </div>
          <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest leading-none mt-2">
            SYNCED WITH RING METRICS
          </p>
        </div>

        {/* Live Spec Sheet (2x1) — Expandable Accordion with completeness meter */}
        <div className="lg:col-span-2 flex flex-col bg-white border border-[#E7E5E4] rounded-lg p-6 shadow-sm">
          
          {/* Completeness Ring Meter */}
          <div className="flex items-center gap-4 bg-stone-50 border border-[#E7E5E4] rounded-lg p-4 mb-4">
            <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  className="stroke-stone-200 fill-none"
                  strokeWidth="3.5"
                />
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  className="stroke-[#D97706] fill-none transition-all duration-300"
                  strokeWidth="3.5"
                  strokeDasharray={151}
                  strokeDashoffset={151 - (151 * completenessPct) / 100}
                />
              </svg>
              <span className="absolute text-[11px] font-mono font-bold text-stone-900">
                {completenessPct}%
              </span>
            </div>
            <div>
              <div className="text-[13px] font-bold text-stone-800 uppercase tracking-tight">
                SPEC COMPLETENESS METER
              </div>
              <div className="text-[11px] font-mono text-stone-500 mt-0.5">
                ★ Critical fields: <span className="font-bold text-stone-800">{filledCriticalCount}</span>/{totalCriticalCount} filled
              </div>
            </div>
          </div>

          {/* 11 Accordion Sections */}
          <div className="flex-1 overflow-y-auto max-h-[350px] space-y-2 pr-1 scrollbar-thin">
            {Object.entries(SECTION_NAMES).map(([secIdStr, sectionName]) => {
              const secId = parseInt(secIdStr);
              const fields = SPEC_FIELDS.filter(f => f.sectionId === secId);
              const filledInSec = fields.filter(f => currentState.specSheet[f.label]?.value).length;
              const totalInSec = fields.length;
              const isExpanded = expandedSection === secId;

              return (
                <div 
                  key={secId} 
                  className={`border border-[#E7E5E4] rounded-md overflow-hidden transition-all duration-150 ${
                    isGenerating ? "animate-pulse" : ""
                  }`}
                >
                  {/* Header */}
                  <button
                    onClick={() => setExpandedSection(isExpanded ? null : secId)}
                    className="w-full bg-stone-50 hover:bg-stone-100/80 px-4 py-2.5 flex items-center justify-between text-left transition-all border-b border-transparent focus:outline-none"
                  >
                    <span className="text-[12px] font-mono font-bold text-stone-700 tracking-wide uppercase">
                      {sectionName}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-stone-400 bg-white border border-[#E7E5E4] px-1.5 py-0.5 rounded">
                        {filledInSec}/{totalInSec}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-stone-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-stone-400" />
                      )}
                    </div>
                  </button>

                  {/* Fields list */}
                  {isExpanded && (
                    <div className="p-3 bg-white divide-y divide-stone-100">
                      {fields.map(f => {
                        const cell = currentState.specSheet[f.label];
                        const hasVal = !!cell?.value;
                        const isJustUpdated = currentState.justUpdatedFields.has(f.label);
                        const isLowConfidence = cell?.confidence === "low";

                        return (
                          <div key={f.label} className="py-2 flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4 text-[12px]">
                            {/* Label */}
                            <div className="flex items-center gap-1 shrink-0">
                              {f.critical && <span className="text-[#D97706] font-bold" title="Critical Field">★</span>}
                              <span className="font-mono text-stone-500">{f.label}</span>
                            </div>

                            {/* Value & Source & Confidence check */}
                            <div className="flex flex-col items-end text-right min-w-0">
                              <div className="flex flex-wrap items-center justify-end gap-1.5">
                                <span 
                                  className={`font-mono transition-all duration-200 truncate max-w-[200px] ${
                                    isJustUpdated 
                                      ? "bg-amber-100 text-amber-950 font-bold px-1.5 py-0.5 rounded border-b-2 border-amber-600 animate-pulse" 
                                      : hasVal 
                                        ? "text-stone-900 font-semibold" 
                                        : "text-stone-300"
                                  }`}
                                >
                                  {hasVal ? cell.value : "—"}
                                </span>

                                {hasVal && isLowConfidence && (
                                  <button
                                    onClick={() => handleConfirmConfidence(f.label)}
                                    className="bg-amber-100 text-[#D97706] hover:bg-amber-200 hover:text-amber-800 px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold flex items-center gap-0.5 animate-pulse cursor-pointer border border-[#FDE68A]"
                                    title="Click to verify / confirm this detail"
                                  >
                                    ⚠️ Confirm Info
                                  </button>
                                )}
                              </div>
                              
                              {hasVal && (
                                <span className="text-[9px] font-mono text-stone-400 mt-0.5">
                                  from turn {cell.sourceTurn}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* RFQ QUEUE (2x1 Size spanning full width) */}
      <div id="rfq-queue-bento" className="bg-white border border-[#E7E5E4] rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#E7E5E4] pb-4 mb-4">
          <div>
            <h3 className="text-[14px] font-bold text-stone-900 tracking-tight uppercase">
              ACTIVE RFQ QUEUE
            </h3>
            <p className="text-[11px] font-mono text-stone-400 mt-0.5 uppercase">
              Select inquiry row to run conversational workspace
            </p>
          </div>
          <span className="bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] text-[10px] font-mono font-bold px-2.5 py-1 rounded-full">
            {store.rfqs.filter(r => r.status === "Pending").length} INTAKES PENDING
          </span>
        </div>

        {/* Adapting Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-[12px]">
            <thead>
              <tr className="border-b border-[#E7E5E4] text-stone-400 uppercase text-[10px] tracking-wider bg-stone-50/50">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Part</th>
                <th className="py-3 px-4">Turns</th>
                <th className="py-3 px-4">Completeness %</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E5E4]">
              {filteredRfqs.map((rfq) => {
                const isSelected = activeRfqId === rfq.id;
                const linkedInq = store.inquiries.find(i => i.id === rfq.inquiryId);
                const isKsb = rfq.id === "SQC-RFQ-2026-001";
                
                // Get turns & completeness computed dynamically or from store
                let turnsCount = 0;
                let cPercent = 0;

                if (isKsb) {
                  turnsCount = intakeStates[rfq.id]?.turnCount ?? 0;
                  // Compute dynamic completeness for display
                  const state = intakeStates[rfq.id];
                  if (state) {
                    const filled = SPEC_FIELDS.filter(f => f.critical && state.specSheet[f.label]?.value).length;
                    cPercent = Math.round((filled / 17) * 100);
                  } else {
                    cPercent = 24; // Turn 0 default
                  }
                } else {
                  const state = intakeStates[rfq.id];
                  if (state) {
                    turnsCount = state.turnCount;
                    const filled = SPEC_FIELDS.filter(f => f.critical && state.specSheet[f.label]?.value).length;
                    cPercent = Math.round((filled / 17) * 100);
                  } else {
                    turnsCount = rfq.turns || 0;
                    cPercent = rfq.completenessPct || 18;
                  }
                }

                // If rfq is spec-locked in the store
                const rfqStatus = rfq.status;

                // Pending > 5 days condition
                const isWaitingTooLong = rfq.status === "Pending" && (rfq.daysWaiting || 0) > 5;

                return (
                  <tr 
                    key={rfq.id}
                    className={`transition-colors duration-150 ${
                      isSelected 
                        ? "bg-[#FFFBEB]/50 font-semibold" 
                        : "hover:bg-stone-50"
                    } ${isWaitingTooLong ? "border-l-4 border-[#D97706]" : ""}`}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                      {rfq.id}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-stone-800">
                      <div className="flex items-center gap-1.5">
                        {linkedInq?.customer || "OEM Customer"}
                        <span>{linkedInq ? getCountryFlagByCustomer(linkedInq.customer) : "🌐"}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-stone-600">
                      {linkedInq?.part || "Cast component"}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-stone-500">
                      {turnsCount} turns
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
                          <div 
                            className="bg-[#D97706] h-full rounded-full transition-all"
                            style={{ width: `${cPercent}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-stone-700 font-bold font-mono">{cPercent}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {isWaitingTooLong ? (
                        <div className="flex items-center gap-2">
                          <span className="bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase">
                            WAITING {rfq.daysWaiting}D
                          </span>
                        </div>
                      ) : rfqStatus === "Spec-locked" ? (
                        <span className="bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0] text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase">
                          SPEC-LOCKED
                        </span>
                      ) : (
                        <span className="bg-stone-100 text-stone-600 border border-stone-200 text-[9px] font-mono px-1.5 py-0.5 rounded uppercase">
                          {rfqStatus}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setActiveRfqId(rfq.id)}
                        className={`px-3 py-1 rounded text-[11px] uppercase tracking-wide font-mono transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#D97706] text-white font-bold"
                            : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                        }`}
                      >
                        {isSelected ? "Active" : "Select"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT SIDE DRAWER PREVIEW CARD — formatted PDF-style Document */}
      {showDrawer && activeRfq && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-[1px] z-50 flex justify-end">
          <div className="absolute inset-0" onClick={() => setShowDrawer(false)} />
          
          <div className="relative w-full max-w-2xl bg-[#FAFAF9] h-full shadow-2xl flex flex-col z-10 p-8 overflow-y-auto border-l border-[#E7E5E4] transition-all duration-300">
            <button 
              onClick={() => setShowDrawer(false)}
              className="absolute top-6 right-6 text-stone-400 hover:text-stone-900 font-mono text-xs uppercase tracking-wider cursor-pointer"
            >
              [ Close × ]
            </button>

            {/* SQC Letterhead Card markup */}
            <div className="bg-white border border-[#E7E5E4] rounded-lg p-8 shadow-md flex-1 flex flex-col justify-between mt-8">
              <div>
                
                {/* Header Lockup */}
                <div className="flex items-start justify-between border-b border-[#E7E5E4] pb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[#D97706] text-white flex items-center justify-center rounded font-bold text-xs tracking-tighter">
                      SQC
                    </div>
                    <div>
                      <h2 className="font-bold text-[13px] leading-tight text-[#1C1917] uppercase tracking-tight">
                        SUPER QUALI CAST (INDIA) PVT. LTD.
                      </h2>
                      <p className="text-[9px] text-[#79716B] leading-tight mt-1 uppercase tracking-widest">
                        INVESTMENT CASTINGS · RAJKOT · INDIA
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0] text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                      SPEC-LOCKED
                    </span>
                    <p className="text-[10px] font-mono text-stone-400 mt-2">ID: {activeRfq.id}</p>
                  </div>
                </div>

                {/* Badges strip */}
                <div className="flex flex-wrap gap-2 py-3 border-b border-[#E7E5E4] justify-center">
                  <span className="font-mono text-[9px] text-[#79716B] uppercase tracking-wider text-center">
                    ISO 9001:2015 · ISO 14001 · ISO 45001 · PED 97/23/EC · IBR · AD 2000-W0
                  </span>
                </div>

                {/* Document title */}
                <div className="my-6 text-center">
                  <h3 className="font-mono font-bold text-[14px] uppercase text-stone-800 tracking-wider">
                    TECHNICAL SPECIFICATION SHEET
                  </h3>
                  <p className="text-[11px] font-mono text-stone-500 mt-1">
                    Customer: {activeInquiry?.customer || "KSB SE"} · Part: {activeInquiry?.part || "Impeller"}
                  </p>
                </div>

                {/* Specs list grouped by accordion section */}
                <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2 scrollbar-thin">
                  {Object.entries(SECTION_NAMES).map(([sectionIdStr, sectionName]) => {
                    const sectionId = parseInt(sectionIdStr);
                    const fieldsInSection = SPEC_FIELDS.filter(f => f.sectionId === sectionId);
                    const filledFields = fieldsInSection.filter(f => currentState.specSheet[f.label]?.value);
                    
                    if (filledFields.length === 0) return null;

                    return (
                      <div key={sectionId} className="border-b border-stone-100 pb-3">
                        <h4 className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wide mb-1.5">
                          {sectionName}
                        </h4>
                        <div className="space-y-1 pl-2">
                          {fieldsInSection.map(f => {
                            const valObj = currentState.specSheet[f.label];
                            if (!valObj?.value) return null;
                            return (
                              <div key={f.label} className="flex justify-between text-[11px] font-mono py-0.5 gap-4">
                                <span className="text-stone-400 shrink-0">{f.label}:</span>
                                <span className="text-stone-800 font-bold text-right break-words">{valObj.value}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Drawer Footer controls */}
              <div className="border-t border-[#E7E5E4] pt-6 mt-6">
                <div className="text-center font-mono text-[10px] text-stone-400 mb-6 uppercase tracking-wider leading-relaxed">
                  RFQ intake by SQC Design Engineering · costing team → quote next
                </div>
                
                <div className="flex gap-4">
                  <button 
                    onClick={() => {}} 
                    className="flex-1 py-2 border border-[#E7E5E4] hover:bg-stone-50 text-stone-600 hover:text-stone-900 font-mono text-[11px] uppercase tracking-wider transition cursor-pointer"
                  >
                    Download PDF
                  </button>
                  <button 
                    onClick={() => {}} 
                    className="flex-1 py-2 border border-[#E7E5E4] hover:bg-stone-50 text-stone-600 hover:text-stone-900 font-mono text-[11px] uppercase tracking-wider transition cursor-pointer"
                  >
                    Copy internal link
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
