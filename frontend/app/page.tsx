"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import FilterBar, { DateSortOrder } from "@/components/FilterBar";
import TicketColumn from "@/components/TicketColumns";
import TicketModal from "@/components/TicketModal";
import CreateTicketModal from "@/components/CreateTicketModal";
import ToastContainer, { ToastMessage } from "@/components/Toast";
import { LoaderCircle } from "lucide-react";
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

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

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
  const [creating, setCreating] = useState(false);
  const [deletingTicket, setDeletingTicket] = useState(false);
  const [updatingStatusTicketId, setUpdatingStatusTicketId] =
    useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const showToast = useCallback(
    (type: ToastMessage["type"], message: string) => {
    const id = Date.now();

    setToasts((current) => [...current, { id, type, message }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3500);
    },
    [],
  );

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

        showToast("error", getErrorMessage(error, "Failed to load user"));
        setLoading(false);
      }
    }

    loadUser();
  }, [router, showToast]);

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
        }
      } catch (error) {
        if (cancelled) return;

        if (error instanceof ApiError && error.status === 401) {
          router.push("/login");
          return;
        }

        showToast("error", getErrorMessage(error, "Failed to load tickets"));
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
  }, [dateSortOrder, debouncedSearch, router, showToast]);

  async function handleStatusChange(ticketId: string, newStatus: Status) {
    const previousTickets = tickets;
    const previousSelectedTicket = selectedTicket;
    const currentTicket = tickets.find((ticket) => ticket.id === ticketId);

    if (currentTicket?.status === newStatus) return;

    setUpdatingStatusTicketId(ticketId);

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
      showToast("success", "Ticket status updated successfully.");
    } catch (error) {
      setTickets(previousTickets);
      setSelectedTicket(previousSelectedTicket);
      showToast("error", getErrorMessage(error, "Could not update ticket"));
    } finally {
      setUpdatingStatusTicketId(null);
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

  async function handleCreate(payload: {
    title: string;
    description: string;
    customer_name: string;
    customer_email: string;
    priority: ApiPriority;
  }) {
    setCreating(true);

    try {
      const created = await createTicket(payload);

      setTickets((current) => [mapApiTicket(created), ...current]);
      setCreateOpen(false);
      showToast("success", "Ticket created successfully.");
    } catch (error) {
      showToast("error", getErrorMessage(error, "Could not create ticket"));
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
      showToast("success", "Ticket deleted successfully.");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.push("/login");
        return;
      }

      showToast("error", getErrorMessage(error, "Could not delete ticket"));
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
    return (
      <main className="grid min-h-screen place-items-center bg-white">
        <LoaderCircle size={34} className="animate-spin text-[#4F46E5]" />
        <ToastContainer
          toasts={toasts}
          onDismiss={(id) =>
            setToasts((current) =>
              current.filter((toast) => toast.id !== id),
            )
          }
        />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center bg-white">
        <LoaderCircle size={34} className="animate-spin text-[#4F46E5]" />
        <ToastContainer
          toasts={toasts}
          onDismiss={(id) =>
            setToasts((current) =>
              current.filter((toast) => toast.id !== id),
            )
          }
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-2 py-8">
        <Header
          onNewTicket={() => {
            setCreateOpen(true);
          }}
          onLogout={() => {
            logout();
            router.replace("/login");
          }}
        />

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
          onStatusChange={(newStatus) =>
            handleStatusChange(selectedTicket.id, newStatus)
          }
          onDelete={() => handleDeleteTicket(selectedTicket)}
          updatingStatus={updatingStatusTicketId === selectedTicket.id}
          deleting={deletingTicket}
        />
      )}

      {createOpen && (
        <CreateTicketModal
          submitting={creating}
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreate}
        />
      )}

      <ToastContainer
        toasts={toasts}
        onDismiss={(id) =>
          setToasts((current) =>
            current.filter((toast) => toast.id !== id),
          )
        }
      />
    </main>
  );
}
