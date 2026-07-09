import { Ticket } from "@/lib/types";
import PriorityBadge from "./PriorityBadge";

export default function TicketCard({
  ticket,
  highlighted = false,
  dragging = false,
  isDragActive = false,
  onDragStart,
  onDragEnd,
  onSelect,
}: {
  ticket: Ticket;
  highlighted?: boolean;
  dragging?: boolean;
  isDragActive?: boolean;
  onDragStart: (ticket: Ticket) => void;
  onDragEnd: () => void;
  onSelect: (ticket: Ticket) => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("ticketId", ticket.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart(ticket);
      }}
      onDragEnd={onDragEnd}
      className={`relative mb-3 cursor-grab transition-all duration-200 ease-out active:cursor-grabbing ${
        dragging ? "min-h-[118px]" : ""
      } ${isDragActive && !dragging ? "translate-y-1" : ""}`}
    >
      {dragging && (
        <div className="absolute inset-0 rounded-xl border-2 border-dashed border-[#3A5A70]/35 bg-white/35" />
      )}

      <button
        onClick={() => onSelect(ticket)}
        className={`block w-full rounded-xl border bg-white p-4 text-left transition-all duration-200 ease-out ${
          dragging
            ? "pointer-events-none -translate-y-2 rotate-1 scale-[1.02] border-[#3A5A70]/40 opacity-60 shadow-2xl shadow-[#3A5A70]/25 ring-2 ring-[#3A5A70]/20"
            : ""
        } ${
          highlighted
            ? "-translate-y-1.5 scale-[1.03] border-[#3A5A70] shadow-lg ring-2 ring-[#3A5A70]/30"
            : "border-[#E4DAC4] hover:shadow-md"
        }`}
      >
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-[#1F3A4D] text-sm leading-snug pr-2">
            {ticket.title}
          </h3>
          <PriorityBadge priority={ticket.priority} />
        </div>
        <p className="text-xs text-[#6B7F8C] mb-3">Customer: {ticket.customerName}</p>
        <div className="flex justify-between items-center text-xs text-[#9CA8AF]">
          <span>#{ticket.ticketNumber.replace("#", "")}</span>
          <span>{ticket.createdAt}</span>
        </div>
      </button>
    </div>
  );
}
