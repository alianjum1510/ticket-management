"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Priority, Status } from "@/lib/types";

type FilterOption<T extends string> = {
  label: string;
  value: T;
};

function FilterDropdown<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: FilterOption<T>[];
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex min-w-[150px] items-center justify-between gap-3 rounded-xl border border-[#D9CBB0] bg-[#FBF6EC] px-4 py-3 text-sm font-medium text-[#1F3A4D] shadow-sm transition-colors hover:bg-[#F6EEDC] focus:outline-none focus:ring-2 focus:ring-[#3A5A70]/30"
      >
        <span>{selected?.label}</span>
        <ChevronDown
          size={16}
          className={`text-[#5B7C90] transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 w-full min-w-[180px] rounded-xl border border-[#D9CBB0] bg-white p-2 shadow-xl">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`w-full rounded-lg px-4 py-2.5 text-left text-sm transition-colors ${
                option.value === value
                  ? "bg-[#EDE3D0] font-medium text-[#1F3A4D]"
                  : "text-[#5B7C90] hover:bg-[#FBF6EC] hover:text-[#1F3A4D]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FilterBar({
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  search,
  setSearch,
}: {
  statusFilter: Status | "All";
  setStatusFilter: (s: Status | "All") => void;
  priorityFilter: Priority | "All";
  setPriorityFilter: (p: Priority | "All") => void;
  search: string;
  setSearch: (s: string) => void;
}) {
  const statusOptions: FilterOption<Status | "All">[] = [
    { label: "All Status", value: "All" },
    { label: "Open", value: "Open" },
    { label: "In Progress", value: "In Progress" },
    { label: "Resolved", value: "Resolved" },
  ];

  const priorityOptions: FilterOption<Priority | "All">[] = [
    { label: "All Priority", value: "All" },
    { label: "Low", value: "Low" },
    { label: "Medium", value: "Medium" },
    { label: "High", value: "High" },
  ];

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <FilterDropdown
        value={statusFilter}
        options={statusOptions}
        onChange={setStatusFilter}
      />

      <FilterDropdown
        value={priorityFilter}
        options={priorityOptions}
        onChange={setPriorityFilter}
      />

      <div className="relative max-w-md flex-1 min-w-[240px]">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5B7C90]"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tickets..."
          className="w-full rounded-xl border border-[#D9CBB0] bg-[#FBF6EC] py-3 pl-11 pr-4 text-sm text-[#1F3A4D] placeholder:text-[#9CA8AF] focus:outline-none focus:ring-2 focus:ring-[#3A5A70]/30"
        />
      </div>
    </div>
  );
}
