// src/pages/Index.tsx
import type React from "react";
import { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Eye, TrendingUp, Quote, DollarSign, Percent, MapPin, ArrowRight, Tag,
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Plus, Pencil,
} from "lucide-react";
import { format, isSameMonth, subMonths, addHours, addDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer, ComposedChart, BarChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
} from "recharts";

/* ---------------------------------
   Types
---------------------------------- */
interface LoadSummary {
  id: number;
  loadId: number;
  clientName: string;
  pickupDate: string | null;
  deliveryDate: string | null;
  status: string; // Quoting | Confirmed | PickedUp | In Transit | Delivered | Cancelled | LOST
  cost?: number;
  price?: number;
  profit?: number;
  service?: "LTL" | "FTL" | string;
  mode?: "LTL" | "FTL" | string;
  shipperName?: string;
  shipperCity?: string;
  pickupCompany?: string;
  pickupCity?: string;
  consigneeName?: string;
  consigneeCity?: string;
  deliveryCompany?: string;
  deliveryCity?: string;
}

type Interval = "1M" | "3M" | "6M" | "1Y";

/* ---------------------------------
   Utils
---------------------------------- */
const CAD_0D = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
const pct = (n: number) => `${Math.round(n)}%`;

function coalesceDate(l: LoadSummary): Date | null {
  const src = l.pickupDate ?? l.deliveryDate;
  if (!src) return null;
  const d = new Date(src);
  return isNaN(d.getTime()) ? null : d;
}
function serviceOf(l: LoadSummary): "LTL" | "FTL" | "OTHER" {
  const s = (l.service ?? l.mode ?? "").toString().toUpperCase();
  if (s === "LTL") return "LTL";
  if (s === "FTL") return "FTL";
  return "OTHER";
}
function last12MonthKeys() {
  const now = new Date();
  const keys: { key: string; label: string; start: Date; end: Date }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = subMonths(now, i);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    keys.push({ key: ym, label: format(d, "MMM"), start, end });
  }
  return keys;
}
const shipperOf = (l: LoadSummary) => ({ name: l.shipperName ?? l.pickupCompany ?? undefined, city: l.shipperCity ?? l.pickupCity ?? undefined });
const consigneeOf = (l: LoadSummary) => ({ name: l.consigneeName ?? l.deliveryCompany ?? undefined, city: l.consigneeCity ?? l.deliveryCity ?? undefined });

/* ---------------------------------
   Fake data (deterministic)
---------------------------------- */
const NUM_LOADS = 64;
const RNG_SEED = 4229;
function createRng(seed: number) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 0x100000000); }
function pick<T>(rng: () => number, arr: T[]) { return arr[Math.floor(rng() * arr.length)]; }
function pickWeighted<T>(rng: () => number, entries: [T, number][]) {
  const total = entries.reduce((a, [, w]) => a + w, 0); let r = rng() * total;
  for (const [val, w] of entries) { if ((r -= w) <= 0) return val; }
  return entries[entries.length - 1][0];
}
function randBetween(rng: () => number, min: number, max: number) { return Math.floor(min + rng() * (max - min + 1)); }
const CLIENTS = ["FreshProduce Inc.","DairyDirect Ltd.","Maple Snacks Co.","Nordic Foods","St-Laurent Grocers","Capitale Foods","Green Leaf Import","Sunrise Market"];
const COMPANIES = ["Costco Distribution Center","Sobeys Distribution","Loblaw Warehouses","Metro DC","IGA DC","Walmart RDC","Provigo DC","Whole Foods Hub"];
const CITIES = ["Montréal, QC","Laval, QC","Boisbriand, QC","Québec City, QC","Sherbrooke, QC","Drummondville, QC","Ottawa, ON","GTA, ON","Toronto, ON","Brampton, ON","Mississauga, ON","Hamilton, ON"];
function monthAgoDate(monthsAgo: number, day: number) {
  const now = new Date(); const d = subMonths(now, monthsAgo);
  const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return new Date(d.getFullYear(), d.getMonth(), Math.max(1, Math.min(daysInMonth, day)));
}
function generateFakeLoads(count: number, seed = RNG_SEED): LoadSummary[] {
  const rng = createRng(seed); const loads: LoadSummary[] = [];
  for (let i = 0; i < count; i++) {
    const id = i + 1, loadId = 1000 + i;
    const clientName = pick(rng, CLIENTS);
    const shipperCity = pick(rng, CITIES), consigneeCity = pick(rng, CITIES.filter(c => c !== shipperCity));
    const shipperName = pick(rng, COMPANIES), consigneeName = pick(rng, COMPANIES.filter(c => c !== shipperName));
    const status = pickWeighted(rng, [["Delivered",28],["Confirmed",20],["PickedUp",20],["In Transit",12],["Quoting",10],["Cancelled",5],["LOST",5]]) as LoadSummary["status"];
    const monthsAgo = randBetween(rng, 0, 13); const pickup = monthAgoDate(monthsAgo, randBetween(rng, 2, 26));
    const delivery = new Date(pickup); delivery.setDate(delivery.getDate() + randBetween(rng, 1, 6));
    if (status === "Confirmed" || status === "PickedUp" || status === "In Transit") { delivery.setDate(new Date().getDate() + randBetween(rng, 1, 7)); }
    const service: "LTL" | "FTL" = rng() < 0.62 ? "LTL" : "FTL";
    const base = service === "LTL" ? randBetween(rng, 800, 2200) : randBetween(rng, 1800, 5200);
    const price = base; const cost = Math.floor(base * (0.6 + rng() * 0.25)); const profit = Math.max(0, price - cost);
    loads.push({
      id, loadId, clientName,
      pickupDate: pickup.toISOString(), deliveryDate: delivery.toISOString(),
      status, service, mode: service, price, cost, profit,
      shipperName, shipperCity, pickupCompany: shipperName, pickupCity: shipperCity,
      consigneeName, consigneeCity, deliveryCompany: consigneeName, deliveryCity: consigneeCity,
    });
  }
  return loads;
}

/* ---------------------------------
   Visual building blocks
---------------------------------- */
const Aura: React.FC = () => (
  <div aria-hidden className="pointer-events-none absolute inset-0 -z-10"
    style={{ background:
      "radial-gradient(900px 500px at -10% -10%, rgba(56,189,248,0.12), transparent 50%)," +
      "radial-gradient(900px 500px at 110% -10%, rgba(192,132,252,0.12), transparent 55%)," +
      "radial-gradient(700px 400px at 50% 120%, rgba(244,63,94,0.10), transparent 60%)"
    }}
  />
);

const SectionCard: React.FC<React.PropsWithChildren<{ title?: React.ReactNode; cta?: React.ReactNode }>> = ({ title, cta, children }) => (
  <section className="relative rounded-2xl border border-sky-100/60 bg-gradient-to-br from-white via-sky-50/40 to-violet-50/40 p-5 md:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
    {(title || cta) && (
      <div className="mb-4 flex items-center justify-between gap-4">
        {title ? <h2 className="text-base md:text-lg font-semibold text-gray-900">{title}</h2> : <span />}
        {cta}
      </div>
    )}
    {children}
  </section>
);

function StatusBadge({ status }: { status: string }) {
  const label = status === "LOST" ? "Lost" : status;
  const map: Record<string, string> = {
    Quoting: "bg-slate-100 text-slate-900 ring-slate-200",
    Confirmed: "bg-sky-100 text-sky-900 ring-sky-200",
    PickedUp: "bg-amber-100 text-amber-900 ring-amber-200",
    "In Transit": "bg-violet-100 text-violet-900 ring-violet-200",
    Delivered: "bg-emerald-100 text-emerald-900 ring-emerald-200",
    Cancelled: "bg-gray-200 text-gray-900 ring-gray-300",
    Lost: "bg-rose-100 text-rose-900 ring-rose-300",
    "LOST": "bg-rose-100 text-rose-900 ring-rose-300",
  };
  const t = map[label] ?? "bg-gray-200 text-gray-900 ring-gray-300";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${t}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current/80" />
      {label}
    </span>
  );
}

function PartyPill({ name, city }: { name?: string; city?: string }) {
  const [hover, setHover] = useState(false);
  const cityText = city ?? name ?? "—";
  const companyText = name ?? city ?? "—";
  const tooltip = name && city ? `${name} — ${city}` : (name ?? city ?? "");
  return (
    <span
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="inline-flex items-center gap-2 rounded-full bg-white/90 px-2.5 py-1 ring-1 ring-sky-200 cursor-default"
      title={tooltip}
    >
      <MapPin className="h-3.5 w-3.5 text-sky-600" aria-hidden />
      <motion.span
        layout
        className="inline-flex items-center whitespace-nowrap"
        transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
      >
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={hover ? "company" : "city"}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
            className="inline-block text-xs font-semibold text-gray-900"
          >
            {hover ? companyText : cityText}
          </motion.span>
        </AnimatePresence>
      </motion.span>
    </span>
  );
}

/* ---------------------------------
   KPIs
---------------------------------- */
function KPIs({ loads }: { loads: LoadSummary[] }) {
  const mtdRevenue = useMemo(() => {
    const now = new Date();
    return loads
      .filter((l) => !!l.pickupDate && isSameMonth(new Date(l.pickupDate!), now) && l.status !== "LOST" && l.status !== "Cancelled")
      .reduce((sum, l) => sum + (l.price ?? 0), 0);
  }, [loads]);

  const openQuotes = useMemo(() => loads.filter((l) => l.status === "Quoting").length, [loads]);

  const winRate = useMemo(() => {
    const wins = loads.filter((l) => ["Confirmed", "PickedUp", "Delivered"].includes(l.status)).length;
    const considered = wins + loads.filter((l) => l.status === "LOST").length + openQuotes;
    if (!considered) return undefined;
    return (wins / considered) * 100;
  }, [loads, openQuotes]);

  const avgMargin = useMemo(() => {
    const withBoth = loads.filter((l) => l.price && l.cost && l.price > 0);
    if (!withBoth.length) return undefined;
    const avg = withBoth.reduce((acc, l) => acc + ((l.price! - l.cost!) / l.price!) * 100, 0) / withBoth.length;
    return Math.max(0, Math.min(100, avg));
  }, [loads]);

  const Item = ({ icon: Icon, label, value, tint }: { icon: any; label: string; value: string | number; tint: string }) => (
    <div className={`relative overflow-hidden rounded-2xl border p-4 shadow-sm bg-white/90 ${tint}`}>
      <div className="absolute -top-10 right-0 h-24 w-24 rounded-full bg-gradient-to-br from-amber-200/50 to-rose-200/40 blur-2xl" />
      <div className="relative flex items-center gap-3">
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-sky-100 to-violet-100 ring-1 ring-sky-200">
          <Icon className="h-4 w-4 text-sky-700" />
        </div>
        <div className="leading-tight">
          <div className="text-[11px] uppercase tracking-wide text-gray-500">{label}</div>
          <div className="text-sm font-bold text-gray-900">{value}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Item icon={DollarSign} label="MTD Revenue" value={CAD_0D.format(mtdRevenue)} tint="border-emerald-100" />
      <Item icon={Quote} label="Open Quotes" value={openQuotes} tint="border-rose-100" />
      <Item icon={Percent} label="Win Rate" value={winRate != null ? pct(winRate) : "—"} tint="border-violet-100" />
      <Item icon={TrendingUp} label="Avg Margin" value={avgMargin != null ? pct(avgMargin) : "—"} tint="border-amber-100" />
    </div>
  );
}

/* ---------------------------------
   Filters
---------------------------------- */
function GlobalFilter({ value, onChange }: { value: Interval; onChange: (v: Interval) => void }) {
  const options: Interval[] = ["1M","3M", "6M", "1Y"];
  return (
    <div className="inline-flex rounded-2xl border border-sky-200 bg-white p-1 shadow-sm">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={[
              "px-3 py-1.5 text-xs font-semibold rounded-xl transition",
              active ? "bg-gradient-to-r from-sky-500 to-violet-500 text-white shadow-sm" : "text-gray-700 hover:bg-sky-50",
            ].join(" ")}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

const STATUS_OPTIONS = ["All","Quoting","Confirmed","PickedUp","In Transit","Lost","Delivered","Cancelled"] as const;
type StatusFilter = typeof STATUS_OPTIONS[number];

function StatusFilterBar({ value, onChange }: { value: StatusFilter; onChange: (v: StatusFilter) => void }) {
  return (
    <div className="inline-flex rounded-2xl border border-violet-200 bg-white p-1 shadow-sm">
      {STATUS_OPTIONS.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={[
              "px-3 py-1.5 text-xs font-semibold rounded-xl transition",
              active ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-sm" : "text-gray-700 hover:bg-violet-50",
            ].join(" ")}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------------
   Async / skeletons
---------------------------------- */
function ChartSkeleton() { return <div className="h-[280px] w-full animate-pulse rounded-xl border bg-white" />; }

/* ---------------------------------
   Cards
---------------------------------- */
function EnRouteCard({ item }: { item: LoadSummary }) {
  const shipper = shipperOf(item); const consignee = consigneeOf(item);
  const profitCalc = item.profit != null ? item.profit : (item.price != null && item.cost != null ? item.price - item.cost : undefined);

  return (
    <motion.article
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="group relative min-h-[148px] overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-br from-white via-sky-50/40 to-violet-50/40 p-4 shadow-sm"
    >
      <span className="pointer-events-none absolute left-0 top-0 h-full w-1 rounded-l-2xl bg-gradient-to-b from-fuchsia-500 to-sky-500" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900 truncate">#{item.loadId ?? item.id}</h3>
            <span className="text-xs text-gray-600 truncate">• {item.clientName}</span>
          </div>
          <div className="mt-2 flex items-center gap-2 whitespace-nowrap overflow-hidden">
            <span className="shrink-0"><PartyPill name={shipper.name} city={shipper.city} /></span>
            <ArrowRight className="h-4 w-4 text-gray-300 shrink-0" />
            <span className="shrink-0"><PartyPill name={consignee.name} city={consignee.city} /></span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatusBadge status={item.status} />
          <Sheet>
            <SheetTrigger asChild>
              <button
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border bg-white text-gray-700 hover:bg-sky-50 ring-1 ring-sky-200"
                title="Quick view"
                aria-label={`Quick view #${item.loadId ?? item.id}`}
              >
                <Eye className="h-4 w-4" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[420px] sm:w-[520px]">
              <SheetHeader><SheetTitle>Load #{item.loadId ?? item.id}</SheetTitle></SheetHeader>
              <div className="mt-4 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><div className="text-xs text-gray-500">Client</div><div className="font-medium">{item.clientName}</div></div>
                  <div><div className="text-xs text-gray-500">Status</div><StatusBadge status={item.status} /></div>
                  <div><div className="text-xs text-gray-500">Shipper</div><div className="mt-1"><PartyPill name={shipper.name} city={shipper.city} /></div></div>
                  <div><div className="text-xs text-gray-500">Consignee</div><div className="mt-1"><PartyPill name={consignee.name} city={consignee.city} /></div></div>
                </div>
                <div className="rounded-xl border p-3">
                  <div className="flex items-center justify-between"><span className="text-xs text-gray-500">Financials</span><span className="text-xs text-gray-400">CAD</span></div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <div><div className="text-xs text-gray-500">Price</div><div className="font-semibold">{item.price != null ? CAD_0D.format(item.price) : "—"}</div></div>
                    <div><div className="text-xs text-gray-500">Cost</div><div className="font-semibold">{item.cost != null ? CAD_0D.format(item.cost) : "—"}</div></div>
                    <div><div className="text-xs text-gray-500">Profit</div><div className="font-semibold">{profitCalc != null ? CAD_0D.format(profitCalc) : "—"}</div></div>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 text-sm whitespace-nowrap overflow-hidden">
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 font-semibold text-emerald-700 ring-1 ring-emerald-200">
          <Tag className="h-4 w-4" />
          {item.price != null ? CAD_0D.format(item.price) : "—"}
        </span>
        <span className="text-gray-400">/</span>
        <span className="text-gray-700">Cost: {item.cost != null ? CAD_0D.format(item.cost) : "—"}</span>
      </div>
    </motion.article>
  );
}

/* ---------------------------------
   Paged card list
---------------------------------- */
function PagedCardList({
  items,
  page,
  setPage,
  pageSize = 7,
}: {
  items: LoadSummary[];
  page: number;
  setPage: (p: number) => void;
  pageSize?: number;
}) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const start = (page - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  const boxRef = useRef<HTMLDivElement>(null);
  const [boxH, setBoxH] = useState<number>(0);

  useLayoutEffect(() => {
    const CARD_ROW_H = 148;
    const gap = 12;
    const h = CARD_ROW_H * 3 + gap * 2;
    setBoxH(h);
    document.documentElement.style.setProperty("--dashboard-list-viewport", `${h}px`);
    return () => {
      document.documentElement.style.removeProperty("--dashboard-list-viewport");
    };
  }, [pageSize]);

  return (
    <div className="space-y-3">
      <div
        ref={boxRef}
        className="grid content-start auto-rows-max gap-3 overflow-y-auto overscroll-contain pr-3 nice-scrollbar"
        style={{ height: boxH }}
      >
        {pageItems.length === 0 ? (
          <div className="flex items-center justify-center rounded-xl border border-dashed bg-white/80 p-10 text-sm text-gray-500">
            No items in this range.
          </div>
        ) : (
          pageItems.map((item) => (
            <div key={item.id} data-card>
              <EnRouteCard item={item} />
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Page <span className="font-semibold text-gray-800">{page}</span> of{" "}
            <span className="font-semibold text-gray-800">{totalPages}</span>
          </div>
          <div className="inline-flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1} className="h-8 px-2">
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="h-8 px-2">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="h-8 px-2">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={page === totalPages} className="h-8 px-2">
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------
   Weekly helpers (4 full previous weeks)
---------------------------------- */
function startOfWeekMon(d: Date) {
  const x = new Date(d);
  const day = x.getDay(); // 0 Sun..6 Sat
  const diff = (day + 6) % 7; // Mon=0, Tue=1, ... Sun=6
  x.setHours(0,0,0,0);
  x.setDate(x.getDate() - diff);
  return x;
}
function addDaysCloned(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

function lastFourFullWeeks() {
  const today = new Date();
  // Current week's Monday
  const currentWeekMon = startOfWeekMon(today);
  // End at the Sunday **before** the current week (i.e., exclude current partial week)
  const lastWeekSun = addDaysCloned(currentWeekMon, -1);

  // Four full weeks prior to current week
  const weeks: { key: string; label: string; start: Date; end: Date }[] = [];
  for (let i = 4; i >= 1; i--) {
    const weekStart = addDaysCloned(currentWeekMon, -7 * i);
    const weekEnd = addDaysCloned(weekStart, 6);
    weeks.push({
      key: format(weekStart, "yyyy-MM-dd"),
      label: `${format(weekStart, "MMM d")}–${format(weekEnd, "d")}`,
      start: weekStart,
      end: weekEnd,
    });
  }
  // Safety: cap last bucket at lastWeekSun (should already align)
  if (weeks.length) weeks[weeks.length - 1].end = lastWeekSun;
  return weeks;
}

/* ---------------------------------
   Task List (Days / Hours / On + Edit)
---------------------------------- */
type RemindMode = "days" | "hours" | "on";
type TaskPriority = "high" | "medium" | "low";

interface Task {
  id: string;
  name: string;
  priority: TaskPriority;
  dueDate?: string;
  remindMode?: RemindMode;
  remindAmount?: number;
  remindOnDate?: string;
  remindOnTime?: string;
  remindAt?: string;
  done?: boolean;
}

// Compose local date+time as local Date
function composeLocal(dateStr: string, timeStr: string) {
  try {
    const [y, m, d] = dateStr.split("-").map((n) => parseInt(n, 10));
    const [hh, mm] = timeStr.split(":").map((n) => parseInt(n, 10));
    return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
  } catch {
    return new Date();
  }
}

function TaskList() {
  const THEME: Record<TaskPriority, {
    tint: string; ring: string; text: string; shadow: string; badge: string;
  }> = {
    high:   { tint: "rgba(244,63,94,0.35)",  ring: "ring-rose-200",    text: "text-rose-800",
              shadow: "shadow-[0_10px_28px_-10px_rgba(244,63,94,0.45)]",  badge: "bg-rose-50 text-rose-800 ring-rose-200" },
    medium: { tint: "rgba(59,130,246,0.35)", ring: "ring-sky-200",     text: "text-sky-800",
              shadow: "shadow-[0_10px_28px_-10px_rgba(59,130,246,0.45)]", badge: "bg-sky-50 text-sky-800 ring-sky-200" },
    low:    { tint: "rgba(16,185,129,0.35)", ring: "ring-emerald-200", text: "text-emerald-800",
              shadow: "shadow-[0_10px_28px_-10px_rgba(16,185,129,0.45)]", badge: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  };

  const [tasks, setTasks] = useState<Task[]>([
    { id: "t1", name: "Call carrier for POD", priority: "high",
      dueDate: new Date().toISOString().slice(0,10), remindMode: "hours", remindAmount: 4,
      remindAt: addHours(new Date(), 4).toISOString() },
    { id: "t2", name: "Send quote to Maple Snacks", priority: "medium",
      dueDate: new Date(Date.now() + 86400000).toISOString().slice(0,10), remindMode: "days", remindAmount: 1,
      remindAt: addDays(new Date(), 1).toISOString() },
  ]);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("low");
  const [due, setDue] = useState<string>("");
  const [mode, setMode] = useState<RemindMode>("days");
  const [amount, setAmount] = useState<number>(1);
  const [onDate, setOnDate] = useState<string>("");
  const [onTime, setOnTime] = useState<string>("09:00");

  const resetDraft = () => {
    setName(""); setPriority("low"); setDue(""); setMode("days");
    setAmount(1); setOnDate(""); setOnTime("09:00"); setEditingId(null);
  };

  const openAdd = () => { resetDraft(); setOpen(true); };
  const openEdit = (t: Task) => {
    setEditingId(t.id);
    setName(t.name);
    setPriority(t.priority ?? "low");
    setDue(t.dueDate || "");
    if (t.remindMode === "on") {
      setMode("on");
      const dt = t.remindAt ? new Date(t.remindAt) : new Date();
      const yyyy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, "0");
      const dd = String(dt.getDate()).padStart(2, "0");
      const hh = String(dt.getHours()).padStart(2, "0");
      const mi = String(dt.getMinutes()).padStart(2, "0");
      setOnDate(t.remindOnDate || `${yyyy}-${mm}-${dd}`);
      setOnTime(t.remindOnTime || `${hh}:${mi}`);
    } else if (t.remindMode === "hours") {
      setMode("hours"); setAmount(t.remindAmount ?? 1);
    } else {
      setMode("days"); setAmount(t.remindAmount ?? 1);
    }
    setOpen(true);
  };

  const computeRemindAt = () => {
    if (mode === "on" && onDate) return composeLocal(onDate, onTime || "09:00").toISOString();
    const now = new Date();
    return mode === "hours" ? addHours(now, amount || 0).toISOString() : addDays(now, amount || 0).toISOString();
  };

  const saveTask = () => {
    if (!name.trim()) return;
    const remindAt = computeRemindAt();
    if (editingId) {
      setTasks(prev => prev.map(t => t.id === editingId ? {
        ...t, name: name.trim(), priority, dueDate: due || undefined, remindMode: mode,
        remindAmount: mode === "on" ? undefined : (amount || 0),
        remindOnDate: mode === "on" ? onDate : undefined,
        remindOnTime: mode === "on" ? onTime : undefined,
        remindAt,
      } : t));
    } else {
      setTasks(prev => [{
        id: Math.random().toString(36).slice(2),
        name: name.trim(),
        priority,
        dueDate: due || undefined,
        remindMode: mode,
        remindAmount: mode === "on" ? undefined : (amount || 0),
        remindOnDate: mode === "on" ? onDate : undefined,
        remindOnTime: mode === "on" ? onTime : undefined,
        remindAt,
        done: false,
      }, ...prev]);
    }
    setOpen(false);
    resetDraft();
  };

  const toggleDone = (id: string) =>
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, done: !t.done } : t)));
  const removeTask = (id: string) => setTasks(prev => prev.filter(t => t.id !== id));

  const sorted = useMemo(() => {
    const rank: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };
    return [...tasks].sort((a, b) => {
      const rp = rank[a.priority] - rank[b.priority];
      if (rp !== 0) return rp;
      return (a.dueDate?.localeCompare(b.dueDate || "") ?? 0);
    });
  }, [tasks]);

  return (
    <SectionCard
      title=""
      cta={
        <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetDraft(); }}>
          <SheetTrigger asChild>
            <Button onClick={openAdd} className="h-8 rounded-lg bg-gradient-to-r from-sky-600 to-violet-600 text-white hover:brightness-110">
              <Plus className="h-4 w-4 mr-1" /> Add Task
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[420px] sm:w-[520px]">
            <SheetHeader><SheetTitle>{editingId ? "Edit Task" : "Add Task"}</SheetTitle></SheetHeader>
            <div className="mt-4 space-y-4 text-sm">
              {/* fields */}
              <div>
                <label className="text-xs text-gray-600">Task name</label>
                <input value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Book appointment for delivery"
                  className="mt-1 w-full rounded-md border px-3 py-2" />
              </div>

              <div>
                <div className="text-xs text-gray-600 mb-1">Priority</div>
                <div className="inline-flex rounded-lg border bg-white p-1">
                  <button type="button" onClick={() => setPriority("low")}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md ${priority === "low" ? "bg-emerald-600 text-white" : "text-gray-700 hover:bg-emerald-50"}`}>
                    Low
                  </button>
                  <button type="button" onClick={() => setPriority("medium")}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md ${priority === "medium" ? "bg-sky-600 text-white" : "text-gray-700 hover:bg-sky-50"}`}>
                    Medium
                  </button>
                  <button type="button" onClick={() => setPriority("high")}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md ${priority === "high" ? "bg-rose-600 text-white" : "text-gray-700 hover:bg-rose-50"}`}>
                    High
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-600">Due date</label>
                <input type="date" value={due} onChange={(e) => setDue(e.target.value)}
                       className="mt-1 w-full rounded-md border px-3 py-2" />
              </div>

              <div className="space-y-2">
                <div className="text-xs text-gray-600">Remind</div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex rounded-lg border bg-white p-1">
                    <button onClick={() => setMode("days")}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md ${mode === "days" ? "bg-sky-600 text-white" : "text-gray-700 hover:bg-sky-50"}`}>
                      Days
                    </button>
                    <button onClick={() => setMode("hours")}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md ${mode === "hours" ? "bg-sky-600 text-white" : "text-gray-700 hover:bg-sky-50"}`}>
                      Hours
                    </button>
                    <button onClick={() => setMode("on")}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md ${mode === "on" ? "bg-sky-600 text-white" : "text-gray-700 hover:bg-sky-50"}`}>
                      On
                    </button>
                  </div>

                  {mode !== "on" ? (
                    <input type="number" min={0} value={amount}
                           onChange={(e) => setAmount(parseInt(e.target.value || "0", 10))}
                           className="w-24 rounded-md border px-2 py-1.5 text-sm" placeholder="0" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <input type="date" value={onDate} onChange={(e) => setOnDate(e.target.value)}
                             className="rounded-md border px-2 py-1.5 text-sm" />
                      <input type="time" value={onTime} onChange={(e) => setOnTime(e.target.value)}
                             className="rounded-md border px-2 py-1.5 text-sm" />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-gray-500">
                  {mode === "on"
                    ? (onDate ? <>You’ll be reminded on <time>{onDate}</time> at {onTime || "09:00"}.</> : "Pick a date & time.")
                    : <>You’ll be reminded in {amount || 0} {mode}.</>}
                </p>
              </div>

              <div className="pt-2">
                <Button onClick={saveTask} className="rounded-md bg-gradient-to-r from-sky-600 to-violet-600 text-white hover:brightness-110">
                  {editingId ? "Save Changes" : "Save Task"}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      }
    >
      <div
        className="space-y-2 overflow-y-auto overscroll-contain pr-3 nice-scrollbar"
        style={{ height: "var(--dashboard-list-viewport, 560px)" }}
      >
        {sorted.length === 0 ? (
          <div className="flex items-center justify-center rounded-xl border border-dashed bg-white/80 p-10 text-sm text-gray-500">
            No tasks yet—add one!
          </div>
        ) : sorted.map((t) => {
          const theme = THEME[t.priority ?? "low"];
          return (
            <div
              key={t.id}
              className={`relative flex items-start justify-between gap-3 rounded-xl border bg-white/90 p-3 ring-1 ${theme.ring} ${theme.shadow}`}
              title={`Priority: ${t.priority}`}
              style={{ ['--tint' as any]: theme.tint }}
            >
              <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[12px] overflow-hidden">
                <span
                  className="absolute inset-0"
                  style={{
                    background: `
                      radial-gradient(120% 60% at 50% -20%, rgba(255,255,255,.65), transparent 55%),
                      linear-gradient(to bottom, var(--tint), transparent 60%)
                    `,
                    mixBlendMode: "screen",
                  }}
                />
                <span
                  className="absolute inset-y-[-160%] inset-x-0"
                  style={{
                    background:
                      "linear-gradient(115deg, rgba(255,255,255,0) 45%, rgba(255,255,255,.7) 50%, rgba(255,255,255,0) 55%)",
                    animation: "task-sheen 3.2s ease-in-out infinite",
                  }}
                />
              </span>

              <label className="inline-flex items-start gap-2 relative z-[1]">
                <input type="checkbox" checked={!!t.done} onChange={() => toggleDone(t.id)} className="mt-1 h-4 w-4" />
                <div className="min-w-0">
                  <div className={`text-sm font-medium ${t.done ? "line-through text-gray-400" : "text-gray-900"}`}>{t.name}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                    {t.dueDate ? <>Due: <time dateTime={t.dueDate}>{t.dueDate}</time></> : "No due date"}
                    {t.remindAt && <> • Reminds: <time dateTime={t.remindAt}>{new Date(t.remindAt).toLocaleString()}</time></>}
                    <span className={`inline-flex items-center rounded-full px-2 py-[2px] ring-1 ${theme.badge}`}>
                      {t.priority[0].toUpperCase() + t.priority.slice(1)}
                    </span>
                  </div>
                </div>
              </label>

              <div className="relative z-[1] flex items-center gap-2">
                <button onClick={() => openEdit(t)} className="inline-flex items-center gap-1 text-xs text-sky-700 hover:underline">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button onClick={() => removeTask(t.id)} className="text-xs text-rose-600 hover:underline">Remove</button>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

/* ---------------------------------
   Main
---------------------------------- */
export default function Index() {
  const [allLoads, setAllLoads] = useState<LoadSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const [interval, setInterval] = useState<Interval>("6M");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [page, setPage] = useState(1);

  // seed fake data
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      setAllLoads(generateFakeLoads(NUM_LOADS, RNG_SEED));
      setLoading(false);
    }, 350);
    return () => clearTimeout(t);
  }, []);

  // Keys (time buckets)
  const { keys, lastStart } = useMemo(() => {
    if (interval === "1M") {
      const weekKeys = lastFourFullWeeks(); // ← 4 full weeks, Mon–Sun, excluding current week
      return { keys: weekKeys, lastStart: weekKeys[0].start };
    }
    const monthsToShow = interval === "3M" ? 3 : interval === "6M" ? 6 : 12;
    const monthKeys = last12MonthKeys().slice(-monthsToShow);
    return { keys: monthKeys, lastStart: monthKeys[0].start };
  }, [interval]);

  // Loads within time window
  const filteredByTime = useMemo(() => {
    return allLoads.filter((l) => {
      const d = coalesceDate(l);
      return d && d.getTime() >= lastStart.getTime();
    });
  }, [allLoads, lastStart]);

  // Charts (LTL/FTL by bucket)
  const chartLtlFtl = useMemo(() => {
    const base = keys.map((k) => ({ bucket: k.label, key: k.key, LTL: 0, FTL: 0 }));
    const map = Object.fromEntries(base.map((b) => [b.key, b])) as Record<string, any>;

    for (const l of filteredByTime) {
      const d = coalesceDate(l)!;
      // choose the bucket this date falls into
      const bucket = keys.find(k => d >= k.start && d <= k.end);
      if (!bucket) continue;
      const key = bucket.key;
      const sv = serviceOf(l);
      if (sv === "LTL") map[key].LTL += 1;
      else if (sv === "FTL") map[key].FTL += 1;
    }

    return keys.map((k) => ({
      month: k.label, // XAxis binding
      LTL: map[k.key]?.LTL ?? 0,
      FTL: map[k.key]?.FTL ?? 0,
    }));
  }, [filteredByTime, keys]);

  // Finance per same buckets
  const chartFinance = useMemo(() => {
    const base = keys.map((k) => ({ bucket: k.label, key: k.key, Revenue: 0, Expense: 0, Profit: 0 }));
    const map = Object.fromEntries(base.map((b) => [b.key, b])) as Record<string, any>;

    for (const l of filteredByTime) {
      const d = coalesceDate(l)!;
      const bucket = keys.find(k => d >= k.start && d <= k.end);
      if (!bucket) continue;
      const key = bucket.key;
      const rev = l.price ?? 0, exp = l.cost ?? 0;
      map[key].Revenue += rev;
      map[key].Expense += exp;
      map[key].Profit  += (l.profit != null ? l.profit : (l.price != null && l.cost != null ? l.price - l.cost : 0));
    }

    return keys.map((k) => ({
      month: k.label,
      Revenue: map[k.key]?.Revenue ?? 0,
      Expense: map[k.key]?.Expense ?? 0,
      Profit:  map[k.key]?.Profit  ?? 0,
    }));
  }, [filteredByTime, keys]);

  // Status filter + paging for cards
const tableLoads = useMemo(() => {
  const base = allLoads; // ← no time filtering here
  if (statusFilter === "All") return base;
  if (statusFilter === "Lost") return base.filter((l) => (l.status ?? "").toUpperCase() === "LOST");
  return base.filter((l) => (l.status ?? "").toLowerCase() === statusFilter.toLowerCase());
}, [allLoads, statusFilter]);


useEffect(() => { setPage(1); }, [statusFilter]);

  /* ---------------------------------
     Render
  ---------------------------------- */
  return (
    <div className="relative space-y-8">
      <Aura />

      {/* Filters row: Time + Status */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <GlobalFilter value={interval} onChange={setInterval} />
        <StatusFilterBar value={statusFilter} onChange={setStatusFilter} />
      </div>

      {/* KPIs */}
<KPIs loads={allLoads} />

      {/* Charts */}
      <SectionCard>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-[280px]">
            {loading ? (
              <ChartSkeleton />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartLtlFtl} barCategoryGap={12} barGap={10}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <RechartsTooltip formatter={(v: number, n: string) => [`${v}`, n]}
                                   labelFormatter={(l) => `Week: ${l}`} />
                  <Legend />
                  <Bar dataKey="LTL" name="LTL" radius={[8, 8, 0, 0]} fill="#60A5FA" />
                  <Bar dataKey="FTL" name="FTL" radius={[8, 8, 0, 0]} fill="#A78BFA" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="h-[280px]">
            {loading ? (
              <ChartSkeleton />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartFinance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip formatter={(v: number, n: string) => [CAD_0D.format(Number(v) || 0), n]}
                                   labelFormatter={(l) => `Week: ${l}`} />
                  <Legend />
                  <Bar dataKey="Revenue" name="Revenue" radius={[8, 8, 0, 0]} fill="#14B8A6" />
                  <Bar dataKey="Expense" name="Expense" radius={[8, 8, 0, 0]} fill="#F43F5E" />
                  <Line type="monotone" dataKey="Profit" name="Profit" dot={{ r: 2 }} stroke="#F59E0B" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Table + Tasks */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[7fr_3fr]">
        <SectionCard>
          <PagedCardList items={tableLoads} page={page} setPage={setPage} pageSize={7} />
        </SectionCard>

        <TaskList />
      </div>
    </div>
  );
}
