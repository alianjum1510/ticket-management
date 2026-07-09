import { Priority } from "@/lib/types";

const styles: Record<Priority, string> = {
  High: "bg-[#F7D9D5] text-[#B33A2E]",
  Medium: "bg-[#FBE9C9] text-[#A8721A]",
  Low: "bg-[#D9EFD9] text-[#3D7A3D]",
};

export default function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium ${styles[priority]}`}>
      {priority}
    </span>
  );
}
