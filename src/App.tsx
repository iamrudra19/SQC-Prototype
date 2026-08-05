import { useState, useEffect } from "react";
import { AppStore } from "./types";
import { getStore, saveStore, resetStore } from "./store";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import CommandCenter from "./components/CommandCenter";
import InquiryDesk from "./components/InquiryDesk";
import RfqCosting from "./components/RfqCosting";
import CncPrograms from "./components/CncPrograms";
import DispatchDocs from "./components/DispatchDocs";
import { Bell, Info, ShieldCheck } from "lucide-react";

interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "info" | "warning";
}

export default function App() {
  const [store, setStore] = useState<AppStore>(() => getStore());
  const [activeTab, setActiveTab] = useState<string>("Command Center");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Function to trigger a toast notification
  const addToast = (message: string, type: "success" | "info" | "warning" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  // Auto-remove toasts after 3 seconds
  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        setToasts((prev) => prev.slice(1));
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toasts]);

  // Handle updating the store globally and showing relevant toast
  const handleUpdateStore = (newStore: AppStore) => {
    setStore(newStore);
    saveStore(newStore);
    
    // Auto-detect last event and toast it
    if (newStore.events.length > 0) {
      const lastEvent = newStore.events[0];
      // Avoid toasting on system clear
      if (lastEvent.message.includes("cleared")) {
        addToast(lastEvent.message, "warning");
      } else {
        addToast(lastEvent.message, "success");
      }
    }
  };

  // Reset demo store handler
  const handleResetDemo = () => {
    const freshStore = resetStore();
    setStore(freshStore);
    addToast("Command Center store reset successfully.", "info");
  };

  // Synchronize on load
  useEffect(() => {
    const currentStore = getStore();
    setStore(currentStore);
  }, []);

  return (
    <div id="sqc-app-container" className="min-h-screen bg-[#FAFAF9] text-[#1C1917] font-sans antialiased">
      
      {/* Light Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsSidebarOpen(false); // Close sidebar automatically on mobile selection
          addToast(`Switched pipeline view to ${tab}`, "info");
        }} 
        onResetDemo={handleResetDemo}
        store={store}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Main Panel */}
      <div className="lg:pl-[280px] min-h-screen flex flex-col">
        {/* Top bar */}
        <Topbar 
          activeTab={activeTab} 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          onMenuToggle={() => setIsSidebarOpen(true)}
        />

        {/* Content Area with custom padding & gutters */}
        <main className="flex-1 p-4 md:p-8 pt-20 md:pt-24 max-w-7xl w-full mx-auto space-y-6 overflow-x-hidden">
          
          {/* Active view renderer */}
          {activeTab === "Command Center" && (
            <CommandCenter 
              store={store} 
              onUpdateStore={handleUpdateStore} 
              searchQuery={searchQuery}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === "Export Inquiry Desk" && (
            <InquiryDesk 
              store={store} 
              searchQuery={searchQuery}
              onUpdateStore={handleUpdateStore}
            />
          )}

          {activeTab === "RFQ & Costing" && (
            <RfqCosting 
              store={store} 
              searchQuery={searchQuery}
              onUpdateStore={handleUpdateStore}
            />
          )}

          {activeTab === "CNC Programs" && (
            <CncPrograms 
              store={store} 
              searchQuery={searchQuery}
              onUpdateStore={handleUpdateStore}
              addToast={addToast}
            />
          )}

          {activeTab === "Dispatch & Docs" && (
            <DispatchDocs 
              store={store} 
              searchQuery={searchQuery}
              onUpdateStore={handleUpdateStore}
            />
          )}

        </main>
      </div>

      {/* Toast Notification Container (bottom-right) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((toast) => {
          let typeClasses = "bg-white border-stone-200 text-stone-900";
          let Icon = Info;
          if (toast.type === "success") {
            typeClasses = "bg-emerald-50 border-emerald-200 text-emerald-950";
            Icon = ShieldCheck;
          } else if (toast.type === "warning") {
            typeClasses = "bg-red-50 border-red-200 text-red-950";
            Icon = Bell;
          }

          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all duration-300 transform translate-y-0 animate-fade-in-up ${typeClasses}`}
            >
              <Icon className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-400">
                  Pipeline Notification
                </span>
                <p className="text-xs font-sans font-medium leading-relaxed">
                  {toast.message}
                </p>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
