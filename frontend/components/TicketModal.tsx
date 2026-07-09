"use client";
import { useEffect } from "react";
import {
  X,
  Ticket as TicketIcon,
  FileText,
  User,
  ListTodo,
  Flag,
  Calendar,
  Hash,
  CheckCircle2,
} from "lucide-react";
import { Ticket } from "@/lib/types";
import PriorityBadge from "./PriorityBadge";
import StatusBadge from "./StatusBadge";

export default function TicketModal({
  ticket,
  onClose,
  onResolve,
}: {
  ticket: Ticket;
  onClose: () => void;
  onResolve: (ticket: Ticket) => void;
}) {
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/50 p-4"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={ticket.title}
        className="w-full max-w-4xl rounded-3xl bg-[#F4F3FB] p-5 shadow-2xl"
      >
        <div className="flex flex-col gap-5 md:flex-row">
          {/* Main panel */}
          <div className="flex-1 rounded-2xl bg-white p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EEF0FE]">
                  <TicketIcon size={24} className="text-[#4F46E5]" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-[#1E1B4B]">
                    {ticket.title}
                  </h2>
                  <div className="mt-2 flex items-center gap-2">
                    <StatusBadge status={ticket.status} />
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                </div>
              </div>
          
  
            </div>

            <div className="border-t border-[#ECEBF6] pt-5">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF0FE]">
                  <FileText size={16} className="text-[#4F46E5]" />
                </div>
                <h3 className="font-semibold text-[#1E1B4B]">Description</h3>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#4B5563]">
                {ticket.description || "No description provided."}
              </p>
            </div>

            <div className="mt-6 border-t border-[#ECEBF6] pt-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF0FE]">
                  <User size={16} className="text-[#4F46E5]" />
                </div>
                <h3 className="font-semibold text-[#1E1B4B]">
                  Customer Details
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm lg:grid-cols-4">
                <div>
                  <p className="mb-1 text-xs text-[#9CA3AF]">Customer Name</p>
                  <p className="text-[#1E1B4B]">{ticket.customerName}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-[#9CA3AF]">Email</p>
                  <a
                    href={`mailto:${ticket.customerEmail}`}
                    className="break-all text-[#4F46E5] hover:underline"
                  >
                    {ticket.customerEmail}
                  </a>
                </div>
                <div>
                  <p className="mb-1 text-xs text-[#9CA3AF]">Ticket ID</p>
                  <p className="text-[#1E1B4B]">#{ticket.ticketNumber}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-[#9CA3AF]">Created Date</p>
                  <p className="text-[#1E1B4B]">{ticket.createdAt}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Details sidebar */}
          <div className="w-full shrink-0 rounded-2xl bg-white p-6 md:w-64">
            <div className="mb-2 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <ListTodo size={18} className="text-[#4F46E5]" />
                <h3 className="font-semibold text-[#1E1B4B]">Details</h3>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="rounded-lg p-1.5 text-[#6B7280] hover:bg-[#EEF0FE]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="divide-y divide-[#ECEBF6] text-sm">
              <div className="flex items-center justify-between gap-2 py-4">
                <span className="flex items-center gap-2 text-[#6B7280]">
                  <ListTodo size={15} /> Status
                </span>
                <StatusBadge status={ticket.status} />
              </div>
              <div className="flex items-center justify-between gap-2 py-4">
                <span className="flex items-center gap-2 text-[#6B7280]">
                  <Flag size={15} /> Priority
                </span>
                <PriorityBadge priority={ticket.priority} />
              </div>
              <div className="flex items-center justify-between gap-2 py-4">
                <span className="flex items-center gap-2 text-[#6B7280]">
                  <Calendar size={15} /> Created
                </span>
                <span className="text-[#1E1B4B]">{ticket.createdAt}</span>
              </div>
              <div className="flex items-center justify-between gap-2 py-4">
                <span className="flex items-center gap-2 text-[#6B7280]">
                  <Hash size={15} /> Ticket
                </span>
                <span className="text-[#1E1B4B]">#{ticket.ticketNumber}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
