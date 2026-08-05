import { useEffect, useState } from "react";
import { Menu } from "lucide-react";

interface TopbarProps {
  activeTab: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onMenuToggle?: () => void;
}

export default function Topbar({ activeTab, searchQuery, setSearchQuery, onMenuToggle }: TopbarProps) {
  const [istTime, setIstTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      // Calculate IST (UTC + 5:30)
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const istOffset = 5.5 * 3600000;
      const istDate = new Date(utc + istOffset);

      const hours = String(istDate.getHours()).padStart(2, "0");
      const minutes = String(istDate.getMinutes()).padStart(2, "0");
      const seconds = String(istDate.getSeconds()).padStart(2, "0");
      
      setIstTime(`${hours}:${minutes}:${seconds} IST`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header 
      id="sqc-topbar"
      className="h-16 bg-white border-b border-[#E7E5E4] flex items-center justify-between px-4 md:px-8 fixed top-0 right-0 left-0 lg:left-[280px] z-10"
    >
      {/* Title & Menu Toggle */}
      <div className="flex items-center gap-3 min-w-0">
        <button 
          onClick={onMenuToggle}
          className="p-1.5 rounded-md border border-[#E7E5E4] hover:bg-stone-50 text-stone-600 lg:hidden shrink-0 cursor-pointer"
          title="Toggle navigation sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-[16px] md:text-[20px] font-bold tracking-tight font-serif text-[#1C1917] truncate">
          SQC {activeTab}
        </h1>
      </div>

      {/* Persistent Search and Clock / User Info */}
      <div className="flex items-center gap-2 sm:gap-4 md:gap-6 shrink-0">
        {/* Search input - hidden on very small devices, compact on tablets */}
        <div className="relative hidden sm:block">
          <input
            id="persistent-search"
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-32 md:w-48 lg:w-64 bg-[#FAFAF9] border border-[#E7E5E4] rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#D97706] text-[#1C1917] placeholder-stone-400"
          />
        </div>

        {/* Live IST clock */}
        <div className="font-mono text-[11px] md:text-[13px] text-[#79716B] tracking-wider tabular-nums bg-stone-50 px-2 py-1 rounded border border-stone-200/50">
          {istTime || "00:00:00 IST"}
        </div>

        {/* User Chip */}
        <div 
          id="user-chip"
          className="flex items-center gap-2 bg-[#FAFAF9] border border-[#E7E5E4] rounded-full py-0.5 md:py-1 pl-1 pr-1.5 md:pr-4"
        >
          <div className="w-6 h-6 md:w-7 md:h-7 bg-[#D97706] rounded-full flex items-center justify-center text-white text-[9px] md:text-[10px] font-bold shrink-0">
            SC
          </div>
          <span className="text-[11px] md:text-sm font-medium text-[#1C1917] hidden xs:inline max-w-[100px] truncate">
            Savan C.
          </span>
        </div>
      </div>
    </header>
  );
}
