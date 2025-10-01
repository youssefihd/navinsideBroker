// clency-frontend/src/pages/LostLoads.tsx

import { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import { Eye, AlertCircle, Loader2, Search, Filter } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { DataTable } from "@/components/common/DataTable";

interface LoadSummary {
  id: number;
  loadId: number;
  clientName: string;
  pickupDate: string | null;
  deliveryDate: string | null;
  status: string; // expected: "LOST"
  cost?: number;
  price?: number;
  profit?: number;
}

/* -----------------------------
   Small UI helpers
------------------------------ */
function StatusBadge({ status }: { status: string }) {
  const isLost = status?.toUpperCase() === "LOST";
  const cls = isLost
    ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
    : "bg-gray-100 text-gray-700 ring-1 ring-gray-200";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}

function DateCell({ value }: { value: string | null }) {
  if (!value) return <span className="text-gray-400">-</span>;
  const d = new Date(value);
  return (
    <div className="flex flex-col">
      <span className="font-medium">{format(d, "yyyy-MM-dd")}</span>
      <span className="text-xs text-gray-500">{formatDistanceToNow(d, { addSuffix: true })}</span>
    </div>
  );
}

function MoneyCell({ value }: { value?: number }) {
  if (value == null) return <span className="text-gray-400">-</span>;
  const display = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(value);
  return <span className="tabular-nums">{display}</span>;
}

/* -----------------------------
   Global toolbar for this page
------------------------------ */
const STATUS_FILTERS = ["All", "LOST"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function Toolbar({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
}: {
  search: string;
  setSearch: (v: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (v: StatusFilter) => void;
}) {
  return (
    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative max-w-md">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search client or load ID…"
          className="w-full rounded-md border px-9 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden items-center gap-1 text-sm text-gray-500 sm:inline-flex">
          <Filter className="h-4 w-4" /> Status
        </span>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => {
            const active = statusFilter === s;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition ${
                  active ? "bg-blue-600 text-white ring-blue-600" : "bg-white text-gray-700 ring-gray-200 hover:bg-gray-50"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* -----------------------------
   TableSection wrapper
   - Caps visible rows to 7
   - Sticky thead
------------------------------ */
function TableSection({
  title,
  count,
  children,
  empty,
}: {
  title: string;
  count: number;
  children: React.ReactNode; // should render a <table> inside (DataTable)
  empty?: React.ReactNode;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    const compute = () => {
      const thead = box.querySelector("thead") as HTMLElement | null;
      const firstRow = box.querySelector("tbody tr") as HTMLElement | null;
      const headH = thead ? thead.getBoundingClientRect().height : 44;
      const rowH = firstRow ? firstRow.getBoundingClientRect().height : 52;
      const cap = headH + rowH * 7; // header + 7 body rows
      setMaxHeight(Math.ceil(cap));
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="rounded-lg border bg-white">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700">{count}</span>
      </div>

      <div
        ref={boxRef}
        className="table-sticky overflow-y-auto px-2 sm:px-3"
        style={maxHeight ? { maxHeight } : undefined}
      >
        {children}
      </div>

      {count === 0 && <div className="px-4 pb-4">{empty}</div>}
    </div>
  );
}

/* -----------------------------
   Async UX helpers
------------------------------ */
function EmptyTable({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-dashed bg-white p-6 text-sm text-gray-500">
      <AlertCircle className="h-4 w-4 text-gray-400" />
      No {label.toLowerCase()} to display.
    </div>
  );
}

function ErrorBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-md border bg-white p-4">
      <div className="flex items-center gap-2 text-sm text-rose-700">
        <AlertCircle className="h-4 w-4" />
        <span>{message}</span>
      </div>
      <button
        onClick={onRetry}
        className="rounded-md bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700"
      >
        Retry
      </button>
    </div>
  );
}

function LoadingBlock() {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-white p-4 text-sm text-gray-600">
      <Loader2 className="h-4 w-4 animate-spin" />
      Loading loads…
    </div>
  );
}

/* -----------------------------
   Main component
------------------------------ */
const LostLoadsTable = () => {
  const navigate = useNavigate();
  const [allLost, setAllLost] = useState<LoadSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // local filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("LOST");

  const fetchLostLoads = async (signal?: AbortSignal) => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.get("/loads/loads/summary", { signal });
      const all: LoadSummary[] = res.data ?? [];
      const filtered = all.filter((l) => (l.status ?? "").toUpperCase() === "LOST");
      setAllLost(filtered);
    } catch (err: any) {
      if (err?.name !== "CanceledError" && err?.message !== "canceled") {
        setError("Failed to fetch loads. Please try again.");
        console.error("Failed to fetch loads", err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchLostLoads(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allLost.filter((l) => {
      const matchesQuery =
        !q || l.clientName.toLowerCase().includes(q) || String(l.loadId ?? l.id).includes(q);
      const matchesStatus = statusFilter === "All" ? true : (l.status ?? "").toUpperCase() === "LOST";
      return matchesQuery && matchesStatus;
    });
  }, [allLost, search, statusFilter]);

  const columns = [
    {
      header: "Load",
      accessorKey: "loadId",
      cell: (row: LoadSummary) => (
        <div className="flex flex-col">
          <span className="font-medium">#{row.loadId ?? row.id}</span>
          <span className="text-xs text-gray-500">{row.clientName}</span>
        </div>
      ),
    },
    { header: "Pickup", accessorKey: "pickupDate", cell: (row: LoadSummary) => <DateCell value={row.pickupDate} /> },
    { header: "Delivery", accessorKey: "deliveryDate", cell: (row: LoadSummary) => <DateCell value={row.deliveryDate} /> },
    { header: "Status", accessorKey: "status", cell: (row: LoadSummary) => <StatusBadge status={row.status} /> },
    { header: "Price", accessorKey: "price", className: "hidden lg:table-cell", cell: (row: LoadSummary) => <MoneyCell value={row.price} /> },
    { header: "Cost", accessorKey: "cost", className: "hidden lg:table-cell", cell: (row: LoadSummary) => <MoneyCell value={row.cost} /> },
    {
      header: "Profit",
      accessorKey: "profit",
      className: "hidden lg:table-cell",
      cell: (row: LoadSummary) => {
        const fallback = (row.price ?? 0) - (row.cost ?? 0);
        return <MoneyCell value={row.profit ?? fallback} />;
      },
    },
    {
      header: "",
      accessorKey: "actions",
      cell: (row: LoadSummary) => (
        <button
          onClick={() => navigate(`/loads/update/${row.id}`)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-white text-gray-700 hover:bg-gray-50"
          title="Open"
          aria-label={`Open load #${row.loadId ?? row.id}`}
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Page toolbar */}
      <Toolbar
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {error && <ErrorBlock message={error} onRetry={() => fetchLostLoads()} />}
      {loading && <LoadingBlock />}

      {!loading && !error && (
        <TableSection
          title="Lost Loads"
          count={visible.length}
          empty={<EmptyTable label="Lost loads" />}
        >
          <DataTable data={visible} columns={columns} title="" />
        </TableSection>
      )}
    </div>
  );
};

export default LostLoadsTable;
