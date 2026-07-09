import { Ticket, Status } from "@/lib/types";
import TicketCard from "./TicketCard";
import { CheckCircle2, Clock, FileText, Inbox } from "lucide-react";

const columnBackgrounds: Record<Status, string> = {
  Open: "bg-purple-100/60",
  "In Progress": "bg-yellow-100/60",
  Resolved: "bg-green-100/60",
};

const columnIcons = {
  Open: Inbox,
  "In Progress": Clock,
  Resolved: CheckCircle2,
};

export default function TicketColumn({
  title,
  status,
  tickets,
  highlightedIds,
  draggedTicket,
  hoveredStatus,
  onDragStart,
  onDragEnd,
  onDragEnter,
  onDragLeave,
  onDrop,
  onSelect,
}: {
  title: string;
  status: Status;
  tickets: Ticket[];
  highlightedIds: Set<string>;
  draggedTicket: Ticket | null;
  hoveredStatus: Status | null;
  onDragStart: (ticket: Ticket) => void;
  onDragEnd: () => void;
  onDragEnter: (status: Status) => void;
  onDragLeave: (status: Status) => void;
  onDrop: (ticketId: string, newStatus: Status) => void;
  onSelect: (ticket: Ticket) => void;
}) {
  const filtered = tickets.filter((t) => t.status === status);
  const Icon = columnIcons[status];
  const isDragTarget =
    Boolean(draggedTicket) &&
    hoveredStatus === status &&
    draggedTicket?.status !== status;
  const isDragActive = Boolean(draggedTicket);

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        onDragEnter(status);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        onDragEnter(status);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          onDragLeave(status);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        const ticketId = e.dataTransfer.getData("ticketId");
        onDrop(ticketId, status);
      }}
      className={`${columnBackgrounds[status]} min-w-[280px] flex-1 rounded-2xl border p-5 backdrop-blur-sm transition-all duration-200 ${
        isDragTarget
          ? "scale-[1.01] border-[#3A5A70]/50 shadow-xl shadow-[#3A5A70]/10 ring-2 ring-[#3A5A70]/20"
          : "border-white/50"
      }`}
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/60 text-[#3A5A70]">
          <Icon size={17} />
        </div>
        <h2 className="font-semibold text-[#1F3A4D] text-lg">{title}</h2>
        <span className="bg-[#3A5A70] text-white text-xs font-medium w-6 h-6 rounded-full flex items-center justify-center">
          {filtered.length}
        </span>
      </div>

      {isDragTarget && (
        <div className="mb-3 flex min-h-[118px] animate-pulse items-center justify-center rounded-xl border-2 border-dashed border-[#3A5A70]/40 bg-white/50 text-sm font-semibold text-[#3A5A70] shadow-inner transition-all duration-200">
          Drop here
        </div>
      )}

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
            dragging={draggedTicket?.id === ticket.id}
            isDragActive={isDragActive}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onSelect={onSelect}
          />
        ))
      )}
    </div>
  );
}
