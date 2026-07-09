"use client";

import { FormEvent, useEffect, useState } from "react";
import { LoaderCircle, X } from "lucide-react";
import { ApiPriority } from "@/lib/types";

const priorities: ApiPriority[] = ["low", "medium", "high"];

export default function CreateTicketModal({
  submitting,
  onClose,
  onSubmit,
}: {
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    title: string;
    description: string;
    customer_name: string;
    customer_email: string;
    priority: ApiPriority;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [priority, setPriority] = useState<ApiPriority>("low");

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !submitting) onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, submitting]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      customer_name: customerName.trim(),
      customer_email: customerEmail.trim(),
      priority,
    });
  }

  const inputClasses =
    "w-full rounded-xl border border-[#D8DEE8] bg-white px-4 py-4 text-sm text-[#1F3A4D] shadow-sm outline-none transition focus:border-[#3D51FF] focus:ring-4 focus:ring-[#3D51FF]/10 placeholder:text-[#91A0B8]";

  return (
    <div
      onClick={() => {
        if (!submitting) onClose();
      }}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#1F2937]/35 px-4 py-8 backdrop-blur-sm"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Create new ticket"
        className="relative w-full max-w-5xl rounded-b-3xl rounded-t-xl bg-white px-8 py-7 shadow-2xl sm:px-12"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          aria-label="Close create ticket modal"
          className="absolute right-5 top-5 rounded-xl p-2 text-[#5B7C90] transition-colors hover:bg-[#F1F5F9] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X size={20} />
        </button>

        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[#102A43]">
            Create New Ticket
          </h2>
          <p className="mt-3 text-base font-medium text-[#7A8DA8]">
            Fill in the details to create a support request
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="ticket-title"
              className="mb-2 block text-sm font-semibold text-[#263B53]"
            >
              Title
            </label>
            <input
              id="ticket-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="string"
              required
              maxLength={200}
              className={inputClasses}
            />
          </div>

          <div>
            <label
              htmlFor="ticket-description"
              className="mb-2 block text-sm font-semibold text-[#263B53]"
            >
              Description
            </label>
            <textarea
              id="ticket-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="string"
              required
              rows={5}
              className={`${inputClasses} resize-y leading-relaxed`}
            />
          </div>

          <div>
            <label
              htmlFor="ticket-customer-name"
              className="mb-2 block text-sm font-semibold text-[#263B53]"
            >
              Customer Name
            </label>
            <input
              id="ticket-customer-name"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="string"
              required
              maxLength={120}
              className={inputClasses}
            />
          </div>

          <div>
            <label
              htmlFor="ticket-customer-email"
              className="mb-2 block text-sm font-semibold text-[#263B53]"
            >
              Customer Email
            </label>
            <input
              id="ticket-customer-email"
              type="email"
              value={customerEmail}
              onChange={(event) => setCustomerEmail(event.target.value)}
              placeholder="user@example.com"
              required
              className={inputClasses}
            />
          </div>

          <div>
            <label
              htmlFor="ticket-priority"
              className="mb-2 block text-sm font-semibold text-[#263B53]"
            >
              Priority
            </label>
            <select
              id="ticket-priority"
              value={priority}
              onChange={(event) => setPriority(event.target.value as ApiPriority)}
              className={`${inputClasses} appearance-auto capitalize`}
            >
              {priorities.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center rounded-xl bg-[#3046FF] px-6 py-4 text-base font-semibold text-white shadow-lg shadow-[#3046FF]/25 transition-colors hover:bg-[#2637D8] disabled:cursor-not-allowed disabled:bg-[#8D98FF]"
          >
            {submitting ? (
              <LoaderCircle size={22} className="animate-spin" />
            ) : (
              "Create Ticket"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
