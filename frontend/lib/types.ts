export type ApiStatus = "open" | "in_progress" | "resolved";
export type ApiPriority = "low" | "medium" | "high";
export type UserRole = "user" | "admin" | "super_admin";

export interface ApiTicket {
  id: number;
  title: string;
  description: string;
  customer_name: string;
  customer_email: string;
  status: ApiStatus;
  priority: ApiPriority;
  created_at: string;
}

export interface TicketPage {
  items: ApiTicket[];
  total: number;
  page: number;
  page_size: number;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: "bearer";
}

export type Status = "Open" | "In Progress" | "Resolved";
export type Priority = "Low" | "Medium" | "High";

export interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  customerName: string;
  customerEmail: string;
  status: Status;
  priority: Priority;
  createdAt: string;
}