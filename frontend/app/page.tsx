"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import FilterBar, { DateSortOrder } from "@/components/FilterBar";
import TicketColumn from "@/components/TicketColumns";
import TicketModal from "@/components/TicketModal";
import CreateTicketModal from "@/components/CreateTicketModal";
import {
  ApiError,
  createTicket,
  deleteTicket,
  getCurrentUser,
  getTicket,
  getTickets,
  logout,
  mapApiTicket,
  statusApiValues,
  updateTicketStatus,
} from "@/lib/api";
import { ApiPriority, Priority, Status, Ticket, User } from "@/lib/types";

export default function Dashboard() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [statusFilter, setStatusFilter] =
    useState<Status | "All">("All");
  const [priorityFilter, setPriorityFilter] =
    useState<Priority | "All">("All");
  const [dateSortOrder, setDateSortOrder] =
    useState<DateSortOrder>("desc");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [draggedTicket, setDraggedTicket] = useState<Ticket | null>(null);
  const [hoveredStatus, setHoveredStatus] = useState<Status | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingTicket, setDeletingTicket] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(search.trim().toLowerCase()),
      300,
    );

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    async function loadUser() {
      try {
        setUser(await getCurrentUser());
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          router.push("/login");
          return;
        }

        setError(
          error instanceof Error ? error.message : "Failed to load user",
        );
        setLoading(false);
      }
    }

    loadUser();
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    async function loadTickets() {
      try {
        const ticketPage = await getTickets({
          search: debouncedSearch || undefined,
          sortBy: "created_at",
          sortOrder: dateSortOrder,
          pageSize: 100,
        });

        if (!cancelled) {
          setTickets(ticketPage.items.map(mapApiTicket));
          setError("");
        }
      } catch (error) {
        if (cancelled) return;

        if (error instanceof ApiError && error.status === 401) {
          router.push("/login");
          return;
        }

        setError(
          error instanceof Error ? error.message : "Failed to load tickets",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTickets();

    return () => {
      cancelled = true;
    };
  }, [dateSortOrder, debouncedSearch, router]);

  async function handleStatusChange(ticketId: string, newStatus: Status) {
    const previousTickets = tickets;
    const previousSelectedTicket = selectedTicket;

    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === ticketId
          ? { ...ticket, status: newStatus }
          : ticket,
      ),
    );
    setSelectedTicket((current) =>
      current && current.id === ticketId
        ? { ...current, status: newStatus }
        : current,
    );

    try {
      const updated = await updateTicketStatus(
        Number(ticketId),
        statusApiValues[newStatus],
      );

      setTickets((current) =>
        current.map((ticket) =>
          ticket.id === ticketId ? mapApiTicket(updated) : ticket,
        ),
      );
      setSelectedTicket((current) =>
        current && current.id === ticketId ? mapApiTicket(updated) : current,
      );
    } catch (error) {
      setTickets(previousTickets);
      setSelectedTicket(previousSelectedTicket);
      setError(
        error instanceof Error
          ? error.message
          : "Could not update ticket",
      );
    }
  }

  async function handleDrop(ticketId: string, newStatus: Status) {
    setDraggedTicket(null);
    setHoveredStatus(null);

    if (!ticketId) return;

    await handleStatusChange(ticketId, newStatus);
  }

  function handleDragEnd() {
    setDraggedTicket(null);
    setHoveredStatus(null);
  }

  async function handleResolve(ticket: Ticket) {
    try {
      const updated = await updateTicketStatus(
        Number(ticket.id),
        statusApiValues["Resolved"],
      );
      const mapped = mapApiTicket(updated);

      setTickets((current) =>
        current.map((item) => (item.id === mapped.id ? mapped : item)),
      );
      setSelectedTicket((current) =>
        current && current.id === mapped.id ? mapped : current,
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not update ticket",
      );
    }
  }

  async function handleCreate(payload: {
    title: string;
    description: string;
    customer_name: string;
    customer_email: string;
    priority: ApiPriority;
  }) {
    setCreating(true);
    setCreateError("");

    try {
      const created = await createTicket(payload);

      setTickets((current) => [mapApiTicket(created), ...current]);
      setCreateOpen(false);
    } catch (error) {
      setCreateError(
        error instanceof Error ? error.message : "Could not create ticket",
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleSelect(ticket: Ticket) {
    setSelectedTicket(ticket);

    try {
      const fresh = await getTicket(Number(ticket.id));

      setSelectedTicket((current) =>
        current && current.id === ticket.id ? mapApiTicket(fresh) : current,
      );
    } catch {
      // Keep showing the data we already have if the refresh fails.
    }
  }

  async function handleDeleteTicket(ticket: Ticket) {
    setDeletingTicket(true);

    try {
      await deleteTicket(Number(ticket.id));
      setTickets((current) =>
        current.filter((item) => item.id !== ticket.id),
      );
      setSelectedTicket(null);
      setError("");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.push("/login");
        return;
      }

      setError(
        error instanceof Error
          ? error.message
          : "Could not delete ticket",
      );
    } finally {
      setDeletingTicket(false);
    }
  }

  const filteredTickets = tickets.filter((ticket) => {
    const matchesStatus =
      statusFilter === "All" || ticket.status === statusFilter;
    const matchesPriority =
      priorityFilter === "All" || ticket.priority === priorityFilter;

    return matchesStatus && matchesPriority;
  });

  const highlightedIds = new Set(
    debouncedSearch ? filteredTickets.map((ticket) => ticket.id) : [],
  );

  if (loading) {
    return <main className="px-2 py-8">Loading tickets...</main>;
  }

  if (!user) {
    return (
      <main className="px-2 py-8">
        <p className="rounded bg-red-50 p-3 text-red-700">
          {error || "Redirecting to login..."}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-2 py-8">
        <Header
          user={user}
          onNewTicket={() => {
            setCreateError("");
            setCreateOpen(true);
          }}
          onLogout={() => {
            logout();
            router.replace("/login");
          }}
        />

        {error && (
          <p className="mb-4 rounded bg-red-50 p-3 text-red-700">
            {error}
          </p>
        )}

        <FilterBar
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          priorityFilter={priorityFilter}
          setPriorityFilter={setPriorityFilter}
          dateSortOrder={dateSortOrder}
          setDateSortOrder={setDateSortOrder}
          search={search}
          setSearch={setSearch}
        />

        <div className="flex gap-4 overflow-x-auto">
          <TicketColumn
            title="Open"
            status="Open"
            tickets={filteredTickets}
            highlightedIds={highlightedIds}
            draggedTicket={draggedTicket}
            hoveredStatus={hoveredStatus}
            onDragStart={setDraggedTicket}
            onDragEnd={handleDragEnd}
            onDragEnter={setHoveredStatus}
            onDragLeave={(status) => {
              setHoveredStatus((current) =>
                current === status ? null : current,
              );
            }}
            onDrop={handleDrop}
            onSelect={handleSelect}
          />
          <TicketColumn
            title="In Progress"
            status="In Progress"
            tickets={filteredTickets}
            highlightedIds={highlightedIds}
            draggedTicket={draggedTicket}
            hoveredStatus={hoveredStatus}
            onDragStart={setDraggedTicket}
            onDragEnd={handleDragEnd}
            onDragEnter={setHoveredStatus}
            onDragLeave={(status) => {
              setHoveredStatus((current) =>
                current === status ? null : current,
              );
            }}
            onDrop={handleDrop}
            onSelect={handleSelect}
          />
          <TicketColumn
            title="Resolved"
            status="Resolved"
            tickets={filteredTickets}
            highlightedIds={highlightedIds}
            draggedTicket={draggedTicket}
            hoveredStatus={hoveredStatus}
            onDragStart={setDraggedTicket}
            onDragEnd={handleDragEnd}
            onDragEnter={setHoveredStatus}
            onDragLeave={(status) => {
              setHoveredStatus((current) =>
                current === status ? null : current,
              );
            }}
            onDrop={handleDrop}
            onSelect={handleSelect}
          />
        </div>
      </div>

      {selectedTicket && (
        <TicketModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onResolve={handleResolve}
          onStatusChange={(newStatus) =>
            handleStatusChange(selectedTicket.id, newStatus)
          }
          onDelete={() => handleDeleteTicket(selectedTicket)}
          deleting={deletingTicket}
        />
      )}

      {createOpen && (
        <CreateTicketModal
          error={createError}
          submitting={creating}
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreate}
        />
      )}
    </main>
  );
}
