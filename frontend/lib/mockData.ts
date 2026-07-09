import { Ticket } from "./types";

export const mockTickets: Ticket[] = [
  {
    id: "1",
    ticketNumber: "#1001",
    title: "Login issue on mobile app",
    description: "User is unable to log in using the mobile app. Getting a spinner that never resolves.",
    customerName: "Sarah Johnson",
    customerEmail: "sarah.johnson@example.com",
    status: "Open",
    priority: "High",
    createdAt: "2026-07-01",
  },
  {
    id: "2",
    ticketNumber: "#1002",
    title: "Unable to reset password",
    description: "Password reset email never arrives.",
    customerName: "Michael Brown",
    customerEmail: "michael.brown@example.com",
    status: "In Progress",
    priority: "Medium",
    createdAt: "2026-07-02",
  },
  {
    id: "3",
    ticketNumber: "#1003",
    title: "Update terms and conditions",
    description: "Legal asked to update the T&C page with new clauses.",
    customerName: "Grace Hall",
    customerEmail: "grace.hall@example.com",
    status: "Resolved",
    priority: "Low",
    createdAt: "2026-06-28",
  },
  // add a few more so each column has 2-3 cards
];