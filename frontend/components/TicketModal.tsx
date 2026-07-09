"use client";
import { useEffect, useState } from "react";
import {
  X,
  Ticket as TicketIcon,
  FileText,
  User,
  ListTodo,
  Flag,
  Calendar,
  Hash,
  Trash2,
} from "lucide-react";
import { Status, Ticket } from "@/lib/types";
import PriorityBadge from "./PriorityBadge";
import StatusBadge from "./StatusBadge";

const statusOptions: Status[] = ["Open", "In Progress", "Resolved"];

export default function TicketModal({
  ticket,
  onClose,
  onResolve,
  onStatusChange,
  onDelete,
  deleting,
}: {
  ticket: Ticket;
  onClose: () => void;
  onResolve: (ticket: Ticket) => void;
  onStatusChange: (status: Status) => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (confirmDeleteOpen) {
          setConfirmDeleteOpen(false);
          return;
        }

        onClose();
      }
    }

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [confirmDeleteOpen, onClose]);

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
                <select
                  value={ticket.status}
                  onChange={(event) =>
                    onStatusChange(event.target.value as Status)
                  }
                  className="rounded-xl border border-[#D8DEE8] bg-[#F8FAFC] px-3 py-2 text-xs font-medium text-[#1E1B4B] outline-none transition focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
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

            <button
              type="button"
              onClick={() => setConfirmDeleteOpen(true)}
              disabled={deleting}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-100/70 px-4 py-3 text-sm font-semibold text-red-700 transition-colors hover:bg-red-200/80 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 size={16} />
              Delete Ticket
            </button>

            {confirmDeleteOpen && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-800">
                  Do you really want to delete this ticket?
                </p>
                <p className="mt-1 text-xs leading-relaxed text-red-600">
                  This action cannot be undone.
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteOpen(false)}
                    disabled={deleting}
                    className="flex-1 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onDelete}
                    disabled={deleting}
                    className="flex-1 rounded-xl bg-red-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-red-300"
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
