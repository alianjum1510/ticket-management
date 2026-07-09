import {
  ApiPriority,
  ApiStatus,
  ApiTicket,
  LoginResponse,
  Priority,
  Status,
  Ticket,
  TicketPage,
  User,
} from "./types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof URLSearchParams
        ? { "Content-Type": "application/x-www-form-urlencoded" }
        : options.body
          ? { "Content-Type": "application/json" }
          : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    const detail = error?.detail;
    const message = Array.isArray(detail)
      ? detail
          .map((item: { msg?: string }) => item.msg)
          .filter(Boolean)
          .join(", ")
      : detail;

    throw new ApiError(
      message || `Request failed: ${response.status}`,
      response.status,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export async function login(email: string, password: string) {
  const body = new URLSearchParams({ email, password });

  const result = await apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body,
  });

  localStorage.setItem("access_token", result.access_token);
  return result;
}

export function register(payload: {
  email: string;
  full_name: string;
  password: string;
}) {
  return apiRequest<User>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function logout() {
  localStorage.removeItem("access_token");
}

export function getCurrentUser() {
  return apiRequest<User>("/auth/user-details");
}

export function getTickets(params?: {
  status?: ApiStatus;
  priority?: ApiPriority;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const query = new URLSearchParams();

  if (params?.status) query.set("status", params.status);
  if (params?.priority) query.set("priority", params.priority);
  if (params?.search) query.set("search", params.search);
  if (params?.page) query.set("page", String(params.page));
  if (params?.pageSize) query.set("page_size", String(params.pageSize));

  const suffix = query.size ? `?${query}` : "";
  return apiRequest<TicketPage>(`/tickets${suffix}`);
}

export function getTicket(id: number) {
  return apiRequest<ApiTicket>(`/tickets/${id}`);
}

export function updateTicketStatus(id: number, status: ApiStatus) {
  return apiRequest<ApiTicket>(`/tickets/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function createTicket(payload: {
  title: string;
  description: string;
  customer_name: string;
  customer_email: string;
  priority: ApiPriority;
}) {
  return apiRequest<ApiTicket>("/tickets", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteTicket(id: number) {
  return apiRequest<void>(`/tickets/${id}`, {
    method: "DELETE",
  });
}

const statusLabels: Record<ApiStatus, Status> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
};

const priorityLabels: Record<ApiPriority, Priority> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export function mapApiTicket(ticket: ApiTicket): Ticket {
  return {
    id: String(ticket.id),
    ticketNumber: String(ticket.id),
    title: ticket.title,
    description: ticket.description,
    customerName: ticket.customer_name,
    customerEmail: ticket.customer_email,
    status: statusLabels[ticket.status],
    priority: priorityLabels[ticket.priority],
    createdAt: new Date(ticket.created_at).toLocaleDateString(),
  };
}

export const statusApiValues: Record<Status, ApiStatus> = {
  Open: "open",
  "In Progress": "in_progress",
  Resolved: "resolved",
};