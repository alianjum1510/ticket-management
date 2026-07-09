"use client";
import { useEffect, useRef, useState } from "react";
import { Plus, LogOut, Ticket, User as UserIcon } from "lucide-react";
import { User } from "@/lib/types";

export default function Header({
  user,
  onNewTicket,
  onLogout,
}: {
  user: User;
  onNewTicket: () => void;
  onLogout: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF0FE]">
          <Ticket size={28} className="text-[#4F46E5]" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold text-[#1F3A4D]">All Tickets</h1>
          <p className="text-sm text-[#5B7C90] mt-1">Manage and track support tickets</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onNewTicket}
          className="flex items-center gap-2 rounded-xl bg-[#3A5A70] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2F4A5D]"
        >
          <Plus size={16} /> New Ticket
        </button>
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="User menu"
            className="rounded-xl border border-[#D9CBB0] p-2.5 text-[#3A5A70] hover:bg-[#EDE3D0]"
          >
            <UserIcon size={16} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-40 rounded-xl border border-[#D9CBB0] bg-white shadow-lg z-10">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-[#3A5A70] hover:bg-[#EDE3D0] rounded-xl"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
