import { Ticket, Status } from "@/lib/types";
import TicketCard from "./TicketCard";
import { FileText } from "lucide-react";

const columnBackgrounds: Record<Status, string> = {
  Open: "bg-purple-100/60",
  "In Progress": "bg-yellow-100/60",
  Resolved: "bg-green-100/60",
};

export default function TicketColumn({
  title,
  status,
  tickets,
  highlightedIds,
  onDrop,
  onSelect,
}: {
  title: string;
  status: Status;
  tickets: Ticket[];
  highlightedIds: Set<string>;
  onDrop: (ticketId: string, newStatus: Status) => void;
  onSelect: (ticket: Ticket) => void;
}) {
  const filtered = tickets.filter((t) => t.status === status);

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const ticketId = e.dataTransfer.getData("ticketId");
        onDrop(ticketId, status);
      }}
      className={`${columnBackgrounds[status]} rounded-2xl p-5 flex-1 min-w-[280px] border border-white/50 backdrop-blur-sm`}
    >
      <div className="flex items-center gap-2 mb-5">
        <h2 className="font-semibold text-[#1F3A4D] text-lg">{title}</h2>
        <span className="bg-[#3A5A70] text-white text-xs font-medium w-6 h-6 rounded-full flex items-center justify-center">
          {filtered.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-[#9CA8AF]">
          <FileText size={32} strokeWidth={1.5} className="mb-3 opacity-60" />
          <p className="text-sm">No tickets</p>
        </div>
      ) : (
        filtered.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            highlighted={highlightedIds.has(ticket.id)}
            onSelect={onSelect}
          />
        ))
      )}
    </div>
  );
}
