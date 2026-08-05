import { useState, useMemo } from "react";
import { AppStore, Order, OrderStage, Shipment, ShipmentDoc } from "../types";
import { 
  CheckCircle2, 
  CircleDot, 
  Mail, 
  MessageSquare, 
  ArrowRight, 
  FileText, 
  Send, 
  Eye, 
  Check, 
  X, 
  TrendingUp, 
  Cpu, 
  FileCheck, 
  AlertCircle 
} from "lucide-react";

interface DispatchDocsProps {
  store: AppStore;
  searchQuery: string;
  onUpdateStore?: (newStore: AppStore) => void;
}

// Stage sequence mapping
const STAGE_SEQUENCE: OrderStage[] = ["Cast", "Machine", "QC", "Pack", "Ship"];

export default function DispatchDocs({ store, searchQuery, onUpdateStore }: DispatchDocsProps) {
  // Local active selected order ID
  const [selectedOrderId, setSelectedOrderId] = useState<string>(() => {
    // Default to the first order on load
    return store.orders.length > 0 ? store.orders[0].id : "";
  });

  // Local state for notification toggle: 'Email' | 'WhatsApp'
  const [notifType, setNotifType] = useState<"Email" | "WhatsApp">("Email");

  // Local state for document preview modal
  const [previewDoc, setPreviewDoc] = useState<{
    docName: string;
    orderId: string;
  } | null>(null);

  // Search filtered orders
  const filteredOrders = useMemo(() => {
    return store.orders.filter(order => {
      const q = searchQuery.toLowerCase();
      if (!q) return true;
      return (
        order.id.toLowerCase().includes(q) ||
        order.customer.toLowerCase().includes(q) ||
        order.part.toLowerCase().includes(q) ||
        order.destination.toLowerCase().includes(q) ||
        order.stage.toLowerCase().includes(q)
      );
    });
  }, [store.orders, searchQuery]);

  // Selected Order details
  const selectedOrder = useMemo(() => {
    return store.orders.find(o => o.id === selectedOrderId) || store.orders[0] || null;
  }, [store.orders, selectedOrderId]);

  // Derive if EU shipment or IBR applicable for selected order
  const isEuShipment = useMemo(() => {
    if (!selectedOrder) return false;
    const dest = selectedOrder.destination.toLowerCase();
    const cust = selectedOrder.customer.toLowerCase();
    return (
      dest.includes("germany") || 
      dest.includes("italy") || 
      dest.includes("europe") || 
      dest.includes("eu") ||
      cust.includes("ksb") || 
      cust.includes("petrolvalves") || 
      cust.includes("orion")
    );
  }, [selectedOrder]);

  const isIbrApplicable = useMemo(() => {
    if (!selectedOrder) return false;
    const dest = selectedOrder.destination.toLowerCase();
    const cust = selectedOrder.customer.toLowerCase();
    return (
      dest.includes("india") || 
      cust.includes("l&t") || 
      cust.includes("india")
    );
  }, [selectedOrder]);

  // Get dynamic document list for selected order
  const getRequiredDocsForOrder = (order: Order): string[] => {
    const isEu = (
      order.destination.toLowerCase().includes("germany") || 
      order.destination.toLowerCase().includes("italy") || 
      order.destination.toLowerCase().includes("europe") || 
      order.customer.toLowerCase().includes("ksb") || 
      order.customer.toLowerCase().includes("petrolvalves")
    );
    const isIbr = (
      order.customer.toLowerCase().includes("india") || 
      order.destination.toLowerCase().includes("india") || 
      order.customer.toLowerCase().includes("l&t")
    );

    return [
      "Commercial Invoice",
      "Packing List",
      "Test Certificate EN 10204 3.1",
      ...(isEu ? ["PED 97/23/EC Declaration"] : []),
      ...(isIbr ? ["IBR Certificate"] : []),
      "Certificate of Origin"
    ];
  };

  // Get or initialize shipment and docs for any order
  const getShipmentForOrder = (orderId: string): Shipment => {
    const found = store.shipments.find(s => s.orderId === orderId);
    if (found) return found;

    // Build static default docs
    const order = store.orders.find(o => o.id === orderId);
    if (!order) {
      return {
        id: `SQC-SHIP-2026-UNKNOWN`,
        orderId,
        docs: [],
        notified: false
      };
    }

    const docNames = getRequiredDocsForOrder(order);
    return {
      id: `SQC-SHIP-2026-${orderId.split("-").pop()}`,
      orderId,
      docs: docNames.map(name => ({
        name,
        status: (order.stage === "Ship") ? "Generated" as const : "Pending" as const
      })),
      notified: order.stage === "Ship"
    };
  };

  // Safe reference to active shipment for selected order
  const selectedShipment = useMemo(() => {
    if (!selectedOrder) return null;
    return getShipmentForOrder(selectedOrder.id);
  }, [selectedOrder, store.shipments]);

  // Generate dynamic shipping details / AWB for the selected order
  const shippingTransitDetails = useMemo(() => {
    if (!selectedOrder) return { carrier: "DHL", details: "Pending" };
    const idNum = selectedOrder.id.split("-").pop();
    const dest = selectedOrder.destination.toLowerCase();
    if (dest.includes("germany") || dest.includes("italy") || dest.includes("europe")) {
      return { carrier: "Sea Cargo", details: `VESSEL: MAERSK RAJKOT V-206E` };
    } else if (dest.includes("usa")) {
      return { carrier: "Sea Cargo", details: `VESSEL: MSC SHAPAR V-841A` };
    } else if (dest.includes("japan") || dest.includes("chiba")) {
      return { carrier: "Air Cargo", details: `AWB: JAL-9931-1${idNum}` };
    } else if (dest.includes("canada") || dest.includes("montreal")) {
      return { carrier: "Sea Cargo", details: `VESSEL: CMA CGM MONTREAL V-3${idNum}` };
    } else {
      return { carrier: "Road Transport", details: `V-TRANS LINES LR-942${idNum}` };
    }
  }, [selectedOrder]);

  // Toggle state of an individual document (mutates store & logs event)
  const handleToggleDocStatus = (docName: string) => {
    if (!selectedOrder || !onUpdateStore) return;

    const currentShipment = selectedShipment || getShipmentForOrder(selectedOrder.id);
    const updatedDocs = currentShipment.docs.map(d => {
      if (d.name === docName) {
        return { 
          ...d, 
          status: d.status === "Generated" ? "Pending" as const : "Generated" as const 
        };
      }
      return d;
    });

    // If the doc didn't exist in current shipment list, we might need to add it
    if (!updatedDocs.some(d => d.name === docName)) {
      updatedDocs.push({
        name: docName,
        status: "Generated"
      });
    }

    const updatedShipment: Shipment = {
      ...currentShipment,
      docs: updatedDocs
    };

    const alreadyInStore = store.shipments.some(s => s.orderId === selectedOrder.id);
    const updatedShipments = alreadyInStore
      ? store.shipments.map(s => s.orderId === selectedOrder.id ? updatedShipment : s)
      : [...store.shipments, updatedShipment];

    const targetDoc = updatedDocs.find(d => d.name === docName);
    const newStatusStr = targetDoc ? targetDoc.status : "Pending";

    // Build new Event log
    const now = new Date();
    const hrs = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const timestampIST = `${hrs}:${mins} IST`;

    const newEvent = {
      id: `EV-${String(store.events.length + 1).padStart(3, '0')}`,
      timestampIST,
      module: "Dispatch",
      message: `Document "${docName}" for ${selectedOrder.id} updated to ${newStatusStr}`
    };

    onUpdateStore({
      ...store,
      shipments: updatedShipments,
      events: [newEvent, ...store.events]
    });
  };

  // Pipeline Action: Docs complete -> Ship
  const handleDocsCompleteAndShip = () => {
    if (!selectedOrder || !onUpdateStore) return;

    // 1. Advance the selected Order's stage to "Ship"
    const updatedOrders = store.orders.map(o => {
      if (o.id === selectedOrder.id) {
        return { ...o, stage: "Ship" as const };
      }
      return o;
    });

    // 2. Mark all documents in the shipment as "Generated"
    const currentShipment = selectedShipment || getShipmentForOrder(selectedOrder.id);
    const updatedDocs = currentShipment.docs.map(d => ({
      ...d,
      status: "Generated" as const
    }));

    const updatedShipment: Shipment = {
      ...currentShipment,
      docs: updatedDocs
    };

    const alreadyInStore = store.shipments.some(s => s.orderId === selectedOrder.id);
    const updatedShipments = alreadyInStore
      ? store.shipments.map(s => s.orderId === selectedOrder.id ? updatedShipment : s)
      : [...store.shipments, updatedShipment];

    // 3. Create Event with EXACT event log required to trigger the toast in App.tsx:
    // "Shipment dispatched — Command Center updated"
    const now = new Date();
    const hrs = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const timestampIST = `${hrs}:${mins} IST`;

    const newEvent = {
      id: `EV-${String(store.events.length + 1).padStart(3, '0')}`,
      timestampIST,
      module: "Dispatch",
      message: "Shipment dispatched — Command Center updated"
    };

    onUpdateStore({
      ...store,
      orders: updatedOrders,
      shipments: updatedShipments,
      events: [newEvent, ...store.events]
    });
  };

  // Handle Dispatching Customer Notification
  const handleSendNotification = () => {
    if (!selectedOrder || !onUpdateStore) return;

    const currentShipment = selectedShipment || getShipmentForOrder(selectedOrder.id);
    const updatedShipment: Shipment = {
      ...currentShipment,
      notified: true
    };

    const alreadyInStore = store.shipments.some(s => s.orderId === selectedOrder.id);
    const updatedShipments = alreadyInStore
      ? store.shipments.map(s => s.orderId === selectedOrder.id ? updatedShipment : s)
      : [...store.shipments, updatedShipment];

    const now = new Date();
    const hrs = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const timestampIST = `${hrs}:${mins} IST`;

    const newEvent = {
      id: `EV-${String(store.events.length + 1).padStart(3, '0')}`,
      timestampIST,
      module: "Dispatch",
      message: `Dispatched customer shipping alert for ${selectedOrder.id} via ${notifType}`
    };

    onUpdateStore({
      ...store,
      shipments: updatedShipments,
      events: [newEvent, ...store.events]
    });
  };

  // Computed draft notification content based on Selected Order
  const draftNotificationText = useMemo(() => {
    if (!selectedOrder) return "";
    const orderId = selectedOrder.id;
    const customer = selectedOrder.customer;
    const part = selectedOrder.part;
    const destination = selectedOrder.destination;
    const vesselAwb = shippingTransitDetails.details;

    if (notifType === "Email") {
      return `Subject: Shipping Clearance Notification - SQC Order ${orderId}

Dear Customer Team at ${customer},

We are pleased to inform you that your shipment of ${part} is cleared for dispatch from Super Quali Cast, Unit-2 Shapar.

Logistics Details:
- Order Reference: ${orderId}
- Destination: ${destination}
- ${vesselAwb}

The automated document pack, including the EN 10204 3.1 Material Test Certificate and Zeiss CMM Calibration Report, has been certified and compiled.

Sincerely,
Logistics Team
Super Quali Cast (India) Pvt. Ltd.
Rajkot, Gujarat, India`;
    } else {
      return `*SUPER QUALI CAST — LOGISTICS DISPATCH*

Order *${orderId}* is cleared for dispatch from Unit-2 Shapar, Rajkot.

*Consignee:* ${customer}
*Part:* ${part}
*Destination:* ${destination}
*${vesselAwb}*

All QA/QC logs (MTC EN 10204 3.1 & Zeiss CMM reports) are fully generated and uploaded.

_SQC Logistics Command, Rajkot_`;
    }
  }, [selectedOrder, notifType, shippingTransitDetails]);

  return (
    <div className="space-y-6" id="dispatch-docs-module">
      
      {/* 12-Column Grid with uniform 24px gutters */}
      <div className="grid grid-cols-12 gap-6 items-start">
        
        {/* HERO CELL (2x2): DISPATCH BOARD (col-span-12 lg:col-span-8, taking up a substantial visual frame) */}
        <div 
          id="dispatch-board-hero"
          className="col-span-12 lg:col-span-8 bg-white border border-[#E7E5E4] rounded-xl p-6 flex flex-col h-auto min-h-[580px] transition-all duration-150"
        >
          <div className="border-b border-[#E7E5E4] pb-4 mb-4 flex justify-between items-start">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 block mb-1">
                Unit-2 Shapar Logistics Command
              </span>
              <h2 className="font-sora font-semibold text-lg text-stone-900">
                Dispatch Board
              </h2>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-stone-400 block uppercase font-semibold">
                Store Track
              </span>
              <span className="text-xs font-mono font-bold text-stone-700 bg-stone-50 border border-[#E7E5E4] px-2 py-0.5 rounded">
                {filteredOrders.length} of {store.orders.length} Orders
              </span>
            </div>
          </div>

          {/* Quick status filter or search indicator */}
          {searchQuery && (
            <div className="mb-4 bg-amber-50/60 border border-amber-200/50 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase font-bold text-[#D97706] bg-amber-100/80 px-1.5 py-0.5 rounded">
                Search Active
              </span>
              <span className="text-stone-600 font-medium">
                Filtering by: &ldquo;<span className="font-mono font-bold">{searchQuery}</span>&rdquo;
              </span>
            </div>
          )}

          {/* Main Orders List on the Board */}
          <div className="flex-1 overflow-y-auto space-y-3 max-h-[440px] pr-1">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => {
                const isSelected = order.id === selectedOrderId;
                const activeIndex = STAGE_SEQUENCE.indexOf(order.stage);

                return (
                  <div
                    key={order.id}
                    id={`order-row-${order.id}`}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`border rounded-lg p-4 transition-all duration-150 cursor-pointer text-left ${
                      isSelected 
                        ? "border-[#D97706] bg-amber-50/5 ring-1 ring-[#D97706]/20" 
                        : "border-[#E7E5E4] hover:border-stone-400 bg-white"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      {/* Left: Metadata */}
                      <div className="space-y-1 min-w-0 max-w-sm">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-stone-800 bg-stone-100 px-1.5 py-0.5 rounded border border-[#E7E5E4]">
                            {order.id}
                          </span>
                          <span className="font-sora font-semibold text-sm text-stone-900 truncate">
                            {order.customer}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 font-medium">
                          {order.part} · <span className="text-stone-400">{order.destination}</span>
                        </p>
                      </div>

                      {/* Right: Stage Track Chips */}
                      <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                        {STAGE_SEQUENCE.map((stage, sIdx) => {
                          const isCompleted = sIdx < activeIndex;
                          const isCurrent = sIdx === activeIndex;
                          
                          let chipStyle = "";
                          if (isCompleted) {
                            // Completed = Amber Filled
                            chipStyle = "bg-[#D97706] text-white";
                          } else if (isCurrent) {
                            // Current = Muted gold border + text with pulsing dot
                            chipStyle = "border border-[#D97706] text-[#D97706] bg-amber-50";
                          } else {
                            // Upcoming = Muted outline
                            chipStyle = "border border-[#E7E5E4] text-stone-400 bg-stone-50/30";
                          }

                          return (
                            <div key={stage} className="flex items-center gap-1">
                              <span 
                                className={`font-mono text-[9px] font-bold uppercase tracking-tight px-2 py-1 rounded transition-all duration-150 ${chipStyle} flex items-center gap-1.5`}
                              >
                                {isCurrent && (
                                  <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D97706] opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#D97706]"></span>
                                  </span>
                                )}
                                {stage.toUpperCase()}
                              </span>
                              {sIdx < STAGE_SEQUENCE.length - 1 && (
                                <span className="text-stone-300 text-[10px] font-bold font-mono">→</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center border border-dashed border-[#E7E5E4] rounded-lg text-stone-400 gap-3">
                <AlertCircle className="w-8 h-8 text-stone-300" />
                <p className="text-xs font-mono">No matching orders found on dispatch board.</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#E7E5E4] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-[11px] text-stone-500 font-mono">
            <span>* CLICK ANY ORDER TO AUTO-PREPARE & VERIFY ITS DOCUMENT PACK</span>
            <div className="flex gap-4">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-[#D97706] rounded-sm" /> COMPLETED
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-amber-50 border border-[#D97706] rounded-sm" /> CURRENT
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 border border-[#E7E5E4] rounded-sm" /> UPCOMING
              </span>
            </div>
          </div>
        </div>

        {/* 2x1 cell: "Export document pack" (col-span-12 lg:col-span-4) */}
        <div 
          id="export-document-pack-cell"
          className="col-span-12 lg:col-span-4 bg-white border border-[#E7E5E4] rounded-xl p-6 flex flex-col h-auto min-h-[580px]"
        >
          <div className="border-b border-[#E7E5E4] pb-4 mb-4">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 block mb-1">
              Automated Compilation
            </span>
            <h2 className="font-sora font-semibold text-lg text-stone-900">
              Export Document Pack
            </h2>
          </div>

          {selectedOrder ? (
            <div className="flex-1 flex flex-col justify-between">
              
              {/* Order Reference details */}
              <div className="bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg p-3 mb-4 text-xs space-y-1">
                <div className="flex justify-between font-mono font-bold text-stone-800">
                  <span>REF: {selectedOrder.id}</span>
                  <span className="text-amber-700">STAGE: {selectedOrder.stage.toUpperCase()}</span>
                </div>
                <p className="text-[11px] text-stone-600 font-medium">
                  Client: {selectedOrder.customer}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {isEuShipment && (
                    <span className="text-[9px] font-mono font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded">
                      EU Direct Shipment (PED)
                    </span>
                  )}
                  {isIbrApplicable && (
                    <span className="text-[9px] font-mono font-bold uppercase bg-stone-200 text-stone-800 border border-stone-300 px-1.5 py-0.5 rounded">
                      IBR Applicable (India)
                    </span>
                  )}
                </div>
              </div>

              {/* Checklist Rows */}
              <div className="space-y-2.5 flex-1">
                <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider block">
                  Export Checklist & Verification
                </span>
                
                {selectedShipment?.docs.map((doc, dIdx) => {
                  const isGenerated = doc.status === "Generated";
                  return (
                    <div 
                      key={dIdx}
                      className="flex items-center justify-between p-2 rounded-md border border-[#E7E5E4] bg-white hover:border-stone-300 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isGenerated ? (
                          <CheckCircle2 className="w-4 h-4 text-[#D97706] shrink-0" />
                        ) : (
                          <CircleDot className="w-4 h-4 text-stone-300 shrink-0 animate-pulse" />
                        )}
                        <span className="text-xs font-semibold text-stone-800 truncate">
                          {doc.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Status Pill (Interactive to toggle!) */}
                        <button
                          onClick={() => handleToggleDocStatus(doc.name)}
                          title="Click to toggle document verification"
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase border transition-all duration-150 ${
                            isGenerated
                              ? "bg-amber-50 text-[#D97706] border-[#FDE68A] hover:bg-amber-100"
                              : "bg-stone-50 text-stone-400 border-[#E7E5E4] hover:bg-stone-100"
                          }`}
                        >
                          {isGenerated ? "GENERATED" : "PENDING"}
                        </button>

                        {/* Ghost Preview Button */}
                        <button
                          onClick={() => setPreviewDoc({ docName: doc.name, orderId: selectedOrder.id })}
                          className="text-[9px] font-mono font-bold text-stone-600 hover:text-stone-900 px-1.5 py-0.5 rounded border border-[#E7E5E4] hover:bg-stone-50 transition-colors uppercase flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          PREVIEW
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-[11px] text-stone-500 font-mono mt-4 pt-3 border-t border-[#E7E5E4]">
                All files generated using in-house digital seals & signatures of SQC India Pvt. Ltd.
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-stone-400 text-xs font-mono">
              <FileText className="w-8 h-8 text-stone-200 mb-2" />
              <span>Select an order on the left to see the document pack.</span>
            </div>
          )}
        </div>

      </div>

      {/* 2nd Row: 1x1 Metric cells, Notification, and Pipeline Action Cards */}
      <div className="grid grid-cols-12 gap-6">

        {/* 1x1 Cell 1: On-time dispatch: 96% */}
        <div 
          id="metric-on-time-dispatch"
          className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white border border-[#E7E5E4] rounded-xl p-6 flex flex-col justify-between h-[180px]"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 block">
              Logistics Performance
            </span>
            <span className="text-3xl font-sora font-semibold text-stone-900 block tracking-tight">
              96%
            </span>
            <p className="text-xs font-medium text-stone-700 leading-tight">
              On-time Dispatch Rate
            </p>
          </div>
          <div className="space-y-2">
            <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#D97706] h-full" style={{ width: "96%" }}></div>
            </div>
            <p className="text-[10px] font-mono text-stone-500">
              Unit-2 target limit: 95% minimum
            </p>
          </div>
        </div>

        {/* 1x1 Cell 2: Doc packs auto-prepared this month: 34 */}
        <div 
          id="metric-auto-prepared"
          className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white border border-[#E7E5E4] rounded-xl p-6 flex flex-col justify-between h-[180px]"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 block">
              Automation Metric
            </span>
            <span className="text-3xl font-sora font-semibold text-[#D97706] block tracking-tight">
              34
            </span>
            <p className="text-xs font-medium text-stone-700 leading-tight">
              Packs Auto-Prepared This Month
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#D97706]">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Spectrometer & CMM linked</span>
          </div>
        </div>

        {/* Notify Customer card (Email/WhatsApp Toggle + message) */}
        <div 
          id="notify-customer-card"
          className="col-span-12 lg:col-span-3 bg-white border border-[#E7E5E4] rounded-xl p-6 flex flex-col justify-between h-[360px] lg:h-auto"
        >
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-[#E7E5E4] pb-2">
              <h3 className="font-sora font-semibold text-sm text-stone-900">
                Notify Customer
              </h3>
              
              {/* Email / WhatsApp Toggle */}
              <div className="flex bg-stone-100 p-0.5 rounded-md border border-[#E7E5E4]">
                <button
                  onClick={() => setNotifType("Email")}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all duration-150 ${
                    notifType === "Email"
                      ? "bg-white text-[#D97706] shadow-xs"
                      : "text-stone-500 hover:text-stone-900"
                  }`}
                >
                  <Mail className="w-3 h-3" />
                  EMAIL
                </button>
                <button
                  onClick={() => setNotifType("WhatsApp")}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all duration-150 ${
                    notifType === "WhatsApp"
                      ? "bg-white text-[#D97706] shadow-xs"
                      : "text-stone-500 hover:text-stone-900"
                  }`}
                >
                  <MessageSquare className="w-3 h-3" />
                  WA
                </button>
              </div>
            </div>

            {selectedOrder ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-mono text-stone-400 uppercase">
                  <span>DRAFT LOG MESSAGE</span>
                  <span className="text-stone-500 font-semibold">{shippingTransitDetails.carrier}</span>
                </div>
                {/* Scrollable message content in JetBrains Mono */}
                <pre className="font-mono text-[10px] bg-stone-50 text-stone-800 p-3 border border-[#E7E5E4] rounded-lg h-[150px] overflow-y-auto whitespace-pre-wrap select-all leading-relaxed">
                  {draftNotificationText}
                </pre>
              </div>
            ) : (
              <p className="text-xs text-stone-400 font-mono text-center py-8">
                Select an order to draft alert.
              </p>
            )}
          </div>

          {selectedOrder && (
            <div className="pt-3 border-t border-[#E7E5E4] flex justify-between items-center gap-2 mt-2">
              <span className="text-[10px] font-mono text-stone-500">
                {selectedShipment?.notified ? "Notification Sent ✓" : "Pending send"}
              </span>
              <button
                onClick={handleSendNotification}
                className="bg-stone-900 hover:bg-stone-800 text-white font-mono text-[11px] font-bold px-3 py-1.5 rounded transition-all flex items-center gap-1.5 uppercase shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                {selectedShipment?.notified ? "Re-send Alert" : "Send Alert"}
              </button>
            </div>
          )}
        </div>

        {/* PIPELINE ACTION Card: Docs complete -> Ship */}
        <div 
          id="pipeline-action-card"
          className="col-span-12 lg:col-span-3 bg-white border border-[#E7E5E4] rounded-xl p-6 flex flex-col justify-between h-[360px] lg:h-auto"
        >
          <div>
            <div className="border-b border-[#E7E5E4] pb-2 mb-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D97706] block">
                Logistics Release Action
              </span>
              <h3 className="font-sora font-semibold text-sm text-stone-900">
                Docs Complete &amp; Dispatched
              </h3>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed font-medium">
              This action will automatically generate all pending export clearance files, compile them into the finalized digital pouch, and transition the order status to <span className="font-bold text-stone-800">SHIP</span> on the main dashboard.
            </p>

            {selectedOrder && (
              <div className="mt-3 bg-stone-50 border border-[#E7E5E4] rounded-lg p-2.5 space-y-1 text-[11px] font-mono">
                <div className="flex justify-between text-stone-700">
                  <span>Selected Order:</span>
                  <span className="font-bold">{selectedOrder.id}</span>
                </div>
                <div className="flex justify-between text-stone-700">
                  <span>Current Stage:</span>
                  <span className="text-amber-700 font-bold uppercase">{selectedOrder.stage}</span>
                </div>
                <div className="flex justify-between text-stone-700">
                  <span>Next Stage:</span>
                  <span className="text-[#D97706] font-bold uppercase">SHIP</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#E7E5E4]">
            <button
              onClick={handleDocsCompleteAndShip}
              disabled={!selectedOrder || selectedOrder.stage === "Ship"}
              className={`w-full py-2.5 rounded font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 uppercase tracking-wide border ${
                !selectedOrder || selectedOrder.stage === "Ship"
                  ? "bg-stone-50 text-stone-400 border-stone-200 cursor-not-allowed"
                  : "bg-[#D97706] hover:bg-[#C2410C] text-white border-transparent hover:shadow-sm"
              }`}
            >
              <FileCheck className="w-4 h-4" />
              {selectedOrder?.stage === "Ship" ? "Already Dispatched" : "Docs complete → Ship"}
            </button>
          </div>
        </div>

      </div>

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDoc && selectedOrder && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#E7E5E4] rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col h-[600px] animate-fade-in-up">
            
            {/* Modal Header */}
            <div className="bg-stone-50 border-b border-[#E7E5E4] px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#D97706]" />
                <span className="font-sora font-semibold text-sm text-stone-900">
                  Document Preview · {previewDoc.docName}
                </span>
              </div>
              <button 
                onClick={() => setPreviewDoc(null)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg border border-[#E7E5E4] bg-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body (Scrollable paper simulation) */}
            <div className="flex-1 overflow-y-auto p-8 bg-[#FAFAF9] flex justify-center">
              <div className="w-full max-w-xl bg-white border border-[#E7E5E4] p-8 shadow-xs rounded flex flex-col justify-between text-stone-800 font-sans leading-relaxed relative min-h-[500px]">
                
                {/* Official Stamp Simulation watermark inside */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border-4 border-[#D97706]/20 text-[#D97706]/20 font-mono text-4xl font-bold uppercase tracking-widest p-4 pointer-events-none select-none rounded rotate-12">
                  SQC VERIFIED
                </div>

                <div>
                  {/* Letterhead */}
                  <div className="border-b-2 border-stone-900 pb-4 text-center">
                    <h1 className="font-sora font-bold text-base text-stone-900 uppercase tracking-tight">
                      Super Quali Cast (India) Pvt. Ltd.
                    </h1>
                    <p className="font-mono text-[9px] text-stone-500 uppercase">
                      Foundry Unit-1 & Machine Shop Unit-2 Shapar · Rajkot-Gondal Highway · Gujarat, India
                    </p>
                  </div>

                  {/* Document Specific Content Rendering */}
                  {previewDoc.docName === "Commercial Invoice" && (
                    <div className="mt-6 space-y-4">
                      <div className="text-center font-mono font-bold text-xs underline uppercase">
                        COMMERCIAL INVOICE
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-[10px] font-mono border-b border-stone-200 pb-3">
                        <div>
                          <p className="font-bold">INVOICE NO: SQC-INV-2026-{selectedOrder.id.split("-").pop()}</p>
                          <p>DATE: 2026-08-04</p>
                          <p>ORIGIN: RAJKOT, INDIA</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">CONSIGNEE:</p>
                          <p className="font-bold">{selectedOrder.customer}</p>
                          <p>{selectedOrder.destination}</p>
                        </div>
                      </div>
                      <table className="w-full text-[10px] font-mono mt-4">
                        <thead>
                          <tr className="border-b border-stone-300 font-bold text-left">
                            <th className="pb-1">ITEM DESCRIPTION</th>
                            <th className="pb-1 text-right">QTY</th>
                            <th className="pb-1 text-right">UNIT PRICE</th>
                            <th className="pb-1 text-right">TOTAL LAKHS</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-stone-100">
                            <td className="py-2">{selectedOrder.part} (PRECISION INVESTMENT CASTING)</td>
                            <td className="py-2 text-right">1 Batch</td>
                            <td className="py-2 text-right">Ex-works</td>
                            <td className="py-2 text-right">Verified</td>
                          </tr>
                        </tbody>
                      </table>
                      <div className="text-[9px] font-mono text-stone-500 pt-4 leading-normal">
                        Note: Goods exported under India-Germany Bilateral Trade framework. Ex-works Rajkot pricing verified under SQC-Q-2026 quotation registry.
                      </div>
                    </div>
                  )}

                  {previewDoc.docName === "Packing List" && (
                    <div className="mt-6 space-y-4">
                      <div className="text-center font-mono font-bold text-xs underline uppercase">
                        EXPORT PACKING LIST &amp; SHIPPING WEIGHT SLIP
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-[10px] font-mono border-b border-stone-200 pb-3">
                        <div>
                          <p className="font-bold">PACKING SLIP: SQC-PL-2026-{selectedOrder.id.split("-").pop()}</p>
                          <p>ORDER REF: {selectedOrder.id}</p>
                          <p>EXPORT GATEWAY: SHAPAR UNIT-2</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">DELIVERY TO:</p>
                          <p className="font-bold">{selectedOrder.customer}</p>
                          <p>{selectedOrder.destination}</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-[10px] font-mono">
                        <p className="font-bold">PACKAGE DIMENSIONS:</p>
                        <div className="bg-stone-50 p-2.5 border border-stone-200 rounded text-[9px] space-y-1">
                          <p>• CASE #001: 1200mm x 1000mm x 850mm (Wooden Crate - Heat Treated ISPM-15)</p>
                          <p>• NET WEIGHT: 482.50 kg</p>
                          <p>• GROSS WEIGHT: 512.00 kg</p>
                          <p>• VOLUME: 1.02 CBM</p>
                        </div>
                      </div>
                      <p className="text-[9px] font-mono text-stone-500">
                        Seaworthy export packaging verified by Lloyd&apos;s surveyor guidelines. Secure steel band locks.
                      </p>
                    </div>
                  )}

                  {previewDoc.docName === "Test Certificate EN 10204 3.1" && (
                    <div className="mt-6 space-y-3">
                      <div className="text-center font-mono font-bold text-xs underline uppercase">
                        MATERIAL TEST CERTIFICATE - EN 10204 3.1
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-[10px] font-mono border-b border-stone-200 pb-2">
                        <div>
                          <p>CERTIFICATE NO: SQC-MTC-2026-9421</p>
                          <p>ORDER REF: {selectedOrder.id}</p>
                          <p>HEAT NUMBER: SQC-2026-HT-942</p>
                        </div>
                        <div className="text-right">
                          <p>MATERIAL ALLOY SPEC:</p>
                          <p className="font-bold text-amber-700">CF8M / ASTM A351 (316 equivalent)</p>
                          <p>QUANTITY TESTED: 100% BATCH</p>
                        </div>
                      </div>

                      {/* Chem composition */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono font-bold uppercase text-stone-500">Chemical Analysis (Spectrometer Readout)</span>
                        <table className="w-full text-[9px] font-mono border border-stone-200 text-center">
                          <thead>
                            <tr className="bg-stone-50 border-b border-stone-200 font-bold">
                              <th>ELEMENT</th>
                              <th>C %</th>
                              <th>Si %</th>
                              <th>Mn %</th>
                              <th>Cr %</th>
                              <th>Ni %</th>
                              <th>Mo %</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-stone-100">
                              <td className="font-bold">SPEC MAX</td>
                              <td>0.08</td>
                              <td>1.50</td>
                              <td>1.50</td>
                              <td>21.0</td>
                              <td>11.0</td>
                              <td>3.00</td>
                            </tr>
                            <tr className="bg-amber-50/50">
                              <td className="font-bold text-[#D97706]">ACTUAL</td>
                              <td>0.034</td>
                              <td>0.92</td>
                              <td>1.14</td>
                              <td>18.42</td>
                              <td>9.15</td>
                              <td>2.24</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Mechanical Analysis */}
                      <div className="space-y-1 pt-1">
                        <span className="text-[9px] font-mono font-bold uppercase text-stone-500">Mechanical Properties (Verified post tempering)</span>
                        <div className="grid grid-cols-3 gap-2 text-[9px] font-mono bg-stone-50 p-2 border border-stone-200 rounded">
                          <div>
                            <p className="font-bold">TENSILE STRENGTH</p>
                            <p className="text-emerald-700">542 MPa (Min 485)</p>
                          </div>
                          <div>
                            <p className="font-bold">YIELD STRENGTH</p>
                            <p className="text-emerald-700">265 MPa (Min 205)</p>
                          </div>
                          <div>
                            <p className="font-bold">HARDNESS</p>
                            <p className="text-emerald-700">175 BHN (Max 210)</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {previewDoc.docName === "PED 97/23/EC Declaration" && (
                    <div className="mt-6 space-y-4">
                      <div className="text-center font-mono font-bold text-xs underline uppercase">
                        EC DECLARATION OF CONFORMITY (DIRECTIVE 97/23/EC)
                      </div>
                      <div className="text-[10px] text-stone-700 space-y-3 font-medium">
                        <p>
                          We hereby declare under our sole responsibility that the pressure-retaining investment casting components manufactured at Super Quali Cast Unit-2, Shapar conform to the essential safety requirements of the <span className="font-bold text-stone-900">Pressure Equipment Directive (PED) 97/23/EC Annex I</span>.
                        </p>
                        <p className="font-mono bg-stone-50 p-2.5 border border-stone-200 rounded text-[9px]">
                          • NOTIFIED BODY: TÜV NORD Systems GmbH (CE 0045)<br />
                          • AUDIT REPORT NO: SQC-PED-2026-EU<br />
                          • COMPONENT MODEL: {selectedOrder.part}<br />
                          • DESIGNATION SPEC: {selectedOrder.id}
                        </p>
                        <p>
                          Casting components undergo 100% visual inspection, hydrostatic pressure simulation tests, and digital material traceability calibration to guarantee compliance under AD 2000-W0.
                        </p>
                      </div>
                    </div>
                  )}

                  {previewDoc.docName === "IBR Certificate" && (
                    <div className="mt-6 space-y-4">
                      <div className="text-center font-mono font-bold text-xs underline uppercase text-amber-800">
                        INDIAN BOILER REGULATIONS (IBR) FORM III-A
                      </div>
                      <div className="space-y-3 text-[10px] font-mono text-stone-700">
                        <p className="font-bold text-stone-900">
                          CERTIFICATE OF MANUFACTURE AND TEST FOR BOILER PARTS
                        </p>
                        <p>
                          Certified that the precision steam valve/boiler castings described under Order <span className="font-bold text-stone-900">{selectedOrder.id}</span> were manufactured by Super Quali Cast under the supervision of Boiler Inspectorate of Gujarat State, complying fully with IBR Act 1950.
                        </p>
                        <div className="bg-stone-50 p-3 border border-stone-200 rounded space-y-1 text-[9px]">
                          <p>• HYDRAULIC PRESSURE APPLIED: 150 kg/cm²</p>
                          <p>• DURATION OF TEST: 30 Minutes (No leakage observed)</p>
                          <p>• INSPECTING OFFICER STAMP: APPROVED (RAJKOT REGION)</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {previewDoc.docName === "Certificate of Origin" && (
                    <div className="mt-6 space-y-4">
                      <div className="text-center font-mono font-bold text-xs underline uppercase">
                        CERTIFICATE OF ORIGIN - EXPORT OF INDIA
                      </div>
                      <div className="space-y-3 text-[10px] font-mono text-stone-700">
                        <p>
                          The undersigned, representing the <span className="font-bold text-stone-900">Rajkot Chamber of Commerce &amp; Industry</span> (RCCI), Rajkot, Gujarat, India, certifies that the precision investment casting components specified under Order ID <span className="font-bold text-[#1C1917]">{selectedOrder.id}</span> are manufactured exclusively in India.
                        </p>
                        <div className="bg-stone-50 p-3 border border-stone-200 rounded text-[9px] space-y-1">
                          <p>• PRODUCER: Super Quali Cast (India) Pvt. Ltd.</p>
                          <p>• COUNTY OF EXPORT: INDIA (RAJKOT PORT/MUNDRA PORT)</p>
                          <p>• DESTINATION: {selectedOrder.destination}</p>
                          <p>• CHAMBER SERIAL: RCCI-IN-2026-984</p>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Sign-off footer */}
                <div className="mt-12 pt-4 border-t border-stone-300 flex justify-between items-end text-[9px] font-mono">
                  <div>
                    <p>SYSTEM LOCATION: SHAPAR UNIT-2</p>
                    <p>VERIFICATION STAMP: DIGITAL KEY</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold uppercase text-stone-900 underline">Savan Chapani</p>
                    <p className="text-stone-500 text-[8px]">LOGISTICS &amp; QA DIRECTOR</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-stone-50 border-t border-[#E7E5E4] px-6 py-4 flex justify-between items-center shrink-0">
              <span className="text-[10px] font-mono text-stone-400">
                Press ESC or click close button to return to command console
              </span>
              <button
                onClick={() => setPreviewDoc(null)}
                className="bg-[#D97706] hover:bg-[#C2410C] text-white font-mono text-xs font-bold px-4 py-2 rounded transition-colors uppercase"
              >
                Close Preview
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
