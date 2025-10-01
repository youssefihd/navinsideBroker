// DashboardLoads.tsx
import { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import {
  Eye,
  AlertCircle,
  Loader2,
  Search,
  Filter,
  TrendingUp,
  DollarSign,
  Layers,
  ClipboardList,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { DataTable } from "@/components/common/DataTable";

// Recharts
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from "recharts";

/* -----------------------------
   Types
------------------------------ */
interface LoadSummary {
  id: number;             // internal db id
  loadId: number;         // human-facing id
  clientName: string;
  pickupDate: string | null;
  deliveryDate: string | null;
  status: string;         // "Confirmed" | "PickedUp" | "Quoting" | ...
  cost?: number;
  price?: number;
  profit?: number;        // absolute
}

/* -----------------------------
   UI Helpers
------------------------------ */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Confirmed: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    PickedUp: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    "In Transit": "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
    Delivered: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    Quoting: "bg-slate-50 text-slate-700 ring-1 ring-slate-200",
    Cancelled: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  };
  const cls = map[status] ?? "bg-gray-100 text-gray-700 ring-1 ring-gray-200";
  return (
    <span className={`inline-flex items-center rounded-full text-xs font-medium ${cls}`}>
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

function ProfitPctCell({ price, profit }: { price?: number; profit?: number }) {
  if (price == null || profit == null || price === 0) return <span className="text-gray-400">-</span>;
  const pct = (profit / price) * 100;
  const good = pct >= 12;
  return <span className={`tabular-nums ${good ? "text-emerald-600" : "text-amber-600"}`}>{pct.toFixed(1)}%</span>;
}

function ViewAction({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-white text-gray-700 hover:bg-gray-50"
      title="Open"
      aria-label="Open"
    >
      <Eye className="h-4 w-4" />
    </button>
  );
}

/* -----------------------------
   Toolbar (global filters)
------------------------------ */
const ALL_STATUSES = ["All", "Confirmed", "PickedUp", "Quoting", "In Transit", "Delivered", "Cancelled"] as const;
type StatusFilter = (typeof ALL_STATUSES)[number];

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
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
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
          {ALL_STATUSES.map((s) => {
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
   - Caps visible body rows at 7
   - Makes thead sticky
   - Works with any DataTable internally
------------------------------ */
function TableSection({
  title,
  count,
  children,
  empty,
}: {
  title: string;
  count: number;
  children: React.ReactNode; // expected to contain <table> via DataTable
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
      const headH = thead ? thead.getBoundingClientRect().height : 44; // fallback
      const rowH = firstRow ? firstRow.getBoundingClientRect().height : 52; // fallback
      const paddings = 0;
      const cap = headH + rowH * 7 + paddings;
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
   Empty / Error / Loading
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
    <div className=" rounded-md border bg-white text-sm text-gray-600">
      <Loader2 className="h-4 w-4 animate-spin" />
      Loading loads…
    </div>
  );
}

/* -----------------------------
   KPI Card
------------------------------ */
function KpiCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-white p-4 shadow-sm">
      <div className="mt-0.5">{icon}</div>
      <div className="min-w-0">
        <div className="text-sm text-gray-500">{label}</div>
        <div className="truncate text-2xl font-semibold tracking-tight">{value}</div>
        {hint && <div className="mt-1 text-xs text-gray-500">{hint}</div>}
      </div>
    </div>
  );
}

/* -----------------------------
   Main Component
------------------------------ */
const DashboardLoads = () => {
  const navigate = useNavigate();

  const [allLoads, setAllLoads] = useState<LoadSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  const fetchLoads = async (signal?: AbortSignal) => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.get("/loads/loads/summary", { signal });
      const list: LoadSummary[] = res.data ?? [];
      setAllLoads(list);
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
    fetchLoads(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Global filtered dataset
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allLoads.filter((l) => {
      const matchesQuery =
        !q || l.clientName.toLowerCase().includes(q) || String(l.loadId ?? l.id).includes(q);
      const matchesStatus = statusFilter === "All" ? true : l.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [allLoads, search, statusFilter]);

  // Slices
  const activeLoads = useMemo(
    () => filtered.filter((l) => ["Confirmed", "PickedUp"].includes(l.status)),
    [filtered]
  );
  const quotingLoads = useMemo(() => filtered.filter((l) => l.status === "Quoting"), [filtered]);

  // KPIs
  const kpis = useMemo(() => {
    const active = activeLoads.length;
    const quoting = quotingLoads.length;
    const mtdLoads = filtered.filter((l) => {
      const d = l.pickupDate ? new Date(l.pickupDate) : null;
      const now = new Date();
      return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const mtdRevenue = mtdLoads.reduce((sum, l) => sum + (l.price ?? 0), 0);
    const marginPct =
      filtered.reduce(
        (acc, l) => {
          if (l.price && l.profit && l.price > 0) {
            acc.totalPct += (l.profit / l.price) * 100;
            acc.count += 1;
          }
          return acc;
        },
        { totalPct: 0, count: 0 }
      );
    return {
      active,
      quoting,
      mtdRevenue,
      avgMargin: marginPct.count ? marginPct.totalPct / marginPct.count : 0,
    };
  }, [activeLoads.length, quotingLoads.length, filtered]);

  // Status distribution for mini chart
  const statusChartData = useMemo(() => {
    const keys = ["Quoting", "Confirmed", "PickedUp", "In Transit", "Delivered", "Cancelled"];
    return keys.map((k) => ({
      status: k,
      count: filtered.filter((l) => l.status === k).length,
    }));
  }, [filtered]);

  // Columns
  const columns = [
    {
      header: "Load",
      accessorKey: "loadId",
      cell: (item: LoadSummary) => (
        <div className="flex flex-col">
          <span className="font-medium">#{item.loadId ?? item.id}</span>
          <span className="text-xs text-gray-500">{item.clientName}</span>
        </div>
      ),
    },
    { header: "Pickup", accessorKey: "pickupDate", cell: (i: LoadSummary) => <DateCell value={i.pickupDate} /> },
    { header: "Delivery", accessorKey: "deliveryDate", cell: (i: LoadSummary) => <DateCell value={i.deliveryDate} /> },
    { header: "Status", accessorKey: "status", cell: (i: LoadSummary) => <StatusBadge status={i.status} /> },
    { header: "Price", accessorKey: "price", className: "hidden lg:table-cell", cell: (i: LoadSummary) => <MoneyCell value={i.price} /> },
    { header: "Cost", accessorKey: "cost", className: "hidden lg:table-cell", cell: (i: LoadSummary) => <MoneyCell value={i.cost} /> },
    {
      header: "Profit",
      accessorKey: "profit",
      className: "hidden lg:table-cell",
      cell: (i: LoadSummary) => (
        <div className="flex flex-col">
          <MoneyCell value={i.profit} />
          <span className="text-xs">
            <ProfitPctCell price={i.price} profit={i.profit} />
          </span>
        </div>
      ),
    },
    { header: "", accessorKey: "actions", cell: (i: LoadSummary) => <ViewAction onClick={() => navigate(`/loads/update/${i.id}`)} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <Toolbar
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={<Layers className="h-5 w-5 text-blue-600" />}
          label="Active Loads"
          value={kpis.active}
          hint="Confirmed & PickedUp"
        />
        <KpiCard
          icon={<ClipboardList className="h-5 w-5 text-slate-600" />}
          label="Quoting"
          value={kpis.quoting}
        />
        <KpiCard
          icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
          label="MTD Revenue"
          value={new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(kpis.mtdRevenue)}
        />
        <KpiCard
          icon={<TrendingUp className="h-5 w-5 text-indigo-600" />}
          label="Avg Margin"
          value={`${kpis.avgMargin.toFixed(1)}%`}
        />
      </div>

      {/* Status distribution chart */}
      <div className="rounded-xl border bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Status Distribution</h3>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusChartData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="status" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <RechartsTooltip />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Error / Loading */}
      {error && <ErrorBlock message={error} onRetry={() => fetchLoads()} />}
      {loading && <LoadingBlock />}

      {/* Tables */}
      {!loading && !error && (
        <div className="">
          <TableSection
            title="Recent Activity (Confirmed / PickedUp)"
            count={activeLoads.length}
            empty={<EmptyTable label="Active loads" />}
          >
            <DataTable data={activeLoads} columns={columns} title="" />
          </TableSection>

          <TableSection
            title="Quoting Loads"
            count={quotingLoads.length}
            empty={<EmptyTable label="Quoting loads" />}
          >
            <DataTable data={quotingLoads} columns={columns} title="" />
          </TableSection>
        </div>
      )}
    </div>
  );
};

export default DashboardLoads;
