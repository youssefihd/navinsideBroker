export interface InvoiceSummary {
  id: number;
  invoiceNumber: string;
  purchaseOrder: string;
  clientName: string;
  clientEmail: string;
  carrierName: string;
  invoiceDate: string | null;
  dueDate: string;
  carrierDate: string | null;
  status: string;
  price: number | null;
  cost: number | null;
  amount: number | null;
  additionalCharges: number | null;
  netProfit: number | null;
  accountManagerPourcentage: number | null;
  type: string;
  clientInvoice: boolean;
  carrierInvoice: boolean;
  costAdditionalcharges: number | null; 
}
