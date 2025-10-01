import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/lib/axios";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import AutocompleteInput from "@/components/common/AutoCompleteInput";
import { useTranslation } from "react-i18next";
import { FileUpload } from "primereact/fileupload";
import ReactSelect from "react-select";
import { Eye, MapPin, CalendarClock, PackagePlus, Trash2, Plus, ArrowLeftRight } from "lucide-react";
import mapLoadToForm from "@/components/utils/formMapper";
import ChecklistTaskViewer from "./ChecklistDisplayComponent";




/* ---------------------------------
   Helpers & constants
---------------------------------- */

const STATUS_CANONICAL = [
  "Quoting",
  "Confirmed",
  "PickedUp",
  "In Transit",
  "Delivered",
  "Cancelled",
  "Lost",
] as const;
type StatusValue = (typeof STATUS_CANONICAL)[number];

const NORMALIZE_STATUS: Record<string, StatusValue> = {
  quoting: "Quoting",
  confirmed: "Confirmed",
  pickedup: "PickedUp",
  "in transit": "In Transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
  canceled: "Cancelled",
  lost: "Lost",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  CANCELED: "Cancelled",
  LOST: "Lost",
};

const fixStatus = (s?: string): StatusValue => {
  if (!s) return "Quoting";
  const key = String(s).trim();
  return NORMALIZE_STATUS[key] || (STATUS_CANONICAL.includes(key as StatusValue) ? (key as StatusValue) : "Quoting");
};

const countryProvinceMap: Record<string, string[]> = {
  CANADA: [
    "Ontario","Quebec","British Columbia","Alberta","Manitoba","New Brunswick",
    "Newfoundland and Labrador","Nova Scotia","Prince Edward Island","Saskatchewan",
  ],
  USA: [
    "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia",
    "Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts",
    "Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey",
    "New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island",
    "South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
    "Wisconsin","Wyoming",
  ],
};

const toInputDate = (d?: Date | string | null) => {
  if (!d) return "";
  const dd = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dd.getTime())) return "";
  return dd.toISOString().slice(0, 10);
};


// (removed duplicate) computeFreightTotals is defined once inside the component below.


/* ---------------------------------
   Types
---------------------------------- */

interface AdditionalChargeDTO {
  name: string;
  amount: number;
  type: "price" | "cost";
}

type AnyObj = Record<string, any>;

/* ---------------------------------
   UI shells
---------------------------------- */

function SectionCard({
  title,
  cta,
  children,
  className = "",
}: {
  title?: string;
  cta?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-sky-100/60 bg-white/90 p-4 shadow-sm ${className}`}>
      {(title || cta) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {cta}
        </div>
      )}
      {children}
    </section>
  );
}


/* ---------------------------------
   Tiny Header Checklist (unchanged)
---------------------------------- */

function MiniChecklist({
  loadKey,
  items,
}: {
  loadKey: string;
  items: Array<{ id: string; title: string }>;
}) {
  const storageKey = `mini-checklist:${loadKey}`;
  const [completed, setCompleted] = useState<number>(() => {
    const saved = localStorage.getItem(storageKey);
    const n = saved ? Number(saved) : 0;
    return Number.isFinite(n) ? n : 0;
  });

  useEffect(() => {
    localStorage.setItem(storageKey, String(completed));
  }, [storageKey, completed]);

  const visible = items.slice(0, Math.min(items.length, completed + 1));

  return (
    <div className="flex flex-col gap-1 w-60">
      <div className="text-[11px] uppercase text-gray-500">Checklist</div>
      <div className="rounded-xl border bg-white/70 p-2">
        {visible.map((it, idx) => {
          const isDone = idx < completed;
          return (
            <label
              key={it.id}
              className={`group flex items-center gap-2 rounded-md px-2 py-1 transition-all duration-300 ${isDone ? "opacity-60" : "opacity-100"}`}
            >
              <input
                type="checkbox"
                checked={isDone}
                onChange={() => {
                  if (!isDone && idx === completed) setCompleted((c) => Math.min(c + 1, items.length));
                  if (isDone) setCompleted(idx);
                }}
                className="h-4 w-4 accent-sky-600 cursor-pointer"
              />
              <span className="text-xs">{it.title}</span>
            </label>
          );
        })}
        {completed >= items.length && (
          <div className="mt-1 text-[11px] text-emerald-600 font-semibold">All done ✔</div>
        )}
      </div>
    </div>
  );
}

function PageHeader({
  id,
  nextId,
  status,
  onStatusChange,
  onSave,
  onDownloadLC,
  onDownloadBOL,
  onInvoice,
}: {
  id?: string;
  nextId?: number | null;
  status: StatusValue;
  onStatusChange: (v: StatusValue) => void;
  onSave: () => void;
  onDownloadLC: () => void;
  onDownloadBOL: () => void;
  onInvoice: () => void;
}) {

// mini checklist removed from header

  return (
    <div className="sticky top-0 z-20 rounded-2xl border border-sky-100/60 bg-gradient-to-br from-white via-sky-50/40 to-violet-50/40 p-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-[11px] uppercase text-gray-500">Load ID</div>
            <div className="font-semibold text-gray-900">{id ?? nextId ?? "New Load"}</div>
          </div>
          <div className="h-6 w-px bg-sky-100" />
          <div>
            <div className="text-[11px] uppercase text-gray-500">Status</div>
            <Select value={status} onValueChange={(v) => onStatusChange(v as StatusValue)}>
              <SelectTrigger className="h-8 w-44 text-xs">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_CANONICAL.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

           {/* mini checklist removed */}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onDownloadLC}>
            Load Confirmation
          </Button>
          <Button variant="outline" onClick={onDownloadBOL}>
            Bill of Lading
          </Button>
          <Button variant="outline" onClick={onInvoice}>
            Invoice
          </Button>
          <Button className="bg-gradient-to-r from-sky-600 to-violet-600 text-white" onClick={onSave}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------
   Collapsible update message
---------------------------------- */

function UpdateMessage({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const COLLAPSE_LIMIT = 180;
  const isLong = (text?.length ?? 0) > COLLAPSE_LIMIT;
  const displayText = expanded ? text : (text || "").slice(0, COLLAPSE_LIMIT);

  return (
    <div className="bg-gray-100 p-2 rounded">
      <p className="whitespace-pre-wrap break-all">
        {displayText}
        {!expanded && isLong ? "…" : ""}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs text-blue-600 hover:underline"
        >
          {expanded ? "View less" : "View more"}
        </button>
      )}
    </div>
  );
}

/* ---------------------------------
   Main component
---------------------------------- */

export default function CreateLoad() {
  const { t } = useTranslation();
  const { id: paramId } = useParams();
  const id = paramId;
  const navigate = useNavigate();

  const [load, setLoad] = useState<any | null>(null);
  const [invoiceSent, setInvoiceSent] = useState(false);
  const [message, setMessage] = useState("");

  const [clients, setClients] = useState<any[]>([]);
  const [carriers, setCarriers] = useState<any[]>([]);
  const [shippers, setShippers] = useState<any[]>([]);
  const [consignees, setConsignees] = useState<any[]>([]);
  const [equipments, setEquipments] = useState<any[]>([]);
  const [updates, setUpdates] = useState<any[]>([]);
  const [newUpdate, setNewUpdate] = useState("");

  const [status, setStatus] = useState<StatusValue>("Quoting");
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [carrierRating, setCarrierRating] = useState<number>(0);

  const [showCharges, setShowCharges] = useState(false);
  const [chargeType, setChargeType] = useState<"price" | "cost">("price");
  const [additionalCharges, setAdditionalCharges] = useState<AdditionalChargeDTO[]>([]);

  const [nextId, setNextId] = useState<number | null>(null);
const [showCarrierDetails, setShowCarrierDetails] = useState(false);
const [showAppointmentSheet, setShowAppointmentSheet] = useState(false);
const [showFreightSheet, setShowFreightSheet] = useState(false);

// NEW: cross-border customs sheet + icon animation + data bucket
const [showCustomsSheet, setShowCustomsSheet] = useState(false);
const [mirrorFlip, setMirrorFlip] = useState(false);
const [customs, setCustoms] = useState<{
  brokerCompany: string;
  brokerEmail: string;
  brokerPhone: string;
  papsPars: string;      // value typed by user
  entryNumber: string;   // value typed by user
  invoiceUrl?: string;   // returned by server after upload (optional)
}>({
  brokerCompany: "",
  brokerEmail: "",
  brokerPhone: "",
  papsPars: "",
  entryNumber: "",
  invoiceUrl: undefined,
});


  const [form, setForm] = useState<AnyObj>({
    status: "Quoting",
    trackingNumber: "",
    purchaseOrder: "",
    clientId: null,

    // Shipper
    shipperId: null,
    shipperCompanyName: "",
    shipperContact: "",
    shipperEmail: "",
    shipperPhoneNumber: "",
    shipperAddress: "",
    shipperCity: "",
    shipperPostalCode: "",
    shipperProvince: "",
    shipperCountry: "",


    // Consignee
    consigneeId: null,
    consigneeCompanyName: "",
    consigneeContact: "",
    consigneePhoneNumber: "",
    consigneeAddress: "",
    consigneeCity: "",
    consigneePostalCode: "",
    consigneeProvince: "",
    consigneeCountry: "",



    // Equipment
    equipmentIds: [] as number[],

    // Load meta
    type: "",
    loadType: "",
    dimensions: "",
    quantity: "",
    weight: "",

    // Dates/Times
    pickupDate: null as Date | null,
    deliveryDate: null as Date | null,
    shippingHours: "",
    receivingHours: "",
    startShippingHours: "",
    endShippingHours: "",
    startReceivingHours: "",
    endReceivingHours: "",

    // Money
    price: "0",
    cost: "0",
    costAdditionalCharges: "0",
    priceAdditionalCharges: "0",
    totalCost: "0",
    totalPrice: "0",
    profit: "0",
    profitPourcentage: "0",

    // Carrier (normalized names)
    carrierId: null,
    carrierCompanyName: "",
    carrierDispatcher: "",
    carrierEmail: "",
    carrierAddress: "",
    carrierCompanyNumber: "",

    // Other
    appointment: "",
    codType: "COLLECT",
    additionalInformation: "",
    additionalShipper: "",
    rating: 0,

    // Generated numbers
    pickupNumber: "",
    dropoffNumber: "",

    //freightItems

     freightItems: [] as Array<{
    id: string;
    equipmentId?: number | null;
    kind: string;             // e.g. Pallet / Piece
    length: string;
    width: string;
    height: string;
    dimUnit: "in" | "cm";
    weightPerUnit: string;
    weightUnit: "lb" | "kg";
    quantity: string;
  }>,
});

  /* ---------------------------------
     Derived memo for react-select
  ---------------------------------- */
  const equipmentOptions = useMemo(
    () => equipments.map((e) => ({ value: e.id, label: e.type })),
    [equipments]
  );
  const equipmentValue = useMemo(
    () => equipmentOptions.filter((o) => (form.equipmentIds ?? []).includes(o.value)),
    [equipmentOptions, form.equipmentIds]
  );

  /* ---------------------------------
     One true fetchLoad
  ---------------------------------- */
  const fetchLoad = useCallback(
    async (theId: string | number) => {
      try {
        const res = await api.get(`/loads/${theId}`);
        const data = res.data;
        setLoad(data);
        setForm((prev) => {
          const mapped = mapLoadToForm ? mapLoadToForm(data, prev) : prev;
          const normalizedStatus = fixStatus(data?.status);
          return {
            ...mapped,
            status: normalizedStatus,
            pickupDate: data.pickupDate ? new Date(data.pickupDate) : null,
            deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
            pickupNumber: data.pickupNumber ?? "",
            dropoffNumber: data.dropoffNumber ?? "",
            // carrier
            carrierId: data.carrier?.id ?? null,
            carrierCompanyName: data.carrier?.companyName ?? "",
            carrierDispatcher: data.carrier?.dispatcher ?? "",
            carrierEmail: data.carrier?.email ?? "",
            carrierAddress: data.carrier?.address ?? "",
            carrierCompanyNumber: data.carrier?.companyNumber ?? "",
            // equipment
            equipmentIds: Array.isArray(data.equipements) ? data.equipements.map((eq: any) => eq.id) : [],
          };
        });
        setStatus(fixStatus(data?.status));
        setCarrierRating(data?.carrier?.rating ?? 0);
      } catch (err) {
        console.error("Failed to fetch load:", err);
      }
    },
    []
  );

   /* ---------------------------------
     fo dimensions
  ---------------------------------- */
  const KG_TO_LB = 2.20462;

function toNumber(n: any) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

function computeFreightTotals(items: AnyObj[]) {
  let totalQty = 0;
  let totalWeightLb = 0;

  const parts: string[] = [];

  for (const it of items) {
    const qty = toNumber(it.quantity);
    const wPer = toNumber(it.weightPerUnit);
    const w = it.weightUnit === "kg" ? wPer * KG_TO_LB : wPer;

    totalQty += qty;
    totalWeightLb += w * qty;

    // “2× 48×40×60in (Pallet)” style chunk
    const unit = it.dimUnit || "in";
    const label = it.kind || "Item";
    if (qty && it.length && it.width && it.height) {
      parts.push(`${qty}× ${it.length}×${it.width}×${it.height}${unit} (${label})`);
    }
  }

  return {
    totalQty,
    totalWeightLb: Math.round(totalWeightLb * 100) / 100,
    dimsString: parts.join("; "),
  };
}


  /* ---------------------------------
     Effects
  ---------------------------------- */

  useEffect(() => {
    if (!id) {
      api
        .get("/loads/next-id")
        .then((res) => setNextId(res.data))
        .catch((err) => console.error("Failed to fetch next load ID", err));
    }
  }, [id]);

  useEffect(() => {
    (async () => {
      try {
        const [clientRes, carrierRes, shipperRes, consigneeRes, equipRes] = await Promise.all([
          api.get("/clients"),
          api.get("/carriers"),
          api.get("/shippers"),
          api.get("/consignees"),
          api.get("/equipements"),
        ]);
        setClients(clientRes.data);
        setCarriers(carrierRes.data);
        setShippers(shipperRes.data);
        setConsignees(consigneeRes.data);
        setEquipments(equipRes.data);

        if (id) await fetchLoad(id);
      } catch (err) {
        toast({ title: t("error"), description: t("error_loading") });
        console.error(err);
      }
    })();
  }, [id, t, fetchLoad]);

  useEffect(() => {
    if (!id) return;
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/loads/${id}/status`);
        const s = fixStatus(res.data.status);
        setStatus(s);
      } catch (err) {
        console.error("Failed to fetch status", err);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [id]);



   const cost = Number(form.cost) || 0

  useEffect(() => {
    if (!id) return;
    api
      .get(`/loads/${id}/updates`)
      .then((res) => setUpdates(res.data))
      .catch(() => toast({ title: t("error"), description: t("error_loading") }));
  }, [id, t]);

  /* ---------------------------------
     Handlers
  ---------------------------------- */

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "pickupDate" || name === "deliveryDate") {
      setForm((prev) => ({ ...prev, [name]: value ? new Date(value) : null }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleStatusChange = async (newStatus: StatusValue) => {
    const s = fixStatus(newStatus);
    setStatus(s);
    setForm((prev) => ({ ...prev, status: s }));
    if (id) {
      try {
        await api.patch(`/loads/${id}/status`, { status: s });
        if (s === "Delivered") setShowRatingModal(true);
      } catch (error) {
        console.error("Failed to update status", error);
        toast({ title: t("error"), description: t("submit_fail") });
      }
    } else {
      if (s === "Delivered") setShowRatingModal(true);
    }
  };

 const openCharges = async (type: "price" | "cost") => {
  setChargeType(type);

  // reset first so we don't see stale rows when the sheet opens
  setAdditionalCharges([]);
  setShowCharges(true);

  if (!id) return;

  try {
    const res = await api.get(`/loads/${id}/additional-charges?type=${type}`);
    const rows = (Array.isArray(res.data) ? res.data : []).filter(
      (c: any) => (Number(c?.amount) || 0) !== 0 || String(c?.name || "").trim() !== ""
    );
    setAdditionalCharges(rows);
  } catch (err) {
    console.error("Failed to fetch charges", err);
  }
};


  const updateCharge = (index: number, field: "name" | "amount", value: string) => {
    setAdditionalCharges((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: field === "amount" ? parseFloat(value || "0") : value,
        type: chargeType,
      };
      return updated;
    });
  };

  const addNewCharge = () => {
    setAdditionalCharges((prev) => [...prev, { name: "", amount: 0, type: chargeType }]);
  };

// helper: best-effort clear on server across different backends
const tryClearCharges = async (loadId: string | number, type: "price" | "cost") => {
  const attempt = async (fn: () => Promise<any>) => {
    try {
      await fn();
      return true;
    } catch (e: any) {
      const sc = e?.response?.status;
      if (sc === 401) throw e;              // bubble up auth issues
      if ([400, 404, 405].includes(sc)) return false; // try next pattern
      throw e;                              // unknown error -> stop
    }
  };

  // 1) DELETE with query ?type
  if (await attempt(() => api.delete(`/loads/${loadId}/additional-charges`, { params: { type } }))) return;

  // 2) DELETE with segment /:type
  if (await attempt(() => api.delete(`/loads/${loadId}/additional-charges/${type}`))) return;

  // 3) POST to a "clear" endpoint (common pattern)
  if (await attempt(() => api.post(`/loads/${loadId}/additional-charges/clear`, { type }))) return;

  // 4) PUT replace with empty list (idempotent)
  if (await attempt(() => api.put(`/loads/${loadId}/additional-charges`, []))) return;

  // 5) POST empty list (some servers interpret as replace)
  await attempt(() => api.post(`/loads/${loadId}/additional-charges`, []));
};

const saveCharges = async () => {
  // sanitize + drop blanks
  const cleaned = additionalCharges
    .map((c) => ({ ...c, name: String(c.name ?? "").trim() }))
    .filter((c) => (Number(c.amount) || 0) !== 0 || c.name !== "");

  try {
    if (id) {
      // clear existing server-side rows using robust fallback strategy
      await tryClearCharges(id, chargeType);

      // then (re)create if we still have any
      if (cleaned.length) {
        // try PUT (replace) first; fall back to POST (create/merge)
        try {
          await api.put(`/loads/${id}/additional-charges`, cleaned.map((c) => ({ ...c, type: chargeType })));
        } catch (e: any) {
          if (![400, 404, 405].includes(e?.response?.status)) throw e;
          await api.post(`/loads/${id}/additional-charges`, cleaned.map((c) => ({ ...c, type: chargeType })));
        }
      }
    }

    // update UI totals
    const total = cleaned.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    setForm((prev) => ({
      ...prev,
      ...(chargeType === "price"
        ? { priceAdditionalCharges: String(total) }
        : { costAdditionalCharges: String(total) }),
    }));

    setAdditionalCharges(cleaned);
    setShowCharges(false);

    toast({
      title: "Success",
      description: cleaned.length ? "Charges saved." : "Charges cleared.",
    });
  } catch (error: any) {
    if (error?.response?.status === 401) {
      toast({ title: "Session expired", description: "Please sign in again." });
    } else {
      console.error(error);
      toast({ title: "Error", description: "Failed to save charges." });
    }
  }
};


  const postUpdate = async () => {
    if (!id || !newUpdate.trim()) return;
    try {
      await api.post(`/loads/${id}/updates`, { message: newUpdate });
      const res = await api.get(`/loads/${id}/updates`);
      setUpdates(res.data);
      setNewUpdate("");
    } catch {
      toast({ title: t("error"), description: t("submit_fail") });
    }
  };

  const downloadPdf = async () => {
    if (!id) return;
    try {
      const response = await api.get(`/pdf/loadconfirmation/${id}`, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `LoadConfirmation_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: t("error"), description: t("download_load_confirmation") });
    }
  };

  const downloadBillOfLading = async () => {
    if (!id) return;
    try {
      const response = await api.get(`/pdf/billoflading/${id}`, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `BillOfLading_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: t("error"), description: t("download_bol") });
    }
  };

  const viewInvoice = async () => {
    if (!id) return;
    try {
      const response = await api.get(`/pdf/invoice/${id}`, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `INVOICE_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: t("error"), description: t("view_invoice") });
    }
  };

  const sendInvoice = async () => {
    if (!id) return;
    try {
      await api.post(`/pdf/invoice/send/${id}`);
      setInvoiceSent(true);
      setMessage("✅ Invoice sent successfully!");
      toast({ title: "Success", description: "Invoice sent to client successfully!" });
    } catch {
      toast({ title: t("error"), description: t("send_invoice") });
      setMessage("❌ Failed to send invoice.");
    }
  };

  // --- money helpers & derived totals ---
const toMoney = (n: number | string) => {
  const v = Number(n) || 0;
  return `$${v.toFixed(2)}`;
};
const num = (v: any) => Number(v) || 0;

const fin = useMemo(() => {
  const priceBase = num(form.price);
  const priceAdd  = num(form.priceAdditionalCharges);
  const priceTot  = priceBase + priceAdd;

  const costBase  = num(form.cost);
  const costAdd   = num(form.costAdditionalCharges);
  const costTot   = costBase + costAdd;

  const profit    = priceTot - costTot;
  const profitPct = priceTot > 0 ? (profit / priceTot) * 100 : 0;

  return { priceBase, priceAdd, priceTot, costBase, costAdd, costTot, profit, profitPct };
}, [form.price, form.priceAdditionalCharges, form.cost, form.costAdditionalCharges]);

// Keep the "right panel" in sync without manual math
useEffect(() => {
  setForm((prev: AnyObj) => {
    const next = {
      ...prev,
      totalPrice: String(fin.priceTot.toFixed(2)),
      totalCost: String(fin.costTot.toFixed(2)),
      profit: String(fin.profit.toFixed(2)),
      profitPourcentage: String(fin.profitPct.toFixed(2)),
    };
    // Avoid unnecessary state churn
    const changed =
      next.totalPrice !== prev.totalPrice ||
      next.totalCost !== prev.totalCost ||
      next.profit !== prev.profit ||
      next.profitPourcentage !== prev.profitPourcentage;
    return changed ? next : prev;
  });
}, [fin.priceTot, fin.costTot, fin.profit, fin.profitPct]);

const removeCharge = (index: number) => {
  setAdditionalCharges(prev => prev.filter((_, i) => i !== index));
  // If you want immediate persistence when deleting, also call:
  // saveCharges();
};

  /* ---------------------------------
     Payload conversion & submit
  ---------------------------------- */

 const formToPayload = (f: AnyObj) => {
  const totals = computeFreightTotals(f.freightItems || []);

  return {
    ...f,
    id: id ? parseInt(id) : undefined,
    pickupDate: f.pickupDate instanceof Date ? f.pickupDate.toISOString() : null,
    deliveryDate: f.deliveryDate instanceof Date ? f.deliveryDate.toISOString() : null,

    // coerce numbers
    price: Number(f.price) || 0,
    cost: Number(f.cost) || 0,
    costAdditionalCharges: Number(f.costAdditionalCharges) || 0,
    priceAdditionalCharges: Number(f.priceAdditionalCharges) || 0,
    totalCost: Number(f.totalCost) || 0,
    totalPrice: Number(f.totalPrice) || 0,
    profit: Number(f.profit) || 0,
    profitPourcentage: String(f.profitPourcentage ?? "0"),

    clientId: f.clientId ? Number(f.clientId) : null,
    pickUpId: f.shipperId ? Number(f.shipperId) : null,
    deliveryId: f.consigneeId ? Number(f.consigneeId) : null,
    equipementIds: (f.equipmentIds ?? []).map((x: any) => Number(x)),
    type: f.type,

    // override flat fields with computed totals
    dimensions: totals.dimsString,
    weight: String(totals.totalWeightLb), // in lb
    quantity: String(totals.totalQty),

    carrier: {
      id: f.carrierId ?? null,
      rating: Number(f.rating ?? carrierRating) || 0,
    },
    status: fixStatus(f.status),
  };
};


  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const payload = formToPayload(form);

    try {
      let updatedLoadId: any = id;

      if (id) {
        const res = await api.put(`/loads/${id}`, payload);
        updatedLoadId = res.data.id || id;
        toast({ title: t("update_success") });
      } else {
        const res = await api.post("/loads", payload);
        updatedLoadId = res.data?.id;
        toast({ title: t("submit_success") });
        if (updatedLoadId) navigate(`/loads/${updatedLoadId}`);
      }

      if (updatedLoadId) {
        const full = await api.get(`/loads/${updatedLoadId}`);
        setForm((prev) => ({
          ...prev,
          ...full.data,
          pickupDate: full.data.pickupDate ? new Date(full.data.pickupDate) : null,
          deliveryDate: full.data.deliveryDate ? new Date(full.data.deliveryDate) : null,
          pickupNumber: full.data.pickupNumber ?? "",
          dropoffNumber: full.data.dropoffNumber ?? "",
        }));
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({ title: t("error"), description: t("submit_fail") });
    }
  };

  /* ---------------------------------
     Selected consignee
  ---------------------------------- */
  const selectedConsignee = consignees.find((c) => c.id === form.consigneeId);

  /* ---------------------------------
     Render
  ---------------------------------- */

const mapsUrl =
  `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(form.shipperPostalCode || "")}` +
  `&destination=${encodeURIComponent(form.consigneePostalCode || "")}`;

// NEW: cross-border helpers
const shipC = (form.shipperCountry || "").toUpperCase();
const consC  = (form.consigneeCountry || "").toUpperCase();
const isCAorUS = (c: string) => c === "CANADA" || c === "USA";
const isCrossBorder =
  shipC && consC && shipC !== consC && isCAorUS(shipC) && isCAorUS(consC);

// Direction is relative to the destination country's import side
const customsDirection =
  isCrossBorder
    ? (consC === "USA" ? "US Import (CAN → USA)" : "Canada Import (USA → CAN)")
    : "";

// PAPS for US-bound imports, PARS for Canada-bound imports
const papsParsLabel =
  !isCrossBorder ? "PAPS / PARS" : (consC === "USA" ? "PAPS" : "PARS");


  return (
    <div className="max-w-[1400px] mx-auto mt-4 p-2 space-y-4">
      {/* Header with Mini Checklist */}
      <PageHeader
        id={id}
        nextId={nextId}
        status={status}
        onStatusChange={handleStatusChange}
        onSave={handleSubmit}
        onDownloadLC={downloadPdf}
        onDownloadBOL={downloadBillOfLading}
        onInvoice={viewInvoice}
      />

      {/* Top row: General (left) + Carrier (right) — equal height */}
{/* Top row: General (70%) + Carrier (30%) */}
<div className="flex w-full items-stretch gap-4">
  {/* GENERAL (70%) */}
  <SectionCard title="General" className="basis-[70%]">
    {/* Row 1: Equipment - Type - Client */}
    <div className="grid gap-3 md:grid-cols-3">
      {/* Equipment multiselect */}
      <div>
        <label className="block text-xs font-medium mb-1">Equipment</label>
        <ReactSelect
          isMulti
          options={equipmentOptions}
          value={equipmentValue}
          onChange={(selected: any) =>
            setForm((p: AnyObj) => ({
              ...p,
              equipmentIds: (selected ?? []).map((o: any) => o.value),
            }))
          }
        />
      </div>

      {/* Type */}
      <div>
        <label className="block text-xs font-medium mb-1">Type</label>
        <Select
          value={form.type}
          onValueChange={(val) => setForm((p: AnyObj) => ({ ...p, type: val }))}
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="LTL">LTL</SelectItem>
            <SelectItem value="FTL">FTL</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Client */}
      <div>
        <label className="block text-xs font-medium mb-1">{t("client")}</label>
        <AutocompleteInput
          value={
            clients.find((c) => c.id === form.clientId)
              ? { id: form.clientId, label: clients.find((c) => c.id === form.clientId)?.companyName }
              : null
          }
          onChange={(val) => setForm((p: AnyObj) => ({ ...p, clientId: val?.id ?? null }))}
          suggestions={clients.map((c) => ({ id: c.id, label: c.companyName }))}
        />
      </div>
    </div>

    {/* Row 2: Pickup - Dropoff - Purchase Order */}
    <div className="mt-3 grid gap-3 md:grid-cols-3">
      <div>
        <label className="block text-xs font-medium mb-1">Pickup Number</label>
        <Input value={form.pickupNumber} readOnly className="h-9 bg-gray-100" />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Dropoff Number</label>
        <Input value={form.dropoffNumber} readOnly className="h-9 bg-gray-100" />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">{t("purchaseOrder")}</label>
        <Input
          name="purchaseOrder"
          value={form.purchaseOrder || ""}
          onChange={handleChange}
          className="h-9"
        />
      </div>
    </div>
  </SectionCard>

{/* CHECKLIST (replaces Carrier spot) */}
<SectionCard title="Checklist" className="basis-[30%] flex-shrink-0 self-stretch">
  {(() => {
    const loadKeyForChecklist =
      (typeof form?.loadId === "string" && form.loadId) ||
      (typeof form?.loadId === "number" && String(form.loadId)) ||
      (id ?? nextId ?? "new-load");

    return (
      <ChecklistTaskViewer
  loadKey={String(id ?? nextId ?? "new-load")}
  origin={(form.shipperCountry || "").toUpperCase()}
  destination={(form.consigneeCountry || "").toUpperCase()}
  equipmentIds={form.equipmentIds || []}
  type={form.type ? [form.type] : []}
  originProvince={form.shipperProvince || ""}          // will be sent ("" if none)
  destinationProvince={form.consigneeProvince || ""}   // will be sent ("" if none)
  clientId={form.clientId ? Number(form.clientId) : 0} // will be sent (0 if none)
/>

    );
  })()}
</SectionCard>
</div>


{/* Carrier details popup (sheet) — non-modal, ignore outside clicks from the opener */}
<Sheet open={showCarrierDetails} onOpenChange={setShowCarrierDetails} modal={false}>
  <SheetContent
    side="right"
    className="w-[420px] sm:w-[520px]"
    // stop the initial click from immediately closing the sheet
    onPointerDownOutside={(e) => e.preventDefault()}
    onInteractOutside={(e) => e.preventDefault()}
    onEscapeKeyDown={(e) => e.preventDefault()} // optional: disable ESC-close if you want
  >
 <SheetHeader>
  <SheetTitle>Carrier — Details</SheetTitle>
  <SheetDescription className="sr-only">View and edit carrier contact information.</SheetDescription>
</SheetHeader>


    <div className="mt-4 grid gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1">Contact</label>
          <Input
            name="carrierDispatcher"
            value={form.carrierDispatcher || ""}
            onChange={handleChange}
            className="h-9"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Company Number</label>
          <Input
            name="carrierCompanyNumber"
            value={form.carrierCompanyNumber || ""}
            onChange={handleChange}
            className="h-9"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Address</label>
        <Input
          name="carrierAddress"
          value={form.carrierAddress || ""}
          onChange={handleChange}
          className="h-9"
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Email</label>
        <Input
          name="carrierEmail"
          value={form.carrierEmail || ""}
          onChange={handleChange}
          className="h-9"
        />
      </div>
    </div>
  </SheetContent>
</Sheet>

{/* Appointment side panel */}
<Sheet open={showAppointmentSheet} onOpenChange={setShowAppointmentSheet}>
  <SheetContent side="right" className="w-[420px] sm:w-[520px]">
<SheetHeader>
  <SheetTitle>Appointments</SheetTitle>
  <SheetDescription className="sr-only">Manage pickup and delivery appointment date and time.</SheetDescription>
</SheetHeader>


    <div className="mt-4 space-y-5">
      {/* Pickup appointment */}
      <div className="rounded-2xl border p-3">
        <div className="text-sm font-medium mb-2">Pick-up appointment</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">Date</label>
            <Input
              name="pickupDate"
              type="date"
              value={toInputDate(form.pickupDate)}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Time</label>
            <Input
              type="time"
              value={form.startShippingHours || ""}
              onChange={(e) =>
                setForm((p: AnyObj) => ({
                  ...p,
                  startShippingHours: e.target.value,
                  appointment: "yes",
                }))
              }
            />
          </div>
        </div>
      </div>

      {/* Delivery appointment */}
      <div className="rounded-2xl border p-3">
        <div className="text-sm font-medium mb-2">Delivery appointment</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">Date</label>
            <Input
              name="deliveryDate"
              type="date"
              value={toInputDate(form.deliveryDate)}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Time</label>
            <Input
              type="time"
              value={form.startReceivingHours || ""}
              onChange={(e) =>
                setForm((p: AnyObj) => ({
                  ...p,
                  startReceivingHours: e.target.value,
                  appointment: "yes",
                }))
              }
            />
          </div>
        </div>
      </div>
    </div>
  </SheetContent>
</Sheet>

{/* Freight lines side panel */}
<Sheet open={showFreightSheet} onOpenChange={setShowFreightSheet}>
  <SheetContent side="right" className="w-[720px] sm:w-[820px] max-w-[95vw]">
    <SheetHeader>
      <SheetTitle>Freight Dimensions</SheetTitle>
      <SheetDescription className="sr-only">
        Add pallets or pieces with dimensions, units, weights, and quantities.
      </SheetDescription>
    </SheetHeader>

    <div className="mt-4 space-y-3">
      {(form.freightItems || []).map((it: AnyObj, idx: number) => (
        <div key={it.id} className="rounded-xl border p-3 bg-white space-y-3">
          {/* Card header with Qty + Delete */}
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-gray-600">Line {idx + 1}</div>
            <div className="flex items-center gap-2">
              <div className="w-[90px]">
                <label className="block text-[11px] font-medium mb-1">Qty</label>
                <Input
                  value={it.quantity || "1"}
                  onChange={(e) =>
                    setForm((p: AnyObj) => {
                      const items = [...(p.freightItems || [])];
                      items[idx] = { ...items[idx], quantity: e.target.value };
                      return { ...p, freightItems: items };
                    })
                  }
                  className="h-9 text-right"
                  placeholder="1"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() =>
                  setForm((p: AnyObj) => ({
                    ...p,
                    freightItems: (p.freightItems || []).filter((x: AnyObj) => x.id !== it.id),
                  }))
                }
                aria-label="Remove line"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 1) Commodity */}
          <div>
            <label className="block text-xs font-medium mb-1">Commodity</label>
            <Input
              value={it.kind || ""}
              onChange={(e) =>
                setForm((p: AnyObj) => {
                  const items = [...(p.freightItems || [])];
                  items[idx] = { ...items[idx], kind: e.target.value };
                  return { ...p, freightItems: items };
                })
              }
              placeholder="e.g. Pallet / Cartons"
              className="h-9"
            />
          </div>

          {/* 2) Dimensions (L × W × H) */}
          <div>
            <label className="block text-xs font-medium mb-1">Dimensions (L × W × H)</label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="L"
                value={it.length || ""}
                onChange={(e) =>
                  setForm((p: AnyObj) => {
                    const items = [...(p.freightItems || [])];
                    items[idx] = { ...items[idx], length: e.target.value };
                    return { ...p, freightItems: items };
                  })
                }
                className="h-9"
              />
              <Input
                placeholder="W"
                value={it.width || ""}
                onChange={(e) =>
                  setForm((p: AnyObj) => {
                    const items = [...(p.freightItems || [])];
                    items[idx] = { ...items[idx], width: e.target.value };
                    return { ...p, freightItems: items };
                  })
                }
                className="h-9"
              />
              <Input
                placeholder="H"
                value={it.height || ""}
                onChange={(e) =>
                  setForm((p: AnyObj) => {
                    const items = [...(p.freightItems || [])];
                    items[idx] = { ...items[idx], height: e.target.value };
                    return { ...p, freightItems: items };
                  })
                }
                className="h-9"
              />
            </div>
          </div>

          {/* 3) Weight + Unit */}
          <div>
            <label className="block text-xs font-medium mb-1">Weight</label>
            <div className="grid grid-cols-[1fr_120px] gap-2">
              <Input
                placeholder="e.g. 500"
                value={it.weightPerUnit || ""}
                onChange={(e) =>
                  setForm((p: AnyObj) => {
                    const items = [...(p.freightItems || [])];
                    items[idx] = { ...items[idx], weightPerUnit: e.target.value };
                    return { ...p, freightItems: items };
                  })
                }
                className="h-9"
              />
              <Select
                value={it.weightUnit || "lb"}
                onValueChange={(val) =>
                  setForm((p: AnyObj) => {
                    const items = [...(p.freightItems || [])];
                    items[idx] = { ...items[idx], weightUnit: val as "lb" | "kg" };
                    return { ...p, freightItems: items };
                  })
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lb">lb</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      ))}

      {/* Add line (works even when the list is empty) */}
      <div className="pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setForm((p: AnyObj) => {
              const current = Array.isArray(p.freightItems) ? p.freightItems : [];
              const next = [
                ...current,
                {
                  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                  equipmentId: null,
                  kind: "Pallet",
                  length: "",
                  width: "",
                  height: "",
                  dimUnit: "in",
                  weightPerUnit: "",
                  weightUnit: "lb",
                  quantity: "1",
                },
              ];
              return { ...p, freightItems: next };
            });
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" /> Add line
        </Button>
      </div>

      {/* Totals preview */}
      <div className="mt-4 rounded-xl border p-3 bg-gray-50">
        {(() => {
          const { totalQty, totalWeightLb, dimsString } = computeFreightTotals(form.freightItems || []);
          return (
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Dimensions</span>
                <span className="truncate max-w-[60%] text-right">{dimsString || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Weight</span>
                <span>{totalWeightLb || 0} lb</span>
              </div>
              <div className="flex justify-between">
                <span>Total Quantity</span>
                <span>{totalQty || 0}</span>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  </SheetContent>
</Sheet>


{/* NEW: Customs Broker side panel */}
<Sheet open={showCustomsSheet} onOpenChange={setShowCustomsSheet}>
  <SheetContent side="right" className="w-[520px] sm:w-[600px]">
    <SheetHeader>
      <SheetTitle>Customs — {isCrossBorder ? customsDirection : "Cross-Border"}</SheetTitle>
      <SheetDescription className="sr-only">
        Enter customs broker contact and clearance references for cross-border shipments.
      </SheetDescription>
    </SheetHeader>

    <div className="mt-4 space-y-4">
      {/* Broker contact */}
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1">Broker Company</label>
          <Input
            value={customs.brokerCompany}
            onChange={(e) => setCustoms((c) => ({ ...c, brokerCompany: e.target.value }))}
            placeholder="e.g., Livingston, Farrow, DSV..."
            className="h-9"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">Broker Email</label>
            <Input
              type="email"
              value={customs.brokerEmail}
              onChange={(e) => setCustoms((c) => ({ ...c, brokerEmail: e.target.value }))}
              placeholder="broker@company.com"
              className="h-9"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Broker Phone</label>
            <Input
              value={customs.brokerPhone}
              onChange={(e) => setCustoms((c) => ({ ...c, brokerPhone: e.target.value }))}
              placeholder="+1 (555) 555-5555"
              className="h-9"
            />
          </div>
        </div>
      </div>

      {/* Clearance refs */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1">{papsParsLabel}</label>
          <Input
            value={customs.papsPars}
            onChange={(e) => setCustoms((c) => ({ ...c, papsPars: e.target.value }))}
            placeholder={papsParsLabel}
            className="h-9"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Entry Number</label>
          <Input
            value={customs.entryNumber}
            onChange={(e) => setCustoms((c) => ({ ...c, entryNumber: e.target.value }))}
            placeholder="e.g., 123-4567890-1"
            className="h-9"
          />
        </div>
      </div>

      {/* Commercial Invoice upload */}
      <div className="rounded-2xl border p-3">
        <div className="text-sm font-semibold mb-2">Commercial Invoice</div>

        {!customs.invoiceUrl ? (
          <FileUpload
            name="file"
            accept="application/pdf,image/*"
            maxFileSize={10_000_000}
            customUpload
            uploadHandler={async (event: any) => {
              const file = event.files?.[0];
              if (!file || !id) return;
              const fd = new FormData();
              fd.append("file", file);
              try {
                // Adjust endpoints to your API
                const res = await api.post(`/loads/${id}/customs-invoice`, fd, {
                  headers: { "Content-Type": "multipart/form-data" },
                });
                const url = res?.data?.url || res?.data?.downloadUrl;
                setCustoms((c) => ({ ...c, invoiceUrl: url }));
                toast({ title: "Uploaded", description: "Commercial invoice uploaded." });
              } catch (err) {
                console.error(err);
                toast({ title: "Upload Failed", description: "Could not upload the invoice." });
              }
            }}
            chooseLabel="Upload Invoice"
            className="w-full"
          />
        ) : (
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
            <span className="text-sm truncate max-w-[70%]">
              {customs.invoiceUrl.split("/").pop() || "commercial-invoice"}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.open(customs.invoiceUrl!, "_blank")}
                size="sm"
              >
                Download
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="hover:bg-red-50"
                onClick={async () => {
                  if (!id) return;
                  try {
                    // Adjust endpoint if your API differs
                    await api.delete(`/loads/${id}/customs-invoice`);
                  } catch (err) {
                    // non-fatal: still clear UI
                  } finally {
                    setCustoms((c) => ({ ...c, invoiceUrl: undefined }));
                    toast({ title: "Removed", description: "Commercial invoice removed." });
                  }
                }}
                aria-label="Delete invoice"
                title="Delete invoice"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={() => setShowCustomsSheet(false)}>
          Close
        </Button>
        <Button
          className="bg-gradient-to-r from-emerald-600 to-sky-600 text-white"
          onClick={async () => {
            try {
              if (!id) {
                toast({ title: "Draft Saved", description: "Customs will be saved after load is created." });
                setShowCustomsSheet(false);
                return;
              }
              // Save customs fields (adjust to your backend schema)
              await api.put(`/loads/${id}/customs`, {
                brokerCompany: customs.brokerCompany,
                brokerEmail: customs.brokerEmail,
                brokerPhone: customs.brokerPhone,
                papsPars: customs.papsPars,
                entryNumber: customs.entryNumber,
                direction: customsDirection,
              });
              toast({ title: "Saved", description: "Customs broker details saved." });
              setShowCustomsSheet(false);
            } catch (err) {
              console.error(err);
              toast({ title: "Error", description: "Failed to save customs details." });
            }
          }}
        >
          Save Customs
        </Button>
      </div>
    </div>
  </SheetContent>
</Sheet>





      {/* Main grid: Form left, side panel right */}

      <div className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Shipper & Consignee + tiny map icon in between */}
          <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] items-start">
            {/* SHIPPER */}
            <SectionCard title={t("shipper")}>
              <AutocompleteInput
                label={t("companyName")}
                value={
                  form.shipperId
                    ? { id: form.shipperId, label: shippers.find((s) => s.id === form.shipperId)?.companyName }
                    : { id: null, label: form.shipperCompanyName }
                }
                suggestions={shippers.map((s) => ({ id: s.id, label: s.companyName }))}
                onInputChange={(text) => {
                  if (text.trim() === "") {
                    setForm((p: AnyObj) => ({
                      ...p,
                      shipperId: null,
                      shipperCompanyName: "",
                      shipperContact: "",
                      shipperPhoneNumber: "",
                      shipperEmail: "",
                      shipperAddress: "",
                      shipperCity: "",
                      shipperPostalCode: "",
                      shipperProvince: "",
                      shipperCountry: "",
                      shippingHours: "",
                    }));
                  } else {
                    setForm((p: AnyObj) => ({ ...p, shipperCompanyName: text, shipperId: null }));
                  }
                }}

                onChange={(val) => {
                  const selected = shippers.find((s) => s.id === val?.id);
                  if (selected) {
                    setForm((p: AnyObj) => ({
                      ...p,
                      shipperId: selected.id,
                      shipperCompanyName: selected.companyName,
                      shipperContact: selected.contact ?? "",
                      shipperPhoneNumber: selected.phoneNumber ?? "",
                      shipperEmail: selected.email ?? "",
                      shipperAddress: selected.address ?? "",
                      shipperCity: selected.city ?? "",
                      shipperPostalCode: selected.postalCode ?? "",
                      shipperProvince: selected.province ?? "",
                      shipperCountry: selected.country ?? "",
                      // keep whatever was typed if your API has no hours
                      shippingHours: p.shippingHours || "",
                    }));
                  }
                }}

              />
              {/* Row 1: Pick-Up Date - Shipping Hours */}
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <label className="block text-xs font-medium mb-0.5">{t("pickupDate")}</label>
                  <Input
                    name="pickupDate"
                    type="date"
                    value={toInputDate(form.pickupDate)}
                    onChange={handleChange}
                    className="px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-0.5">{t("shippingHours")}</label>
                  <Input
                    name="shippingHours"
                    value={form.shippingHours || ""}
                    onChange={handleChange}
                    className="px-2 py-1 text-sm"
                    placeholder="e.g. 8:00–16:00"
                  />
                </div>
              </div>


              {/* Row 2: Contact - Email - Phone */}
              <div className="grid grid-cols-3 gap-3 mt-2">
                <div>
                  <label className="block text-xs font-medium mb-0.5">{t("contact")}</label>
                  <Input
                    name="shipperContact"
                    value={form.shipperContact || ""}
                    onChange={handleChange}
                    className="px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-0.5">{t("email")}</label>
                  <Input
                    name="shipperEmail"
                    type="email"
                    value={form.shipperEmail || ""}
                    onChange={handleChange}
                    className="px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-0.5">{t("phone")}</label>
                  <Input
                    name="shipperPhoneNumber"
                    value={form.shipperPhoneNumber || ""}
                    onChange={handleChange}
                    className="px-2 py-1 text-sm"
                  />
                </div>
              </div>


              <div className="grid grid-cols-3 gap-3 mt-2">
                <div>
                  <label className="block text-xs font-medium mb-0.5">{t("address")}</label>
                  <Input name="shipperAddress" value={form.shipperAddress || ""} onChange={handleChange} className="px-2 py-1 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-0.5">{t("city")}</label>
                  <Input name="shipperCity" value={form.shipperCity || ""} onChange={handleChange} className="px-2 py-1 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-0.5">{t("postalCode")}</label>
                  <Input name="shipperPostalCode" value={form.shipperPostalCode || ""} onChange={handleChange} className="px-2 py-1 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <label className="block text-xs font-medium mb-0.5">{t("country")}</label>
                  <Select
                    value={form.shipperCountry || ""}
                    onValueChange={(value) => setForm((p: AnyObj) => ({ ...p, shipperCountry: value, shipperProvince: "" }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Select Country" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CANADA">Canada</SelectItem>
                      <SelectItem value="USA">USA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-0.5">{t("province")}</label>
                  <Select
                    value={form.shipperProvince || ""}
                    onValueChange={(value) => setForm((p: AnyObj) => ({ ...p, shipperProvince: value }))}
                    disabled={!form.shipperCountry}
                  >
                    <SelectTrigger><SelectValue placeholder="Select Province/State" /></SelectTrigger>
                    <SelectContent>
                      {(countryProvinceMap[form.shipperCountry] || []).map((prov) => (
                        <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </SectionCard>

            {/* Map + Appointment icon buttons */}
<div className="flex flex-col items-center justify-center gap-3">
  <button
    type="button"
    onClick={() => window.open(mapsUrl, "_blank")}
    className="h-10 w-10 rounded-full border border-sky-300 bg-white text-sky-700 shadow-sm hover:bg-sky-50 flex items-center justify-center"
    title="Open route in Google Maps"
  >
    <MapPin className="h-5 w-5" />
  </button>

  <button
    type="button"
    onClick={() => setShowAppointmentSheet(true)}
    className="h-10 w-10 rounded-full border border-violet-300 bg-white text-violet-700 shadow-sm hover:bg-violet-50 flex items-center justify-center"
    title="Appointments"
    aria-label="Open appointment settings"
  >
    <CalendarClock className="h-5 w-5" />
  </button>

  <button
    type="button"
    onClick={() => setShowFreightSheet(true)}
    className="h-10 w-10 rounded-full border border-amber-300 bg-white text-amber-700 shadow-sm hover:bg-amber-50 flex items-center justify-center"
    title="Freight Dimensions"
    aria-label="Open freight lines"
  >
    <Plus className="h-5 w-5" />
  </button>

  {/* NEW: Cross-Border customs button (enabled only when Canada ↔ USA) */}
  <button
    type="button"
    onClick={() => {
      if (!isCrossBorder) return;
      setMirrorFlip((m) => !m);
      setShowCustomsSheet(true);
    }}
    disabled={!isCrossBorder}
    className={[
      "h-10 w-10 rounded-full border bg-white shadow-sm flex items-center justify-center transition-transform duration-300",
      isCrossBorder
        ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
        : "border-gray-200 text-gray-300 cursor-not-allowed",
      mirrorFlip ? "-scale-x-100" : "scale-x-100",
    ].join(" ")}
    title={isCrossBorder ? `Cross-Border — ${customsDirection}` : "Cross-Border (Canada ↔ USA only)"}
    aria-label="Open customs broker"
  >
    <ArrowLeftRight className="h-5 w-5" />
  </button>
</div>



            {/* CONSIGNEE */}
            <SectionCard title={t("consignee")}>
              <AutocompleteInput
                label={t("companyName")}
                suggestions={consignees.map((c) => ({ id: c.id, label: c.companyName }))}
                onInputChange={(text) => {
                  if (text.trim() === "") {
                    setForm((p: AnyObj) => ({
                      ...p,
                      consigneeId: null,
                      consigneeCompanyName: "",
                      consigneeContact: "",
                      consigneePhoneNumber: "",
                      consigneeEmail: "",
                      consigneeAddress: "",
                      consigneeCity: "",
                      consigneePostalCode: "",
                      consigneeProvince: "",
                      consigneeCountry: "",
                      receivingHours: "",
                    }));
                  } else {
                    setForm((p: AnyObj) => ({ ...p, consigneeCompanyName: text, consigneeId: null }));
                  }
                }}

                value={selectedConsignee ? { id: selectedConsignee.id, label: selectedConsignee.companyName } : null}
                onChange={(val) => {
                  const c = consignees.find((x) => x.id === val?.id);
                  if (c) {
                    setForm((p: AnyObj) => ({
                      ...p,
                      consigneeId: c.id,
                      consigneeCompanyName: c.companyName,
                      consigneeContact: c.contact ?? "",
                      consigneePhoneNumber: c.phoneNumber ?? "",
                      consigneeEmail: c.email ?? "",
                      consigneeAddress: c.address ?? "",
                      consigneeCity: c.city ?? "",
                      consigneePostalCode: c.postalCode ?? "",
                      consigneeProvince: c.province ?? "",
                      consigneeCountry: c.country ?? "",
                      receivingHours: p.receivingHours || "",
                    }));
                  }
                }}

              />
              {/* Row 1: Delivery Date - Receiving Hours */}
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <label className="block text-xs font-medium mb-0.5">{t("deliveryDate")}</label>
                  <Input
                    name="deliveryDate"
                    type="date"
                    value={toInputDate(form.deliveryDate)}
                    onChange={handleChange}
                    className="px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-0.5">{t("receivingHours")}</label>
                  <Input
                    name="receivingHours"
                    value={form.receivingHours || ""}
                    onChange={handleChange}
                    className="px-2 py-1 text-sm"
                    placeholder="e.g. 9:00–17:00"
                  />
                </div>
              </div>


              {/* Row 2: Contact - Email - Phone */}
              <div className="grid grid-cols-3 gap-3 mt-2">
                <div>
                  <label className="block text-xs font-medium mb-0.5">{t("contact")}</label>
                  <Input
                    name="consigneeContact"
                    value={form.consigneeContact || ""}
                    onChange={handleChange}
                    className="px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-0.5">{t("email")}</label>
                  <Input
                    name="consigneeEmail"
                    type="email"
                    value={form.consigneeEmail || ""}
                    onChange={handleChange}
                    className="px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-0.5">{t("phone")}</label>
                  <Input
                    name="consigneePhoneNumber"
                    value={form.consigneePhoneNumber || ""}
                    onChange={handleChange}
                    className="px-2 py-1 text-sm"
                  />
                </div>
              </div>


              <div className="grid grid-cols-3 gap-3 mt-2">
                <div>
                  <label className="block text-xs font-medium mb-0.5">{t("address")}</label>
                  <Input name="consigneeAddress" value={form.consigneeAddress || ""} onChange={handleChange} className="px-2 py-1 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-0.5">{t("city")}</label>
                  <Input name="consigneeCity" value={form.consigneeCity || ""} onChange={handleChange} className="px-2 py-1 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-0.5">{t("postalCode")}</label>
                  <Input name="consigneePostalCode" value={form.consigneePostalCode || ""} onChange={handleChange} className="px-2 py-1 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <label className="block text-xs font-medium mb-0.5">{t("country")}</label>
                  <Select
                    value={form.consigneeCountry || ""}
                    onValueChange={(value) => setForm((p: AnyObj) => ({ ...p, consigneeCountry: value, consigneeProvince: "" }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Select Country" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CANADA">Canada</SelectItem>
                      <SelectItem value="USA">USA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-0.5">{t("province")}</label>
                  <Select
                    value={form.consigneeProvince || ""}
                    onValueChange={(value) => setForm((p: AnyObj) => ({ ...p, consigneeProvince: value }))}
                    disabled={!form.consigneeCountry}
                  >
                    <SelectTrigger><SelectValue placeholder="Select Province/State" /></SelectTrigger>
                    <SelectContent>
                      {(countryProvinceMap[form.consigneeCountry] || []).map((prov) => (
                        <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </SectionCard>
          </div>
           


{/* Financials (Price & Cost) */}
<SectionCard title="Financials">
  <div className="grid gap-6 md:grid-cols-2">
    {/* Left: Sale / Price */}
    <div className="rounded-xl border p-3">
      <div className="mb-2 text-sm font-semibold text-gray-900">Sale (Price)</div>

      {/* Base price */}
      <label className="block text-xs font-medium mb-1">Base</label>
      <div className="relative mb-3">
        <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
        <Input
          name="price"
          value={form.price}
          onChange={handleChange}
          className="w-full pl-6 pr-2 py-1 text-sm text-right"
          inputMode="decimal"
        />
      </div>

      {/* Additional Services
 chip + edit */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-gray-500">Additional Services
</div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 ring-1 ring-blue-200">
            {toMoney(fin.priceAdd)}
          </span>
          <Button type="button" size="sm" variant="outline" onClick={() => openCharges("price")}>
            Edit
          </Button>
        </div>
      </div>

      <div className="h-px w-full bg-gray-100 my-2" />

      {/* Total price big */}
      <div className="flex items-end justify-between">
        <div className="text-xs text-gray-500">Total Price</div>
        <div className="text-lg font-semibold">{toMoney(fin.priceTot)}</div>
      </div>
    </div>

    {/* Right: Carrier Cost */}
    <div className="rounded-xl border p-3">
      <div className="mb-2 text-sm font-semibold text-gray-900">Carrier Cost</div>

      {/* Base cost */}
      <label className="block text-xs font-medium mb-1">Base</label>
      <div className="relative mb-3">
        <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
        <Input
          name="cost"
          value={form.cost}
          onChange={handleChange}
          className="w-full pl-6 pr-2 py-1 text-sm text-right"
          inputMode="decimal"
        />
      </div>

      {/* Additional Services chip + edit */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-gray-500">Additional Services
</div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200">
            {toMoney(fin.costAdd)}
          </span>
          <Button type="button" size="sm" variant="outline" onClick={() => openCharges("cost")}>
            Edit
          </Button>
        </div>
      </div>

      <div className="h-px w-full bg-gray-100 my-2" />

      {/* Total cost big */}
      <div className="flex items-end justify-between">
        <div className="text-xs text-gray-500">Total Cost</div>
        <div className="text-lg font-semibold">{toMoney(fin.costTot)}</div>
      </div>
    </div>
  </div>

  {/* Profit bar */}
  <div className="mt-4 rounded-xl border p-3 bg-gray-50">
    <div className="flex items-center justify-between">
      <div className="text-sm font-semibold">Profit</div>
      <div className="flex items-center gap-3">
        <span className={`text-lg font-semibold ${fin.profit < 0 ? "text-red-600" : "text-emerald-700"}`}>
          {toMoney(fin.profit)}
        </span>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1
            ${fin.profit < 0
              ? "bg-red-50 text-red-700 ring-red-200"
              : "bg-emerald-50 text-emerald-700 ring-emerald-200"}`}
        >
          {fin.profitPct.toFixed(2)}%
        </span>
      </div>
    </div>
  </div>
</SectionCard>


        
            {/*///Notes — simple, clean, beautiful*/}
<SectionCard title="Notes">
  <div className="rounded-2xl border bg-white p-3 shadow-sm">
    <div className="mb-2 flex items-center justify-between">
      <div className="text-sm font-semibold">{t("additional_info")}</div>
      <div className="text-[11px] text-gray-500">
        {(form.additionalInformation || "").length}/2000
      </div>
    </div>

    <textarea
      name="additionalInformation"
      value={form.additionalInformation || ""}
      onChange={handleChange}
      maxLength={2000}
      rows={6}
      className="w-full rounded-xl border px-3 py-2 text-sm leading-5 min-h-[140px] max-h-[320px] resize-y focus:outline-none focus:ring-2 focus:ring-sky-200"
      placeholder="Notes & instructions for this load…"
    />

    <div className="mt-1 text-[11px] text-gray-500">
      Keep it concise and actionable. (If your PDF templates include notes, this text can be shown.)
    </div>
  </div>
</SectionCard>


          {/* Submit */}
          <div className="flex justify-end">
            <Button type="submit">{id ? t("update") : t("create")}</Button>
          </div>
        </form>

        {/* Right Panel */}
<div className="flex flex-col gap-4 text-sm">


  {/* Updates (moved below Carrier) */}
<SectionCard
  title={t("load_updates")}
  cta={
    <Button size="sm" variant="outline" onClick={postUpdate}>
      {t("add")}
    </Button>
  }
  className="shrink-0"
>
  <textarea
    value={newUpdate}
    onChange={(e) => setNewUpdate(e.target.value)}
    placeholder="Write an update..."
    rows={3}
    className="w-full border rounded px-2 py-1 mb-2 text-sm resize-y overflow-x-hidden"
  />
  <div className="max-h-64 overflow-y-auto overflow-x-hidden pr-2 space-y-2">
    {updates.length > 0 ? (
      updates.map((u, i) => (
        <div key={i} className="rounded">
          <p className="text-xs text-blue-600 font-medium">
            {u.user?.username} — {new Date(u.timestamp).toLocaleString()}
          </p>
          <UpdateMessage text={u.message || ""} />
        </div>
      ))
    ) : (
      <p className="text-muted-foreground italic">{t("no_updates")}</p>
    )}
  </div>
</SectionCard>


 {/* Carrier (moved here to top of right panel) */}
<SectionCard
  title="Carrier"
  className="shrink-0"
  cta={
    <button
      type="button"
      className="text-xs text-blue-600 hover:underline"
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => setShowCarrierDetails(true)}
      aria-label="View carrier details"
    >
      View details
    </button>
  }
>
  <div className="grid gap-3 md:grid-cols-2">
    <div>
      <label className="block text-xs font-medium mb-1">Company Name</label>
      <AutocompleteInput
        suggestions={carriers.map((c) => ({ id: c.id, label: c.companyName }))}
        value={
          carriers.find((c) => c.id === form.carrierId)
            ? {
                id: form.carrierId,
                label: carriers.find((c) => c.id === form.carrierId)?.companyName,
              }
            : null
        }
        onChange={(val) => {
          const carrier = carriers.find((c) => c.id === val?.id);
          if (carrier) {
            setForm((p: AnyObj) => ({
              ...p,
              carrierId: carrier.id,
              carrierCompanyName: carrier.companyName,
              carrierDispatcher: carrier.dispatcher ?? "",
              carrierEmail: carrier.email ?? "",
              carrierAddress: carrier.address ?? "",
              carrierCompanyNumber: carrier.companyNumber ?? "",
            }));
          }
        }}
      />
    </div>

    <div>
      <label className="block text-xs font-medium mb-1">COD Type</label>
      <Select
        value={form.codType}
        onValueChange={(val) => setForm((p: AnyObj) => ({ ...p, codType: val }))}
      >
        <SelectTrigger className="h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="COLLECT">Collect</SelectItem>
          <SelectItem value="COD">COD</SelectItem>
          <SelectItem value="PREPAID">Prepaid</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div>
      <label className="block text-xs font-medium mb-1">Company Number</label>
      <Input
        name="carrierCompanyNumber"
        value={form.carrierCompanyNumber || ""}
        onChange={handleChange}
        className="h-9"
      />
    </div>
    <div>
      <label className="block text-xs font-medium mb-1">Email</label>
      <Input
        name="carrierEmail"
        value={form.carrierEmail || ""}
        onChange={handleChange}
        className="h-9"
      />
    </div>
  </div>

</SectionCard>

          {/* PDFs / Invoice */}
          <SectionCard title="Documents & Billing">
            <div className="grid gap-2">
              <Button className="bg-blue-600 text-white w-full" onClick={downloadPdf}>
                {t("download_load_confirmation")}
              </Button>
              <Button className="bg-blue-600 text-white w-full" onClick={downloadBillOfLading}>
                {t("download_bol")}
              </Button>

              {status === "Delivered" && (
                <>
                  <Button className="bg-blue-600 text-white w-full" onClick={viewInvoice}>
                    {t("view_invoice")}
                  </Button>

                  <Button
                    className={`${invoiceSent ? "bg-red-600" : "bg-blue-600"} text-white w-full`}
                    onClick={sendInvoice}
                    disabled={invoiceSent}
                  >
                    {invoiceSent ? t("invoice_sent") || "Invoice sent" : t("send_invoice")}
                  </Button>

                  {message && <div className="mt-2 text-sm text-green-600">{message}</div>}
                </>
              )}
            </div>

            {status === "Delivered" && id && (
              <div className="mt-3">
                <label className="block text-xs font-medium mb-0.5">Proof of Delivery (PDF/Image)</label>
                <FileUpload
                  name="file"
                  accept="application/pdf,image/*"
                  maxFileSize={5_000_000}
                  customUpload
                  uploadHandler={async (event: any) => {
                    const file = event.files?.[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append("file", file);
                    try {
                      await api.post(`/pdf/${id}/upload-proof`, formData, {
                        headers: { "Content-Type": "multipart/form-data" },
                      });
                      toast({ title: "Success", description: "Proof of Delivery uploaded." });
                    } catch (error) {
                      toast({ title: "Upload Failed", description: "Could not upload the document." });
                    }
                  }}
                  chooseLabel="Upload"
                  className="w-full"
                />
              </div>
            )}
          </SectionCard>
        </div>
      </div>

      {/* Rating modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 shadow max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Rate the Carrier</h3>
            <div className="flex justify-center mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setCarrierRating(star)}
                  className={`text-3xl ${star <= carrierRating ? "text-yellow-500" : "text-gray-300"}`}
                >
                  ★
                </button>
              ))}
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowRatingModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowRatingModal(false);
                  setForm((prev: AnyObj) => ({ ...prev, rating: carrierRating }));
                }}
              >
                Save Rating
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Charges drawer */}
      <Sheet open={showCharges} onOpenChange={setShowCharges}>
        <SheetContent side="right" className="w-[420px] sm:w-[520px]">
 <SheetHeader>
  <SheetTitle>
    {chargeType === "price" ? "Price Additional Services" : "Cost Additional Services"}
  </SheetTitle>
  <SheetDescription className="sr-only">Edit the list of Additional Services
.</SheetDescription>
</SheetHeader>

          <div className="mt-4 space-y-2">
          {additionalCharges.length === 0 ? (
  <div className="text-xs text-gray-500">No Additional Services
.</div>
) : (

  additionalCharges.map((charge, index) => (
    <div key={index} className="grid grid-cols-[2fr_1fr_auto] items-center gap-2">
      <Input
        value={charge.name}
        onChange={(e) => updateCharge(index, "name", e.target.value)}
        placeholder="Name"
      />
      <Input
        type="number"
        value={String(charge.amount)}
        onChange={(e) => updateCharge(index, "amount", e.target.value)}
        placeholder="Amount"
        inputMode="decimal"
      />
      <Button
  type="button"
  variant="ghost"
  size="icon"
  onClick={() =>
    setAdditionalCharges((prev) => prev.filter((_, i) => i !== index))
  }
  aria-label="Delete charge"
  title="Delete"
  className="hover:bg-red-50"
>
  <Trash2 className="h-4 w-4 text-red-600" />
</Button>

    </div>
  ))
)}

<div className="flex items-center gap-2 pt-1">
  <Button variant="outline" onClick={addNewCharge}>+ Add line</Button>
{additionalCharges.length > 0 && (
  <Button
    variant="ghost"
    onClick={async () => {
      try {
        // optimistic UI
        setAdditionalCharges([]);
        if (id) await tryClearCharges(id, chargeType);

        setForm((prev) => ({
          ...prev,
          ...(chargeType === "price"
            ? { priceAdditionalCharges: "0" }
            : { costAdditionalCharges: "0" }),
        }));

        toast({ title: "Success", description: "All additional Services cleared." });
      } catch (e: any) {
        if (e?.response?.status === 401) {
          toast({ title: "Session expired", description: "Please sign in again." });
        } else {
          console.error(e);
          toast({ title: "Error", description: "Failed to clear charges." });
        }
      }
    }}
  >
    Clear all
  </Button>
)}

</div>

{(() => {
  const cleaned = additionalCharges.filter(
    (c) => (Number(c.amount) || 0) !== 0 || (c.name ?? "").trim() !== ""
  );
  const subtotal = cleaned.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  return (
    <div className="flex justify-between pt-2 border-t">
      <span className="text-xs text-gray-500">Subtotal</span>
      <span className="font-semibold">${subtotal.toFixed(2)}</span>
    </div>
  );
})()}

<Button
  className="bg-gradient-to-r from-sky-600 to-violet-600 text-white"
  onClick={saveCharges}
>
  Save
</Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Carrier details popup (Eye) */}
      <Sheet open={showCarrierDetails} onOpenChange={setShowCarrierDetails}>
        <SheetContent side="right" className="w-[420px] sm:w-[520px]">
<SheetHeader>
  <SheetTitle>Carrier details</SheetTitle>
  <SheetDescription className="sr-only">Read-only carrier information.</SheetDescription>
</SheetHeader>

          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium mb-0.5">{t("companyName")}</label>
              <Input value={form.carrierCompanyName || ""} readOnly />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-0.5">{t("contact")}</label>
                <Input value={form.carrierDispatcher || ""} readOnly />
              </div>
              <div>
                <label className="block text-xs font-medium mb-0.5">{t("email")}</label>
                <Input value={form.carrierEmail || ""} readOnly />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-0.5">{t("address")}</label>
              <Input value={form.carrierAddress || ""} readOnly />
            </div>
            <div>
              <label className="block text-xs font-medium mb-0.5">{t("company_number") || "Company Number"}</label>
              <Input value={form.carrierCompanyNumber || ""} readOnly />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
