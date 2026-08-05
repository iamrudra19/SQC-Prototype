import { 
  LayoutDashboard, 
  Inbox, 
  FileSpreadsheet, 
  Binary, 
  Truck, 
  Lock, 
  RefreshCw,
  X
} from "lucide-react";
import { AppStore } from "../types";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onResetDemo: () => void;
  store: AppStore;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ activeTab, setActiveTab, onResetDemo, store, isOpen, setIsOpen }: SidebarProps) {
  const menuItems = [
    { id: "Command Center", label: "Command Center", icon: LayoutDashboard },
    { id: "Export Inquiry Desk", label: "Export Inquiry Desk", icon: Inbox },
    { id: "RFQ & Costing", label: "RFQ Intake", icon: FileSpreadsheet },
    { id: "CNC Programs", label: "CNC Programs", icon: Binary },
    { id: "Dispatch & Docs", label: "Dispatch & Docs", icon: Truck },
  ];

  const certificationBadges = [
    "ISO 9001:2015",
    "ISO 14001",
    "ISO 45001",
    "PED 97/23/EC",
    "IBR",
    "AD 2000-W0"
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-30 lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside 
        id="sqc-sidebar"
        className={`w-[280px] h-screen bg-white border-r border-[#E7E5E4] flex flex-col fixed left-0 top-0 z-40 flex-shrink-0 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Mobile close drawer button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute right-4 top-4 p-1.5 rounded-md border border-stone-200 text-stone-500 hover:bg-stone-50 lg:hidden cursor-pointer"
          title="Close navigation menu"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Sidebar Header Lockup */}
        <div className="p-6 space-y-4">
        <div className="flex items-start gap-3">
          {/* Amber square tile "SQC" */}
          <div className="w-10 h-10 bg-[#D97706] text-white flex-shrink-0 flex items-center justify-center rounded font-bold text-xs tracking-tighter">
            SQC
          </div>
          <div className="flex flex-col">
            {/* Wordmark */}
            <span className="font-bold text-[14px] leading-tight text-[#1C1917] uppercase tracking-tight">
              SUPER QUALI CAST
            </span>
            <span className="text-[10px] text-[#79716B] leading-tight mt-1 uppercase tracking-tight">
              Investment Castings · Rajkot · Unit-2 Shapar Machine Shop
            </span>
          </div>
        </div>

        {/* Accreditations bar */}
        <div className="flex flex-wrap gap-1 py-3 border-y border-[#E7E5E4]">
          <span className="font-mono text-[9px] text-[#79716B] uppercase tracking-tighter leading-normal">
            ISO 9001:2015 · ISO 14001 · ISO 45001 · PED 97/23/EC · IBR · AD 2000-W0
          </span>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1 mt-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isRfq = item.id === "RFQ & Costing";
            const pendingRfqsCount = isRfq ? store.rfqs.filter(r => r.status === "Pending").length : 0;
            const isCnc = item.id === "CNC Programs";
            const cncCount = isCnc ? store.orders.filter(o => o.stage === "Machine").length : 0;
            
            return (
              <button
                key={item.id}
                id={`nav-${item.id.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[14px] font-medium transition-all duration-150 text-left border ${
                  isActive 
                    ? "bg-[#FAFAF9] border-[#E7E5E4] text-[#D97706]" 
                    : "text-[#79716B] hover:text-[#1C1917] border-transparent"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {isActive ? (
                    <div className="w-1.5 h-1.5 bg-[#D97706] rounded-full shrink-0 animate-pulse" />
                  ) : (
                    <Icon className="w-4 h-4 shrink-0 text-[#79716B]" />
                  )}
                  <span className="truncate">{item.label}</span>
                </div>
                {isRfq && pendingRfqsCount > 0 && (
                  <span className="bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full shrink-0">
                    {pendingRfqsCount}
                  </span>
                )}
                {isCnc && cncCount > 0 && (
                  <span className="bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full shrink-0">
                    {cncCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Pilot Features Section */}
        <div className="pt-6 space-y-2">
          <span className="text-[11px] font-bold text-[#79716B] uppercase tracking-wider px-3 block">
            Pilot Features
          </span>
          <div className="space-y-1">
            <div 
              className="px-3 py-2 text-[14px] text-[#A8A29E] flex items-center gap-2 cursor-not-allowed"
              title="Available in pilot phase"
            >
              CMM Inspection Programs 🔒
            </div>

            <div 
              className="px-3 py-2 text-[14px] text-[#A8A29E] flex items-center gap-2 cursor-not-allowed"
              title="Available in pilot phase"
            >
              PPC Status Agent 🔒
            </div>
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="mt-auto p-6 border-t border-[#E7E5E4] space-y-4">
        {/* Reset Demo Button */}
        <button
          id="btn-reset-demo"
          onClick={onResetDemo}
          className="w-full text-left px-3 py-2 text-[12px] text-[#79716B] hover:bg-[#FAFAF9] rounded-md border border-transparent hover:border-[#E7E5E4] transition-all cursor-pointer"
        >
          Reset demo
        </button>
      </div>
    </aside>
    </>
  );
}
