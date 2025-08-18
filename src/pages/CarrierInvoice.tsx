import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { InvoiceSummary } from '@/types';
import { DataTable } from '@/components/common/DataTable';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function CarrierAccountingOverview() {
  const [carrierInvoices, setCarrierInvoices] = useState<InvoiceSummary[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusNotes, setStatusNotes] = useState<Record<number, string>>({});
  const [statusChanges, setStatusChanges] = useState<Record<number, string>>({});
const [carrierStatusFilter, setCarrierStatusFilter] = useState('');

 useEffect(() => {
  const params: Record<string, string> = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
if (carrierStatusFilter && carrierStatusFilter !== 'ALL') {
  params.carrierStatus = carrierStatusFilter;
}

  api.get('/api/invoices/overview', { params }).then((res) => {
    const invoices = (res.data.invoices || []).map((inv: InvoiceSummary) => {
      const carrierDate = inv.carrierDate || '';
      const profit = inv.netProfit ?? 0;
      const accountManagerPourcentage = Number((profit * 0.25).toFixed(2));
      return { ...inv, carrierDate, accountManagerPourcentage };
    });

    setCarrierInvoices(invoices);
  });
}, [startDate, endDate, carrierStatusFilter]);


  const handleStatusUpdate = async (invoiceId: number) => {
    const status = statusChanges[invoiceId];
    const note = statusNotes[invoiceId];
    if (!status) return;

    try {
      await api.put(`/api/invoices/${invoiceId}/status`, null, {
        params: {
          status,
          role: 'carrier',
          note,
        },
      });
      alert(`✅ Status updated to ${status}`);
    } catch {
      alert('❌ Error updating status');
    }
  };

 const columns = [
  { accessorKey: 'carrierName', header: 'Carrier' },
  { accessorKey: 'carrierDate', header: 'Due Date' },
  { accessorKey: 'type', header: 'Type' },
  {
    accessorKey: 'cost',
    header: 'Cost',
    cell: (row: InvoiceSummary) =>
      typeof row.cost === 'number' ? `$${row.cost.toFixed(2)}` : '-',
  },
  {
    accessorKey: 'costAdditionalcharges',
    header: 'Add. Charges',
    cell: (row: InvoiceSummary) =>
      typeof row.costAdditionalcharges === 'number' ? `$${row.costAdditionalcharges.toFixed(2)}` : '-',
  },
  {
    accessorKey: 'costTotal',
    header: 'Cost + Add Charges',
    cell: (row: InvoiceSummary) =>
      typeof row.cost === 'number' && typeof row.costAdditionalcharges === 'number'
        ? `$${(row.cost + row.costAdditionalcharges).toFixed(2)}`
        : '-',
  },
  {
    accessorKey: 'netProfit',
    header: 'House Profit',
    cell: (row: InvoiceSummary) =>
      typeof row.netProfit === 'number' ? `$${row.netProfit.toFixed(2)}` : '-',
  },
  {
    accessorKey: 'accountManagerPourcentage',
    header: 'AM %',
    cell: (row: InvoiceSummary) =>
      typeof row.accountManagerPourcentage === 'number'
        ? `${row.accountManagerPourcentage.toFixed(2)}%`
        : '-',
  },
  {
    accessorKey: 'carrierStatus',
    header: 'Status',
    cell: (row: InvoiceSummary) => (
      <Select
        value={statusChanges[row.id] || ''}
        onValueChange={(val) =>
          setStatusChanges((prev) => ({ ...prev, [row.id]: val }))
        }
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder={row.carrierStatus || 'Select'} />
        </SelectTrigger>
        <SelectContent>
          {['DELIVERED', 'PAID', 'DISPUTE', 'OVERDUE'].map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    ),
  },
  {
    accessorKey: 'note',
    header: 'Note',
    cell: (row: InvoiceSummary) => (
      <Input
        placeholder="Optional note"
        className="w-[200px]"
        value={statusNotes[row.id] || ''}
        onChange={(e) =>
          setStatusNotes((prev) => ({ ...prev, [row.id]: e.target.value }))
        }
      />
    ),
  },
  {
    accessorKey: 'action',
    header: 'Update',
    cell: (row: InvoiceSummary) => (
      <Button variant="outline" onClick={() => handleStatusUpdate(row.id)}>
        Save
      </Button>
    ),
  },
];


  return (
    <div className="p-4 space-y-4">
      <div className="flex space-x-2 items-center">
        <Select
  value={carrierStatusFilter}
  onValueChange={setCarrierStatusFilter}
>
  <SelectTrigger className="w-[160px]">
    <SelectValue placeholder="Filter by Status" />
  </SelectTrigger>
  <SelectContent>
<SelectItem value="ALL">All</SelectItem>
    <SelectItem value="DELIVERED">DELIVERED</SelectItem>
    <SelectItem value="PAID">PAID</SelectItem>
    <SelectItem value="DISPUTE">DISPUTE</SelectItem>
    <SelectItem value="OVERDUE">OVERDUE</SelectItem>
  </SelectContent>
</Select>

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border rounded px-2 py-1"
        />
        <span>to</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border rounded px-2 py-1"
        />
      </div>

      <DataTable columns={columns} data={carrierInvoices} title="Carrier Invoices" />
    </div>
  );
}
