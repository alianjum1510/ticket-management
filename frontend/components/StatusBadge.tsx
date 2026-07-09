import { Status } from "@/lib/types";

const styles: Record<Status, string> = {
  Open: "bg-blue-100 text-blue-700",
  "In Progress": "bg-amber-100 text-amber-700",
  Resolved: "bg-green-100 text-green-700",
};

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}
