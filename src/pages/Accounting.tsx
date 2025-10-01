import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/axios';
import { InvoiceSummary } from '@/types';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/common/DataTable';

/* ---------------------------------------------
   Helpers
----------------------------------------------*/
const CAD = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' });
const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('en-CA') : '—');

function daysPastDue(due?: string | null) {
  if (!due) return null;
  const d = new Date(due);
  const today = new Date();
  const diff = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

function statusBadge(status?: string) {
  const map: Record<string, string> = {
    Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Overdue: 'bg-rose-50 text-rose-700 border-rose-200',
    Sent: 'bg-blue-50 text-blue-700 border-blue-200',
    Draft: 'bg-slate-50 text-slate-700 border-slate-200',
    'Pending Approval': 'bg-amber-50 text-amber-700 border-amber-200',
  };
  const cls = map[status || ''] || 'bg-slate-50 text-slate-700 border-slate-200';
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {status || '—'}
    </span>
  );
}

/* ---------------------------------------------
   Component
----------------------------------------------*/
export default function AccountingOverview() {
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [clientQuery, setClientQuery] = useState<string>('');
  const [minAmt, setMinAmt] = useState<string>('');
  const [maxAmt, setMaxAmt] = useState<string>('');

  const navigate = useNavigate();

  // Fetch invoices for range
  useEffect(() => {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (statusFilter) params.status = statusFilter;

    api.get('/api/invoices/overview', { params }).then((res) => {
      setInvoices(res.data?.invoices || []);
    });
  }, [startDate, endDate, statusFilter]);

  // Derived filters client-side
  const data = useMemo(() => {
    let rows = [...invoices];

    if (clientQuery.trim()) {
      const q = clientQuery.toLowerCase();
      rows = rows.filter((r) =>
        [r.clientName, r.clientCompanyNumber, r.invoiceNumber, r.purchaseOrder]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      );
    }

    const min = minAmt ? Number(minAmt) : null;
    const max = maxAmt ? Number(maxAmt) : null;
    if (min != null) rows = rows.filter((r) => (r.amount ?? 0) >= min);
    if (max != null) rows = rows.filter((r) => (r.amount ?? 0) <= max);

    return rows;
  }, [invoices, clientQuery, minAmt, maxAmt]);

  // KPIs
  const kpis = useMemo(() => {
    const ar = data.reduce((acc, r) => acc + (r.amount ?? 0), 0);
    const ap = data.reduce((acc, r) => acc + (r.costTotal ?? (r.cost ?? 0) + (r.costAdditionalcharges ?? 0)), 0);
    const overdueCount = data.filter((r) => (daysPastDue(r.dueDate) ?? 0) > 0 && (r.clientStatus !== 'Paid')).length;
    const avgMargin = data.length
      ? (data.reduce((acc, r) => acc + (r.netProfit ?? 0), 0) / Math.max(1, data.reduce((acc, r) => acc + (r.amount ?? 0), 0))) * 100
      : 0;

    return { ar, ap, net: ar - ap, overdueCount, avgMargin };
  }, [data]);

  // Quick preset handlers
  const setPreset = (preset: 'MTD' | 'LastMonth' | 'YTD' | 'L12M') => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    if (preset === 'MTD') {
      setStartDate(new Date(y, m, 1).toISOString().slice(0, 10));
      setEndDate(new Date().toISOString().slice(0, 10));
    }
    if (preset === 'LastMonth') {
      const first = new Date(y, m - 1, 1);
      const last = new Date(y, m, 0);
      setStartDate(first.toISOString().slice(0, 10));
      setEndDate(last.toISOString().slice(0, 10));
    }
    if (preset === 'YTD') {
      setStartDate(new Date(y, 0, 1).toISOString().slice(0, 10));
      setEndDate(new Date().toISOString().slice(0, 10));
    }
    if (preset === 'L12M') {
      const from = new Date(y, m - 11, 1);
      setStartDate(from.toISOString().slice(0, 10));
      setEndDate(new Date().toISOString().slice(0, 10));
    }
  };

  // CSV Export (client-side)
  const exportCsv = () => {
    const header = [
      'Invoice #','PO','Client','Order By','Invoice Date','Due Date','Amount','Add. Charges','Total','Client Status',
      'Carrier','Cost','Cost Add.','Cost Total','Carrier Due','Carrier Status','House Profit','Days Past Due'
    ];
    const lines = data.map((r) => [
      r.invoiceNumber,
      r.purchaseOrder,
      r.clientName,
      r.clientCompanyNumber,
      fmtDate(r.invoiceDate),
      fmtDate(r.dueDate),
      r.price ?? '',
      r.additionalCharges ?? '',
      r.amount ?? '',
      r.clientStatus ?? '',
      r.carrierName ?? '',
      r.cost ?? '',
      r.costAdditionalcharges ?? '',
      (r.cost ?? 0) + (r.costAdditionalcharges ?? 0),
      fmtDate(r.carrierDate),
      r.carrierStatus ?? '',
      r.netProfit ?? '',
      daysPastDue(r.dueDate) ?? ''
    ]);
    const csv = [header, ...lines].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoices.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Replace your `columns = [...]` with this:
const columns = [
  // CLIENT INFO
  { accessorKey: "invoiceNumber", header: "Invoice Number" },
  { accessorKey: "purchaseOrder", header: "Purchase Order" },
  { accessorKey: "clientName", header: "Client Name" },
  { accessorKey: "clientCompanyNumber", header: "Order by" },
  {
    accessorKey: "invoiceDate",
    header: "Invoice Date",
    cell: (row: InvoiceSummary) =>
      row.invoiceDate ? new Date(row.invoiceDate).toLocaleDateString("en-CA") : "—",
  },
  {
    accessorKey: "dueDate",
    header: "Date to be receive",
    cell: (row: InvoiceSummary) =>
      row.dueDate ? new Date(row.dueDate).toLocaleDateString("en-CA") : "—",
  },
  {
    accessorKey: "price",
    header: "Amount",
    cell: (row: InvoiceSummary) =>
      typeof row.price === "number" ? row.price.toLocaleString("en-CA", { style: "currency", currency: "CAD" }) : "—",
  },
  {
    accessorKey: "additionalCharges",
    header: "Additional Charges",
    cell: (row: InvoiceSummary) =>
      typeof row.additionalCharges === "number"
        ? row.additionalCharges.toLocaleString("en-CA", { style: "currency", currency: "CAD" })
        : "—",
  },
  {
    accessorKey: "amount",
    header: "Total",
    cell: (row: InvoiceSummary) =>
      typeof row.amount === "number"
        ? row.amount.toLocaleString("en-CA", { style: "currency", currency: "CAD" })
        : "—",
  },
  { accessorKey: "clientStatus", header: "Status" },

  // CARRIER INFO
  { accessorKey: "carrierName", header: "Carrier" },
  {
    accessorKey: "cost",
    header: "Cost",
    cell: (row: InvoiceSummary) =>
      typeof row.cost === "number"
        ? row.cost.toLocaleString("en-CA", { style: "currency", currency: "CAD" })
        : "—",
  },
  {
    accessorKey: "costAdditionalcharges",
    header: "Add. Charges",
    cell: (row: InvoiceSummary) =>
      typeof row.costAdditionalcharges === "number"
        ? row.costAdditionalcharges.toLocaleString("en-CA", { style: "currency", currency: "CAD" })
        : "—",
  },
  {
    accessorKey: "costTotal",
    header: "Cost + Add Charges",
    cell: (row: InvoiceSummary) => {
      const total =
        (typeof row.cost === "number" ? row.cost : 0) +
        (typeof row.costAdditionalcharges === "number" ? row.costAdditionalcharges : 0);
      return total
        ? total.toLocaleString("en-CA", { style: "currency", currency: "CAD" })
        : "—";
    },
  },
  {
    accessorKey: "carrierDate",
    header: "Due Date",
    cell: (row: InvoiceSummary) =>
      row.carrierDate ? new Date(row.carrierDate).toLocaleDateString("en-CA") : "—",
  },
  { accessorKey: "carrierStatus", header: "Status" },

  // PROFIT
  {
    accessorKey: "netProfit",
    header: "House Profit",
    cell: (row: InvoiceSummary) =>
      typeof row.netProfit === "number"
        ? row.netProfit.toLocaleString("en-CA", { style: "currency", currency: "CAD" })
        : "—",
  },
];


  return (
    <div className="p-6 space-y-6">
      {/* Sticky Filters & Actions */}
      <div className="sticky top-0 z-10 -mx-6 px-6 py-3 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border rounded px-2 py-1" />
            <span className="text-slate-500">to</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border rounded px-2 py-1" />
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setPreset('MTD')} className="text-xs rounded-full border px-3 py-1 hover:bg-slate-50">MTD</button>
            <button onClick={() => setPreset('LastMonth')} className="text-xs rounded-full border px-3 py-1 hover:bg-slate-50">Last month</button>
            <button onClick={() => setPreset('YTD')} className="text-xs rounded-full border px-3 py-1 hover:bg-slate-50">YTD</button>
            <button onClick={() => setPreset('L12M')} className="text-xs rounded-full border px-3 py-1 hover:bg-slate-50">Last 12m</button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={clientQuery}
              onChange={(e) => setClientQuery(e.target.value)}
              placeholder="Search client / PO / invoice #"
              className="border rounded px-3 py-1 w-[260px]"
            />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded px-2 py-1">
              <option value="">All statuses</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
              <option value="Pending Approval">Pending Approval</option>
            </select>
            <input type="number" inputMode="decimal" placeholder="Min $" value={minAmt} onChange={(e) => setMinAmt(e.target.value)} className="border rounded px-2 py-1 w-24" />
            <input type="number" inputMode="decimal" placeholder="Max $" value={maxAmt} onChange={(e) => setMaxAmt(e.target.value)} className="border rounded px-2 py-1 w-24" />
          </div>

          <div className="ms-auto flex items-center gap-2">
            <Button variant="outline" onClick={exportCsv}>Export CSV</Button>
            <Button variant="outline" onClick={() => navigate('/accounting/clients')}>View Receivables</Button>
            <Button variant="outline" onClick={() => navigate('/accounting/carriers')}>View Payables</Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="A/R (filtered)" value={CAD.format(kpis.ar)} subtitle="Total client invoices" />
        <KpiCard label="A/P (filtered)" value={CAD.format(kpis.ap)} subtitle="Total carrier costs" />
        <KpiCard label="Net (A/R - A/P)" value={CAD.format(kpis.net)} subtitle="Cash delta on set" accent={kpis.net >= 0 ? 'ok' : 'bad'} />
        <KpiCard label="Overdue count" value={String(kpis.overdueCount)} subtitle="> 0 days past due" accent={kpis.overdueCount > 0 ? 'warn' : 'ok'} />
        <KpiCard label="Avg margin %" value={`${kpis.avgMargin.toFixed(1)}%`} subtitle="Profit / Amount" />
      </div>

      {/* Table */}
      <div className="space-y-2">
        <h2 className="font-semibold">All Invoices</h2>
        <DataTable columns={columns} data={data} title="Invoices" />
      </div>
    </div>
  );
}

function KpiCard({ label, value, subtitle, accent }: { label: string; value: string; subtitle?: string; accent?: 'ok' | 'warn' | 'bad' }) {
  const tone = accent === 'ok' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : accent === 'warn' ? 'text-amber-700 bg-amber-50 border-amber-200' : accent === 'bad' ? 'text-rose-700 bg-rose-50 border-rose-200' : 'text-slate-800 bg-white border-slate-200';
  return (
    <div className={`rounded-xl border p-4 ${tone}`}>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
      {subtitle && <div className="text-xs text-slate-500 mt-1">{subtitle}</div>}
    </div>
  );
}
