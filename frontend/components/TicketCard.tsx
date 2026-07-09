import { Ticket } from "@/lib/types";
import PriorityBadge from "./PriorityBadge";

export default function TicketCard({
  ticket,
  highlighted = false,
  onSelect,
}: {
  ticket: Ticket;
  highlighted?: boolean;
  onSelect: (ticket: Ticket) => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("ticketId", ticket.id);
      }}
      className="cursor-grab active:cursor-grabbing"
    >
      <button
        onClick={() => onSelect(ticket)}
        className={`block w-full text-left bg-white rounded-xl border p-4 mb-3 transition-all duration-200 ${
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
