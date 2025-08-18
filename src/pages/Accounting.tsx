import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { DataTable } from '@/components/common/DataTable';

export default function AccountingOverview() {
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);

  const [month, setMonth] = useState<string>('');
  const [year, setYear] = useState<string>('');
  const navigate = useNavigate();
const [startDate, setStartDate] = useState<string>('');
const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
   const params: Record<string, string> = {};
if (startDate) params.startDate = startDate;
if (endDate) params.endDate = endDate;


  api.get('/api/invoices/overview', { params }).then((res) => {
  setInvoices(res.data?.invoices || []);
});
  }, [startDate, endDate]);


const columns = [
  // CLIENT INFO SECTION (light blue)
  { accessorKey: 'invoiceNumber', header: 'Invoice Number' },
  { accessorKey: 'purchaseOrder', header: 'Purchase Order' },
  { accessorKey: 'clientName', header: 'Client Name' },
  { accessorKey: 'clientCompanyNumber', header: 'Order by ' },
  { accessorKey: 'invoiceDate', header: 'Invoice Date' },
  { accessorKey: 'dueDate', header: 'Date to be receive' },
  {
    accessorKey: 'price',
    header: 'Amount',
    cell: (row: InvoiceSummary) =>
      typeof row.price === 'number' ? `$${row.price.toFixed(2)}` : '-',
  },
  {
    accessorKey: 'additionalCharges',
    header: 'Additional Charges',
    cell: (row: InvoiceSummary) =>
      typeof row.additionalCharges === 'number'
        ? `$${row.additionalCharges.toFixed(2)}` : '-',
  },
  {
    accessorKey: 'amount',
    header: 'Total',
    cell: (row: InvoiceSummary) =>
      typeof row.amount === 'number'
        ? `$${(row.amount).toFixed(2)}`
        : '-',
  },
  { accessorKey: 'clientStatus', header: 'Status' },

  // CARRIER INFO SECTION (brown)
  { accessorKey: 'carrierName', header: 'Carrier' },
  {
    accessorKey: 'cost',
    header: 'Cost',
    cell: (row: InvoiceSummary) =>
      typeof row.cost === 'number' ? `$${row.cost.toFixed(2)}` : '-',
  },
  {
    accessorKey: 'costAdditionalcharges',
    header: 'Add. Charges', // optional, if exists
    cell: (row: InvoiceSummary) =>
      typeof row.costAdditionalcharges === 'number' ? `$${row.costAdditionalcharges.toFixed(2)}` : '-',
  },
  {
    accessorKey: 'costTotal',
    header: 'Cost + Add Charges',
    cell: (row: InvoiceSummary) =>
      typeof row.cost === 'number' && typeof row.additionalCharges === 'number'
        ? `$${(row.cost + row.costAdditionalcharges).toFixed(2)}`
        : '-',
  },
  { accessorKey: 'carrierDate', header: 'Due Date' },
  { accessorKey: 'carrierStatus', header: 'Status' },

  // PROFIT SECTION (pink)
  {
    accessorKey: 'netProfit',
    header: 'House Profit',
    cell: (row: InvoiceSummary) =>
      typeof row.netProfit === 'number' ? `$${row.netProfit.toFixed(2)}` : '-',
  },
];

const allInvoices = invoices;

  return (
    <div className="p-4 space-y-4">
    <div className="flex space-x-2 items-center">
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

  <Button variant="outline" onClick={() => navigate('/accounting/clients')}>
    View Ressources
  </Button>
  <Button variant="outline" onClick={() => navigate('/accounting/carriers')}>
    View Expenses
  </Button>
</div>

      <div>
        <h2 className="font-semibold mb-2">All Invoices</h2>
        <DataTable columns={columns} data={allInvoices} title="Invoices" />
      </div>
    </div>
  );
}
