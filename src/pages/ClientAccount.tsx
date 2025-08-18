import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { InvoiceSummary } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/common/DataTable';

export default function ClientInvoiceStatusManager() {
  const [clientInvoices, setClientInvoices] = useState<InvoiceSummary[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusNotes, setStatusNotes] = useState<Record<number, string>>({});
  const [statusChanges, setStatusChanges] = useState<Record<number, string>>({});
const [clientStatusFilter, setClientStatusFilter] = useState('');

 useEffect(() => {
  const params: Record<string, string> = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
if (clientStatusFilter && clientStatusFilter !== 'ALL') {
  params.clientStatus = clientStatusFilter;
}

  api.get('/api/invoices/overview', { params }).then((res) => {
    setClientInvoices(res.data?.invoices || []);
  });
}, [startDate, endDate, clientStatusFilter]);

  const handleStatusUpdate = async (invoiceId: number) => {
    const status = statusChanges[invoiceId];
    const note = statusNotes[invoiceId];
    if (!status) return;

    try {
      await api.put(`/api/invoices/${invoiceId}/status`, null, {
        params: {
          status,
          role: 'client',
          note,
        },
      });
      alert(`Status updated to ${status}`);
    } catch (err) {
      alert('Error updating status');
    }
  };

  const columns = [
    { accessorKey: 'invoiceNumber', header: 'Invoice #' },
    { accessorKey: 'purchaseOrder', header: 'PO' },
    { accessorKey: 'clientName', header: 'Client' },
    { accessorKey: 'invoiceDate', header: 'Pick Up Date' },
    { accessorKey: 'dueDate', header: '25 Days After Pick Up' },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: (row: InvoiceSummary) =>
        typeof row.price === 'number' ? `$${row.price.toFixed(2)}` : '-',
    },
    {
      accessorKey: 'additionalCharges',
      header: 'Add. Charges',
      cell: (row: InvoiceSummary) =>
        typeof row.additionalCharges === 'number' ? `$${row.additionalCharges.toFixed(2)}` : '-',
    },
    {
      accessorKey: 'amount',
      header: 'Total Amount',
      cell: (row: InvoiceSummary) =>
        typeof row.amount === 'number' ? `$${row.amount.toFixed(2)}` : '-',
    },
    {
      accessorKey: 'clientStatus',
      header: 'Status',
      cell: (row: InvoiceSummary) => (
        <div className="flex gap-2">
          <Select
            value={statusChanges[row.id] || ''}
            onValueChange={(val) =>
              setStatusChanges((prev) => ({ ...prev, [row.id]: val }))
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={row.clientStatus || 'Select'} />
            </SelectTrigger>
            <SelectContent>
              {['REQUESTED', 'FIRST_REMINDER', 'SECOND_REMINDER', 'THIRD_REMINDER', 'OVERDUE','PAID'].map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
        <Button
          variant="outline"
          onClick={() => handleStatusUpdate(row.id)}
        >
          Save
        </Button>
      ),
    },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="flex space-x-2 items-center">
        <Select value={clientStatusFilter} onValueChange={setClientStatusFilter}>
  <SelectTrigger className="w-[200px]">
    <SelectValue placeholder="Filter by Status" />
  </SelectTrigger>
  <SelectContent>
<SelectItem value="ALL">All</SelectItem>
    <SelectItem value="REQUESTED">REQUESTED</SelectItem>
    <SelectItem value="FIRST_REMINDER">FIRST_REMINDER</SelectItem>
    <SelectItem value="SECOND_REMINDER">SECOND_REMINDER</SelectItem>
    <SelectItem value="THIRD_REMINDER">THIRD_REMINDER</SelectItem>
    <SelectItem value="OVERDUE">OVERDUE</SelectItem>
    <SelectItem value="PAID">PAID</SelectItem>
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

      <DataTable
        columns={columns}
        data={clientInvoices}
        title="Ressources"
      />
    </div>
  );
}
