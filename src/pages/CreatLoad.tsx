import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/lib/axios";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Truck } from "lucide-react";
import { Eye } from "lucide-react";
import ChecklistTaskViewerPage from "./ChecklistDisplayComponent";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import AutocompleteInput from "@/components/common/AutoCompleteInput";
import { useTranslation } from 'react-i18next';
import { FileUpload } from "primereact/fileupload";
import LoadTask from "@/pages/LoadTask";
import Selectt from 'react-select';
import mapLoadToForm from "@/components/utils/formMapper";
export default function CreateLoad() {
  interface AdditionalChargeDTO {
  name: string;
  amount: number;
  type: "price" | "cost";
}
const [load, setLoad] = useState<LoadSummary | null>(null);
const { id } = useParams();
const navigate = useNavigate();

const fetchLoad = async () => {
  try {
    const res = await api.get(`/loads/${loadId}`);
    const data = res.data;

    setLoad(data);
    setForm(prev => mapLoadToForm(data, prev));
  } catch (err) {
    console.error("❌ Failed to fetch load:", err);
  }
};
useEffect(() => {
  if (!id) return;

  const interval = setInterval(async () => {
    try {
      const res = await api.get(`/loads/${id}/status`);
      const status = res.data.status;
      setStatus(status); // sets local status used for conditionally showing buttons
    } catch (err) {
      console.error("Failed to fetch status", err);
    }
  }, 2000);

  return () => clearInterval(interval);
}, [id]);


  const { t } = useTranslation();
  const [invoiceSent, setInvoiceSent] = useState(false);
const [message, setMessage] = useState("");
 const { id: loadId } = useParams(); // ✅ this ensures loadId is available

  // If needed, convert to number:
  const parsedLoadId = loadId ? parseInt(loadId, 10) : null;

  const [clients, setClients] = useState([]);
  const [carriers, setCarriers] = useState([]);
  const [shippers, setShippers] = useState([]);
  const [consignees, setConsignees] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [newUpdate, setNewUpdate] = useState("");
  const [additionalCharges, setAdditionalCharges] = useState<AdditionalChargeDTO[]>([]);
  const [chargeType, setChargeType] = useState<"price" | "cost" | null>(null);
const [showChargesModal, setShowChargesModal] = useState(false);
const [nextId, setNextId] = useState<number | null>(null);
useEffect(() => {
  if (!id) { // creating a new load
    api.get("/loads/next-id").then((res) => {
      setNextId(res.data);
    }).catch((err) => {
      console.error("Failed to fetch next load ID", err);
    });
  }
}, [id]);

const handleOpenChargesModal = async (type: "price" | "cost") => {
  setChargeType(type);
  setShowChargesModal(true);

  try {
    const res = await api.get(`/loads/${id}/additional-charges?type=${type}`);
    setAdditionalCharges(res.data); // should be [{name, amount, type}]
  } catch (err) {
    console.error("Failed to fetch charges", err);
    setAdditionalCharges([]); // fallback
  }
};
console.log("Load status:", load?.status);

const updateCharge = (index: number, field: "name" | "amount", value: string) => {
  const updated = [...additionalCharges];
  updated[index][field] = field === "amount" ? parseFloat(value) : value;
  setAdditionalCharges(updated);
};

const addNewCharge = () => {
  setAdditionalCharges([...additionalCharges, { name: "", amount: 0 }]);
};


const isEditMode = Boolean(id);
  const [form, setForm] = useState({
    status: "Quoting",
    trackingNumber: "",
    purchaseOrder: "",
    clientIds: [],
  pickUpId: null,
  deliveryId: null,
   equipementIds: [],
  type: "",
  carrierId: null,
      // Add this line

    loadType: "",
    dimensions: "",
    appointment: "",
    quantity: "",
    weight: "",
    pickupDate: null,
    deliveryDate: null,
    shippingHours: "",
    receivingHours: "",
    startShippingHours: "",
    endShippingHours: "",
    startReceivingHours: "",
    endReceivingHours: "",
    price: 0,
    cost: 0,
    costAdditionalCharges: 0,
    priceAdditionalCharges: 0,
    totalCost: 0,
    totalPrice: 0,
    profit: "",
    profitPourcentage: "",
    sealNumber: "",
    trailerNumber: "",
    codType: "COLLECT",
    additionalInformation: "",
    rating: 0,
    additionalShipper: "", // ✅ new field
  pickupNumber: undefined,
  dropoffNumber: undefined,
  dimensions: "",
   carrierId: null,
  carrierCompanyName: "",
  carrierDispatcher: "",
  carrierEmail: "",
  carrierAddress: "",
  carrierCompanyNumber: "",

  // Consignee
  consigneeId: null,
  consigneeCompanyName: "",
  consigneeContact: "",
  consigneeAddress: "",
  consigneeCity: "",
  consigneePostalCode: "",
  consigneeProvince: "",
  consigneeCountry: "",
  consigneePhoneNumber: "",

  });
const [status, setStatus] = useState(form.status || "Pending");
const [showRatingModal, setShowRatingModal] = useState(false);

const [carrierRating, setCarrierRating] = useState<number>(form.rating || 0);

  // 👇 Translatable field labels
  const fields = [
    ["trackingNumber", t("tracking_number")],
    ["purchaseOrder", t("purchase_order")],
    ["loadType", t("load_type")],
    ["dimensions", t("dimensions")],
    ["quantity", t("quantity")],
    ["weight", t("weight")],
    ["shippingHours", t("shipping_hours")],
    ["receivingHours", t("receiving_hours")],
    ["price", t("price")],
    ["priceAdditionalCharges", t("price_additional")],
    ["cost", t("cost")],
    ["costAdditionalCharges", t("cost_additional")],
    ["sealNumber", t("seal_number")],
    ["trailerNumber", t("trailer_number")],
    ["additionalInformation",t("additional_info")]
  ];

  useEffect(() => {
  async function fetchAll() {
    try {
      // Fetch dropdown data first
      const [clientRes, carrierRes, shipperRes, consigneeRes, equipementRes] = await Promise.all([
        api.get("/clients"),
        api.get("/carriers"),
        api.get("/shippers"),
        api.get("/consignees"),
        api.get("/equipements")
      ]);

      setClients(clientRes.data);
      setCarriers(carrierRes.data);
      setShippers(shipperRes.data);
      setConsignees(consigneeRes.data);
      setEquipments(equipementRes.data);

      if (id) {
  const loadRes = await api.get(`/loads/${id}`);
  const data = loadRes.data;

setForm(prev => mapLoadToForm(data, prev));

  // right after you fetch the load:
console.log("API country:", data.pickUp?.country);
console.log("Form country that you set:", form.shipperCountry);
console.log("Country options:", countryProvinceMap);
console.log("Full load data from API:", data);
console.log("Pickup province from API:", data.pickUp?.province);
console.log("Delivery province from API:", data.delivery?.province);

}
    } catch (err) {
      toast({ title: t("error"), description: t("load_fetch_fail") });
      console.error(err);
    }
  }

  fetchAll();
}, [id, t]);
useEffect(() => {
  console.log("✅ FORM updated - shipperCountry:", form.shipperCountry);
  console.log("✅ FORM updated - shipperProvince:", form.shipperProvince);
  console.log("✅ FORM updated - consigneeCountry:", form.consigneeCountry);
  console.log("✅ FORM updated - consigneeProvince:", form.consigneeProvince);
}, [form.shipperCountry, form.shipperProvince, form.consigneeCountry, form.consigneeProvince]);
useEffect(() => {
  console.log("✅ Updated form provinces", {
    shipperProvince: form.shipperProvince,
    consigneeProvince: form.consigneeProvince,
  });
}, [form.shipperProvince, form.consigneeProvince]);

  useEffect(() => {
    if (id) {
      api.get(`/loads/${id}/updates`)
        .then(res => setUpdates(res.data))
        .catch(() => toast({ title: "Erreur", description: "Échec du chargement des mises à jour" }));
    }
  }, [id]);

  useEffect(() => {
    const cost = parseFloat(form.cost) || 0;
    const costAdditional = parseFloat(form.costAdditionalCharges) || 0;
    const price = parseFloat(form.price) || 0;
    const priceAdditional = parseFloat(form.priceAdditionalCharges) || 0;

    const totalCost = cost + costAdditional;
    const totalPrice = price + priceAdditional;
    const profit = totalPrice - totalCost;
    const profitPourcentage = totalPrice !== 0 ? ((profit * 100) / totalPrice).toFixed(2) : "0";

    setForm(prev => ({
      ...prev,
      totalCost: totalCost.toFixed(2),
      totalPrice: totalPrice.toFixed(2),
      profit: profit.toFixed(2),
      profitPourcentage,
    }));
  }, [form.cost, form.costAdditionalCharges, form.price, form.priceAdditionalCharges]);


  const handleChange = (e) => {
    const { name, value } = e.target;
console.log("Updating:", name, value);

    if (name === "pickupDate" || name === "deliveryDate") {
      setForm(prev => ({ ...prev, [name]: value ? new Date(value) : null }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };
const handleStatusChange = (newStatus: string) => {
  setStatus(newStatus);
  setForm(prev => ({ ...prev, status: newStatus }));

  if (newStatus === "Delivered") {
    setShowRatingModal(true);
  }
};

const handleSubmit = async (e) => {
  e.preventDefault();

  const payload = {
    ...form,
      id: id ? parseInt(id) : undefined, // ✅ Explicitly add this for backend compatibility
    pickupDate: form.pickupDate instanceof Date ? form.pickupDate.toISOString() : null,
    deliveryDate: form.deliveryDate instanceof Date ? form.deliveryDate.toISOString() : null,
    price: parseFloat(form.price),
    cost: parseFloat(form.cost),
    costAdditionalCharges: parseFloat(form.costAdditionalCharges),
    priceAdditionalCharges: parseFloat(form.priceAdditionalCharges),
    totalCost: parseFloat(form.totalCost),
    totalPrice: parseFloat(form.totalPrice),
    profit: parseFloat(form.profit),
    profitPourcentage: form.profitPourcentage,
    clientId: form.clientId ? parseInt(form.clientId) : null,
    pickUpId: form.shipperId ? parseInt(form.shipperId) : null,
    deliveryId: form.consigneeId ? parseInt(form.consigneeId) : null,
    equipementIds: form.equipementIds?.map(id => parseInt(id)) ?? [],
    type: form.type,
    carrier: {
      id: form.carrierId,
      rating: carrierRating,
}, // ✅ <--- Add this line to include `id` only if it exists
};
  try {
    let updatedLoadId = id;

    if (id) {
    const res = await api.put(`/loads/${id}`, payload);
// or for creation:
// const res = await api.post("/loads", payload);

const updatedLoadId = res.data.id || id;

const fullLoadRes = await api.get(`/loads/${updatedLoadId}`);
const updated = fullLoadRes.data;

console.log("✅ Generated Pickup #:", updated.pickupNumber);
console.log("✅ Generated Dropoff #:", updated.dropoffNumber);

// Optional: update your form state with the full updated data
setForm(prev => ({
  ...prev,
  pickupNumber: updated.pickupNumber,
  dropoffNumber: updated.dropoffNumber,
}));


      toast({ title: "Charge mise à jour avec succès" });
    } else {
      const res = await api.post("/loads", payload);
      updatedLoadId = res.data?.id;
      toast({ title: "Charge créée avec succès" });
    }

    // ✅ Fetch latest data with pickup/dropoff numbers
    if (updatedLoadId) {
      const full = await api.get(`/loads/${updatedLoadId}`);
    setForm(prev => ({
  ...prev,
  ...full.data,
  pickupDate: full.data.pickupDate ? new Date(full.data.pickupDate) : null,
  deliveryDate: full.data.deliveryDate ? new Date(full.data.deliveryDate) : null,
  pickupNumber: full.data.pickupNumber ?? "",
  dropoffNumber: full.data.dropoffNumber ?? "",
}));

      console.log("✅ Generated Pickup #:", full.data.pickupNumber);
      console.log("✅ Generated Dropoff #:", full.data.dropoffNumber);
    }

  } catch (error) {
    console.error("❌ Error submitting form:", error);
    toast({ title: "Erreur", description: "Échec de la soumission" });
  }
};

useEffect(() => {
  const fetchLoad = async () => {
    const res = await api.get(`/loads/${loadId}`);
    setLoad(res.data);
  };

  fetchLoad();
}, [loadId]);
// ✅ This is correct
useEffect(() => {
  if (!loadId) return;

  const fetchLoad = async () => {
    try {
      const res = await api.get(`/loads/${loadId}`);
      setLoad(res.data);
    setForm((prev) => ({
  ...prev,

  // Dates
  pickupDate: res.data.pickupDate ? new Date(res.data.pickupDate) : null,
  deliveryDate: res.data.deliveryDate ? new Date(res.data.deliveryDate) : null,

  // Numbers
  pickupNumber: res.data.pickupNumber ?? "",
  dropoffNumber: res.data.dropoffNumber ?? "",

  // Shipper
  shipperId: res.data.pickUp?.id ?? null,
  shipperCompanyName: res.data.pickUp?.companyName ?? "",
  shipperContact: res.data.pickUp?.contact ?? "",
  shipperPhoneNumber: res.data.pickUp?.phoneNumber ?? "",
  shipperAddress: res.data.pickUp?.address ?? "",
  shipperCity: res.data.pickUp?.city ?? "",
  shipperPostalCode: res.data.pickUp?.postalCode ?? "",
  shipperProvince: res.data.pickUp?.province ?? prev.shipperProvince ?? "",
  shipperCountry: res.data.pickUp?.country ?? prev.shipperCountry ?? "",

  // Consignee
  consigneeId: res.data.delivery?.id ?? null,
  consigneeCompanyName: res.data.delivery?.companyName ?? "",
  consigneeContact: res.data.delivery?.contact ?? "",
  consigneePhoneNumber: res.data.delivery?.phoneNumber ?? "",
  consigneeAddress: res.data.delivery?.address ?? "",
  consigneeCity: res.data.delivery?.city ?? "",
  consigneePostalCode: res.data.delivery?.postalCode ?? "",
  consigneeProvince: res.data.delivery?.province ?? prev.consigneeProvince ?? "",
  consigneeCountry: res.data.delivery?.country ?? prev.consigneeCountry ?? "",
  equipementIds: Array.isArray(res.data.equipements)
    ? res.data.equipements.map((eq) => eq.id)
    : [],

  // Carrier
  carrierId: res.data.carrier?.id ?? null,
  carrierCompanyName: res.data.carrier?.companyName ?? "",
  carrierDispatcher: res.data.carrier?.dispatcher ?? "",
  carrierEmail: res.data.carrier?.email ?? "",
  carrierAddress: res.data.carrier?.address ?? "",
  carrierCompanyNumber: res.data.carrier?.companyNumber ?? "",

  // Other fields
  type: res.data.type ?? "",
  codType: res.data.codType ?? "COLLECT",
  status: res.data.status ?? "Quoting",
  additionalInformation: res.data.additionalInformation ?? "",
  additionalShipper: res.data.additionalShipper ?? "",
  price: res.data.price ?? 0,
  cost: res.data.cost ?? 0,
  priceAdditionalCharges: res.data.priceAdditionalCharges ?? 0,
  costAdditionalCharges: res.data.costAdditionalCharges ?? 0,
  profit: res.data.profit ?? "0",
  profitPourcentage: res.data.profitPourcentage ?? "0",

}));


    } catch (error) {
      console.error("Error fetching load:", error);
    }
  };

  fetchLoad();
}, [loadId]);

const [shipperInputText, setShipperInputText] = useState("");

const selectedConsignee = consignees.find(c => c.id === form.consigneeId);

  const downloadPdf = async () => {
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
    toast({ title: "Erreur", description: "PDF Load Confirmation échoué" });
  }
};
const updateLoadStatus = async (newStatus: string) => {
  if (!id) return;

  try {
    await api.patch(`/loads/${id}/status`, { status: newStatus }); // PATCH is best for partial update
    toast({ title: "Status Updated", description: `Load marked as ${newStatus}` });
    
    // Optionally update local state
    setForm((prev) => ({ ...prev, status: newStatus }));
    setStatus(newStatus);

    // If DELIVERED, trigger rating modal
    if (newStatus === "Delivered") {
      setShowRatingModal(true);
    }
  } catch (error) {
    console.error("Failed to update status", error);
    toast({ title: "Error", description: "Failed to update load status" });
  }
};

  const downloadBillOfLading = async () => {
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
    toast({ title: "Erreur", description: "Bill of Lading échoué" });
  }
};
console.log('DEBUG: form.equipments', form.equipments);

const viewInvoice = async () => {
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
    toast({ title: "Erreur", description: "Failed to generate invoice PDF." });
  }
};

  const sendInvoice = async () => {
    try {
      await api.post(`/pdf/invoice/send/${id}`);
        setInvoiceSent(true);
    setMessage("✅ Invoice sent successfully!");
      toast({ title: "Succès", description: "Invoice sent to client successfully!" });
    } catch {
      toast({ title: "Erreur", description: "Failed to send invoice." });
      setMessage("❌ Failed to send invoice.");
    }
  };

  
  const postUpdate = async () => {
    if (!newUpdate.trim()) return;
    try {
      await api.post(`/loads/${id}/updates`, { message: newUpdate });
      const res = await api.get(`/loads/${id}/updates`);
      setUpdates(res.data);
      setNewUpdate("");
    } catch {
      toast({ title: "Erreur", description: "Échec de l'ajout de la mise à jour" });
    }
  };
  const countryProvinceMap = {
  CANADA: ["Ontario", "Quebec", "British Columbia", "Alberta", "Manitoba","New Brunswick","Newfoundland and Labrador","Nova Scotia","Prince Edward Island","Saskatchewan"],
  USA: [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
  "Wisconsin", "Wyoming"
],
};
const [showModal, setShowModal] = useState(form.appointment === 'yes');
useEffect(() => {
  if (form.appointment === 'yes') setShowModal(true);
}, [form.appointment]);


  return (
<div className="max-w-[1400px] mx-auto mt-4 p-2">
  {/* Header Row with Load ID + Status (left), and LoadTaskSteps (right) */}
  <div className="flex gap-4 mb-4">
    
    {/* Left side: Load ID and Status stacked */}
    <div className="flex flex-col text-sm w-40 gap-2">
     <div>
  <label className="font-semibold text-xs mb-1 block">Load ID</label>
  <span className="text-xs">{id ?? nextId ?? "New Load"}</span>
</div>


      <div>
        <label className="font-semibold text-xs mb-1 block">Status</label>
        <Select value={form.status} onValueChange={updateLoadStatus}>
          <SelectTrigger className="text-xs h-7 px-2 py-0 w-full">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {["Quoting", "Confirmed", "PickedUp", "DELIVERED","LOST","CANCELED"].map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
       <label className="block text-xs font-medium mb-1">Equipment</label>
<Selectt
  isMulti
  options={equipments.map(e => ({ value: e.id, label: e.type }))}
 value={
  Array.isArray(form.equipementIds)
    ? equipments.filter(e => form.equipementIds.includes(e.id)).map(e => ({ value: e.id, label: e.type }))
    : []
}

  onChange={(selectedOptions) =>
    setForm(p => ({
      ...p,
      equipementIds: selectedOptions.map(option => option.value),
    }))
  }
  className="w-full"
/>

    </div>

    {/* Right side: LoadTaskSteps fills the remaining space */}
    <div className="flex-1 border p-2 rounded">
<ChecklistTaskViewerPage
  origin={form.shipperCountry?.charAt(0).toUpperCase() + form.shipperCountry?.slice(1).toLowerCase()}
  destination={form.consigneeCountry?.charAt(0).toUpperCase() + form.consigneeCountry?.slice(1).toLowerCase()}
  originProvince={Array.isArray(form.shipperProvince) ? form.shipperProvince : [form.shipperProvince]}
  destinationProvince={Array.isArray(form.consigneeProvince) ? form.consigneeProvince : [form.consigneeProvince]}
  type={Array.isArray(form.type) ? form.type : [form.type]}
  equipmentIds={form.equipementIds || []}
  clientIds={form.clientId ? [form.clientId] : []}
/>




    </div>
  </div>

    {/* Optional: Load Task Steps (if needed visually below) */}
   
    <div className="grid grid-cols-3 gap-6">
      <form onSubmit={handleSubmit} className="col-span-2 grid grid-cols-6 gap-4 text-sm">
        {/* Top Row */}
        {["trackingNumber", "purchaseOrder"].map((name) => (
          <div key={name} className="col-span-2">
            <label className="block text-xs font-medium mb-0.5">{t(name)}</label>
            <Input name={name} value={form[name]} onChange={handleChange} className="px-2 py-1 text-sm" />
          </div>
        ))}

        <div className="col-span-2">
          <AutocompleteInput
            label={t("client")}
            value={clients.find(c => c.id === form.clientId) ? { id: form.clientId, label: clients.find(c => c.id === form.clientId).companyName } : null}
            onChange={val => setForm(p => ({ ...p, clientId: val?.id ?? null }))}
            suggestions={clients.map(c => ({ id: c.id, label: c.companyName }))}
          />
        </div>

   <div className="col-span-6 grid grid-cols-2 gap-4">
  {/* SHIPPER */}
  <div className="border p-2 rounded">
    <h4 className="font-semibold text-sm mb-2">{t("shipper")}</h4>
   <AutocompleteInput
  label="Company Name"
  value={
    form.shipperId
      ? { id: form.shipperId, label: shippers.find(s => s.id === form.shipperId)?.companyName }
      : { id: null, label: form.shipperCompanyName }
  }
  suggestions={shippers.map(s => ({ id: s.id, label: s.companyName }))}
 onInputChange={(text) => {
  if (text.trim() === "") {
    // Clear all shipper fields if input is empty
    setForm((p) => ({
      ...p,
      shipperId: null,
      shipperCompanyName: "",
      shipperContact: "",
      shipperAddress: "",
      shipperCity: "",
      shipperPostalCode: "",
      shipperProvince: "",
      shipperCountry: "",
      shipperPhoneNumber: ""
    }));
  } else {
    setForm((p) => ({
      ...p,
      shipperCompanyName: text,
      shipperId: null
    }));
  }
}}

  onChange={(val) => {
   if (val) {
  const selected = shippers.find(s => s.id === val.id);
  if (selected) {
    setForm((p) => ({
      ...p,
      shipperId: selected.id,
      shipperCompanyName: selected.companyName,
      shipperContact: selected.contact ?? "",
      shipperAddress: selected.address ?? "",
      shipperCity: selected.city ?? "",
      shipperPostalCode: selected.postalCode ?? "",
      shipperProvince: selected.province ?? "",
      shipperCountry: selected.country ?? "",
      shipperPhoneNumber: selected.phoneNumber ?? "",
    }));
  }
  }}}
  onCreate={async (text) => {
    const payload = {
      companyName: text,
      contact: form.shipperContact,
      address: form.shipperAddress,
      city: form.shipperCity,
      postalCode: form.shipperPostalCode,
      province: form.shipperProvince,
      country: form.shipperCountry,
      phoneNumber: form.shipperPhoneNumber
    };
    const res = await api.post('/shippers', payload);
    const newShipper = res.data;
    setShippers(prev => [...prev, newShipper]);
    setForm(p => ({
      ...p,
      shipperId: newShipper.id,
      shipperCompanyName: newShipper.companyName,
    }));
  }}
/>

  {[
  { label: t('contact'), name: 'shipperContact' },
  { label: t('address'), name: 'shipperAddress' },
  { label: t('postalCode'), name: 'shipperPostalCode' },
  { label: t('country'), name: 'shipperCountry' },
  { label: t('province'), name: 'shipperProvince' },
  { label: t('city'), name: 'shipperCity' },
  { label: t('phone'), name: 'shipperPhoneNumber' },
].map(({ label, name }) => (
  <div key={name} className="mb-1">
    <label className="block text-xs font-medium mb-0.5">{label}</label>

    {name === "shipperCountry" ? (
      <Select
        value={form.shipperCountry || ""}
        onValueChange={(value) =>
          setForm((p) => ({
            ...p,
            shipperCountry: value,
            shipperProvince: "", // reset province when country changes
          }))
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Select Country" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="CANADA">Canada</SelectItem>
          <SelectItem value="USA">USA</SelectItem>
        </SelectContent>
      </Select>
    ) : name === "shipperProvince" ? (
<Select
  value={form.shipperProvince || ""}
  onValueChange={(value) => {
    setForm((p) => ({ ...p, shipperProvince: value }));
  }}
  disabled={!form.shipperCountry}
>
        <SelectTrigger>
          <SelectValue placeholder="Select Province/State" />
        </SelectTrigger>
        <SelectContent>
          {(countryProvinceMap[form.shipperCountry] || []).map((prov) => (
            <SelectItem key={prov} value={prov}>
              {prov}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    ) : (
      <Input
        name={name}
        value={form[name] || ""}
        onChange={handleChange}
        className="px-2 py-1 text-sm"
      />
    )}
  </div>
))}

    <button
  type="button"
  className="mt-2 bg-blue-500 text-white px-2 py-1 rounded"
 onClick={async () => {
  if (!form.shipperCompanyName) {
    alert("Veuillez saisir un nom de société pour le shipper.");
    return;
  }

  const payload = {
    companyName: form.shipperCompanyName,
    contact: form.shipperContact,
    address: form.shipperAddress,
    city: form.shipperCity,
    postalCode: form.shipperPostalCode,
    province: form.shipperProvince,
    country: form.shipperCountry,
    phoneNumber: form.shipperPhoneNumber
  };

  try {
    let newShipper;

    if (form.shipperId) {
      // Update existing shipper
      await api.put(`/shippers/${form.shipperId}`, payload);
      newShipper = { id: form.shipperId, ...payload };

      // Update in local list
      setShippers(prev =>
        prev.map(s => (s.id === form.shipperId ? newShipper : s))
      );
    } else {
      // Create new shipper
      const response = await api.post('/shippers', payload);
      newShipper = response.data;
      setShippers(prev => [...prev, newShipper]);
    }

    setForm(p => ({ ...p, shipperId: newShipper.id }));
  } catch (error) {
    console.error("Erreur lors de la sauvegarde du shipper :", error);
    alert("Échec de sauvegarde du shipper.");
  }
}}

>
    {isEditMode ? t("update") : t("create")}

</button>
  </div>

<div className="border p-2 rounded">
  <h4 className="font-semibold text-sm mb-2">{t("consignee")}</h4>

<AutocompleteInput
  label={t("companyName")}
  suggestions={consignees.map(c => ({ id: c.id, label: c.companyName }))}
  onInputChange={(text) => {
  if (text.trim() === "") {
    setForm((p) => ({
      ...p,
      consigneeId: null,
      consigneeCompanyName: "",
      consigneeContact: "",
      consigneeAddress: "",
      consigneeCity: "",
      consigneePostalCode: "",
      consigneeProvince: "",
      consigneeCountry: "",
      consigneePhoneNumber: ""
    }));
  } else {
    setForm((p) => ({
      ...p,
      consigneeCompanyName: text,
      consigneeId: null
    }));
  }
}}

  value={
    selectedConsignee
      ? { id: selectedConsignee.id, label: selectedConsignee.companyName }
      : null
  }
  onChange={val => {
  const consignee = consignees.find(c => c.id === val?.id);
  
  if (consignee) {
    setForm(p => ({
      ...p,
      consigneeId: consignee.id,
      consigneeCompanyName: consignee.companyName,
      consigneeContact: consignee.contact ?? "",
      consigneeAddress: consignee.address ?? "",
      consigneeCity: consignee.city ?? "",
      consigneePostalCode: consignee.postalCode ?? "",
      consigneeProvince: consignee.province ?? "",
      consigneeCountry: consignee.country ?? "",
      consigneePhoneNumber: consignee.phoneNumber ?? "",
    }));
  }
}}
 onCreate={async (input) => {
  const payload = {
    companyName: input,
    contact: form.consigneeContact,
    address: form.consigneeAddress,
    city: form.consigneeCity,
    postalCode: form.consigneePostalCode,
    province: form.consigneeProvince,
    country: form.consigneeCountry,
    phoneNumber: form.consigneePhoneNumber,
  };
       try {
        let newConsignee;
       if (form.consigneeId) {
  await api.put(`/consignees/${form.consigneeId}`, payload); // 🔁 PUT if ID exists

          newConsignee = { id: form.consigneeId, ...payload };
          setConsignees(prev => prev.map(c => (c.id === form.consigneeId ? newConsignee : c)));
        } else {
  const response = await api.post("/consignees", payload);
          newConsignee = response.data;
          setConsignees(prev => [...prev, newConsignee]);
        }

        setForm(p => ({ ...p, consigneeId: newConsignee.id }));
      } catch (error) {
        console.error("Erreur lors de la création/mise à jour du destinataire :", error);
        alert("Échec de sauvegarde du destinataire.");
      }
    }}
  />

 {[
  { label: t('contact'), name: 'consigneeContact' },
  { label: t('address'), name: 'consigneeAddress' },
  { label: t('postalCode'), name: 'consigneePostalCode' },
  { label: t('country'), name: 'consigneeCountry' },
   { label: t('province'), name: 'consigneeProvince' },
  { label: t('city'), name: 'consigneeCity' },
  { label: t('phone'), name: 'consigneePhoneNumber' },
].map(({ label, name }) => (
  <div key={name} className="mb-1">
    <label className="block text-xs font-medium mb-0.5">{label}</label>

    {name === "consigneeCountry" ? (
      <Select
        value={form.consigneeCountry || ""}
        onValueChange={(value) => {
          setForm((p) => ({ ...p, consigneeCountry: value, consigneeProvince: "" }));
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select Country" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="CANADA">Canada</SelectItem>
          <SelectItem value="USA">USA</SelectItem>
        </SelectContent>
      </Select>
    ) : name === "consigneeProvince" ? (
     <Select
  value={form.consigneeProvince || ""}
  onValueChange={(value) => {
    setForm((p) => ({ ...p, consigneeProvince: value }));
  }}
  disabled={!form.consigneeCountry}
>

        <SelectTrigger>
          <SelectValue placeholder="Select Province/State" />
        </SelectTrigger>
        <SelectContent>
          {(countryProvinceMap[form.consigneeCountry] || []).map((prov) => (
            <SelectItem key={prov} value={prov}>
              {prov}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    ) : (
      <Input
        name={name}
        value={form[name] || ""}
        onChange={handleChange}
        className="px-2 py-1 text-sm"
      />
    )}
  </div>
))}


  <button
    type="button"
    className="mt-2 bg-blue-600 text-white px-3 py-1.5 rounded"
    onClick={async () => {
      if (!form.consigneeCompanyName || form.consigneeCompanyName.trim() === "") {
  alert("Veuillez saisir un nom de société pour le destinataire.");
  return;
}

const payload = {
  companyName: form.consigneeCompanyName,
  contact: form.consigneeContact,
  address: form.consigneeAddress,
  city: form.consigneeCity,
  postalCode: form.consigneePostalCode,
  province: form.consigneeProvince,
  country: form.consigneeCountry,
  phoneNumber: form.consigneePhoneNumber,
};

      try {
        if (form.consigneeId) {
          await api.put(`/consignees/${form.consigneeId}`, payload);
          toast({ title: t('consignee_updated') });
        } else {
          const response = await api.post("/consignees", payload);
          toast({ title: t('consignee_created') });
          setForm(p => ({ ...p, consigneeId: response.data.id }));
        }
      } catch (error) {
        console.error("Erreur lors de la soumission du destinataire :", error);
        alert("Échec de soumission du destinataire.");
      }
    }}
  >{isEditMode ? t("update") : t("create")}
  </button>
</div>

</div>

    

      <div className="col-span-6 grid grid-cols-4 gap-4">
  {["pickupDate", "shippingHours", "deliveryDate", "receivingHours"].map(name => (
    <div key={name}>
      <label className="block text-xs font-medium mb-0.5">{t(name)}</label>
      <Input
        name={name}
        type={name.includes("Date") ? "date" : "text"}
        value={
          name.includes("Date") && form[name]
            ? new Date(form[name]).toISOString().split("T")[0]
            : form[name] || ""
        }
        onChange={handleChange}
        className="px-2 py-1 text-sm"
      />
    </div>
  ))}
</div>


{/* Force wide container to prevent squishing */}
<div className="w-full min-w-[800px] flex flex-col gap-6">

  {/* Row 1 */}
  <div className="grid grid-cols-4 gap-4">

{[
  { label: "Dimension", key: "dimensions", type: "text" },
  { label: "Weight", key: "weight", type: "text" },
  { label: "Quantity", key: "quantity", type: "number" }
].map(({ label, key, type }) => (
  <div key={key}>
    <label className="block text-xs font-medium mb-1">{label}</label>
    <input
      type={type}
      value={form[key] || ""}
      onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
      className="w-full border rounded px-2 py-1 text-sm"
    />
  </div>
))}
<div>
  <label className="block text-xs font-medium mb-1">Appointment</label>
  <select
    value={form.appointment}
    onChange={(e) => setForm(p => ({ ...p, appointment: e.target.value }))}
    className="w-full border rounded px-2 py-1 text-sm"
  >
    <p className="text-xs mt-1 text-gray-500">Appointment value: {form.appointment}</p>

    <option value="">Select</option>
    <option value="yes">Yes</option>
    <option value="no">No</option>
  </select>
</div>
{showModal && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white rounded-lg p-6 w-[90%] max-w-md shadow-lg relative">
      <h2 className="text-lg font-semibold mb-4">Set Appointment Times</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Pick-Up Time</label>
        <input
          type="time"
          value={form.startShippingHours || ''}
          onChange={(e) =>
            setForm((p) => ({ ...p, startShippingHours: e.target.value }))
          }
          className="w-full border rounded px-3 py-2 text-sm"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">Delivery Time</label>
        <input
          type="time"
          value={form.startReceivingHours || ''}
          onChange={(e) =>
            setForm((p) => ({ ...p, startReceivingHours: e.target.value }))
          }
          className="w-full border rounded px-3 py-2 text-sm"
        />
      </div>

      <button
        onClick={() => setShowModal(false)}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Save & Close
      </button>
    </div>
  </div>
)}

  </div>
<div className="border p-2 rounded">
  <h4 className="font-semibold text-sm mb-2">{t("carrier")}</h4>

  <AutocompleteInput
    label={t("companyName")}
    suggestions={carriers.map(c => ({ id: c.id, label: c.companyName }))}
    value={
      carriers.find(c => c.id === form.carrierId)
        ? {
            id: form.carrierId,
            label: carriers.find(c => c.id === form.carrierId)?.companyName,
          }
        : null
    }
    onChange={val => {
  const carrier = carriers.find(c => c.id === val?.id);
  if (carrier) {
    setForm(p => ({
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

    onCreate={async (input) => {
      const payload = {
        companyName: input,
        dispatcher: form.dispatcher,
        email: form.email,
        address: form.address,
        companyNumber: form.companyNumber,
      };

      try {
        let newCarrier;
        if (form.carrierId) {
          await api.put(`/carriers/${form.carrierId}`, payload);
          newCarrier = { id: form.carrierId, ...payload };
          setCarriers(prev =>
            prev.map(c => (c.id === form.carrierId ? newCarrier : c))
          );
        } else {
          const response = await api.post("/carriers", payload);
          newCarrier = response.data;
          setCarriers(prev => [...prev, newCarrier]);
        }

        setForm(p => ({ ...p, carrierId: newCarrier.id }));
      } catch (error) {
        console.error("Erreur lors de la création/mise à jour du transporteur :", error);
        alert("Échec de sauvegarde du transporteur.");
      }
    }}
  />

  <div className="grid grid-cols-2 gap-4 mt-2">
   {[
  { label: t("dispatcher"), name: "carrierDispatcher" },
  { label: t("email"), name: "carrierEmail" },
  { label: t("address"), name: "carrierAddress" },
  { label: t("companyNumber"), name: "carrierCompanyNumber" },
].map(({ label, name }) => (
  <div key={name}>
    <label className="block text-xs font-medium mb-0.5">{label}</label>
    <Input
      name={name}
      value={form[name] || ""}
      onChange={handleChange}
      className="px-2 py-1 text-sm w-full"
    />
  </div>
))}

  </div>


 <button
  type="button"
  className="mt-4 bg-blue-500 text-white px-3 py-1 rounded"
  onClick={async () => {
    if (!form.companyName?.trim()) {
      alert("Veuillez saisir un nom de société pour le transporteur.");
      return;
    }

    const payload = {
      companyName: form.companyName,
      dispatcher: form.dispatcher,
      email: form.email,
      address: form.address,
        companyNumber: form.companyNumber, 
          equipement: form.equipementId ? { id: form.equipementId } : null, // ✅ add this
 // ✅ add this line

    };

    const existingCarrier = carriers.find(
      (c) => c.companyName.trim().toLowerCase() === form.companyName.trim().toLowerCase()
    );

    try {
      if (existingCarrier) {
        // Carrier exists → PUT
        await api.put(`/carriers/${existingCarrier.id}`, payload);
        toast({ title: t("carrier_updated") });
        setForm((prev) => ({ ...prev, carrierId: existingCarrier.id }));
      } else {
        // New company → POST
        const response = await api.post("/carriers", payload);
        const newCarrier = response.data;
        toast({ title: t("carrier_created") });
        setCarriers((prev) => [...prev, newCarrier]);
        setForm((prev) => ({ ...prev, carrierId: newCarrier.id }));
      }
    } catch (error) {
      console.error("Erreur lors de la soumission du transporteur :", error);
      alert("Échec de soumission du transporteur.");
    }
  }}
>
  Save
</button>

</div>

{/* Row 2: Price */}
<div className="grid grid-cols-3 gap-4">
  {[
    { name: "price", label: "Price" },
    { name: "priceAdditionalCharges", label: "Additional Price Charges", type: "price" },
    { name: "totalPrice", label: "Total Price" },
  ].map(({ name, label, type }) => (
    <div key={name}>
      <label className="block text-xs font-medium mb-1 whitespace-normal">{label}</label>
      <div className="flex items-center gap-2">
        <Input
          name={name}
          value={form[name]}
          onChange={handleChange}
          className="w-full px-2 py-1 text-sm"
          readOnly={type === "price"} // Make it readonly only for additional charges
        />
        {type === "price" && (
          <button type="button" onClick={() => handleOpenChargesModal("price")}>
            <Eye className="w-4 h-4 text-blue-600" />
          </button>
        )}
      </div>
    </div>
  ))}
{showChargesModal && (
  <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
    <div className="bg-white p-4 rounded shadow w-[500px]">
      <h2 className="text-lg font-bold mb-4">
        {chargeType === "price" ? "Price Additional Charges" : "Cost Additional Charges"}
      </h2>

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {additionalCharges.map((charge, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              className="w-1/2 border px-2 py-1 text-sm"
              placeholder="Name"
              value={charge.name}
              onChange={(e) => updateCharge(index, "name", e.target.value)}
            />
            <input
              type="number"
              className="w-1/2 border px-2 py-1 text-sm"
              placeholder="Amount"
              value={charge.amount}
              onChange={(e) => updateCharge(index, "amount", e.target.value)}
            />
          </div>
        ))}
        <button
          type="button"
          className="text-blue-600 text-sm"
          onClick={() =>
            setAdditionalCharges([...additionalCharges, { name: "", amount: 0, type: chargeType }])
          }
        >
          + Add Charge
        </button>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button className="px-3 py-1 bg-gray-300 rounded" onClick={() => setShowChargesModal(false)}>
          Cancel
        </button>
        <button
          className="px-3 py-1 bg-blue-600 text-white rounded"
          onClick={async () => {
            try {
              await api.post(`/loads/${id}/additional-charges`, additionalCharges.map(c => ({
                ...c,
                type: chargeType,
              })));

              const total = additionalCharges.reduce((sum, c) => sum + (c.amount || 0), 0);
              setForm((prev) => ({
                ...prev,
                ...(chargeType === "price"
                  ? { priceAdditionalCharges: total }
                  : { costAdditionalCharges: total }),
              }));

              setShowChargesModal(false);
              toast({ title: "Success", description: "Charges saved." });
            } catch (error) {
              toast({ title: "Error", description: "Failed to save charges." });
            }
          }}
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}


</div>

{/* Row 3: Cost */}
<div className="grid grid-cols-3 gap-4 mt-2">
  {[
    { name: "cost", label: "Cost" },
    { name: "costAdditionalCharges", label: "Additional Cost Charges", type: "cost" },
    { name: "totalCost", label: "Total Cost" },
  ].map(({ name, label, type }) => (
    <div key={name}>
      <label className="block text-xs font-medium mb-1 whitespace-normal">{label}</label>
      <div className="flex items-center gap-2">
        <Input
          name={name}
          value={form[name]}
          onChange={handleChange}
          className="w-full px-2 py-1 text-sm"
          readOnly={type === "cost"} // Make it readonly only for additional charges
        />
        {type === "cost" && (
          <button type="button" onClick={() => handleOpenChargesModal("cost")}>
            <Eye className="w-4 h-4 text-green-600" />
          </button>
        )}
      </div>
    </div>
  ))}
</div>


</div>

        {/* Additional Info */}
        <div className="col-span-6">
          <label className="block text-xs font-medium mb-0.5">Additional Information </label>
          <textarea
            name="additionalInformation"
            value={form.additionalInformation || ""}
            onChange={(e) => setForm(p => ({ ...p, additionalInformation : e.target.value }))}
            rows={3}
            className="w-full border rounded px-2 py-1 text-sm"
                placeholder="Enter any additional informations here "

          />
       
  <label className="block text-xs font-medium mb-0.5">Shipper additional Information</label>
  <textarea
    name="additionalShipper"
    value={form.additionalShipper}
    onChange={handleChange}
    rows={4}
    className="w-full px-2 py-1 text-sm border rounded"
    placeholder="Enter any additional information for the shipper..."
  />
</div>

        {/* COD and Type */}
        <div className="col-span-3">
          <label className="block text-xs font-medium mb-0.5">{t("cod_type")}</label>
          <Select value={form.codType} onValueChange={val => setForm(p => ({ ...p, codType: val }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="COLLECT">Collect</SelectItem>
              <SelectItem value="COD">Cash on Delivery</SelectItem>
              <SelectItem value="PREPAID">Prepaid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-3">
          <label className="block text-xs font-medium mb-0.5">Type</label>
          <Select value={form.type} onValueChange={val => setForm(p => ({ ...p, type: val }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="LTL">LTL</SelectItem>
              <SelectItem value="FTL">FTL</SelectItem>
            </SelectContent>
          </Select>
        </div>
<div className="col-span-3">
  <label className="block text-xs font-medium mb-0.5">Pickup Number</label>
  <input
    type="text"
    value={form.pickupNumber}
    className="w-full px-2 py-1 text-sm border rounded bg-gray-100"
    placeholder="Pickup number"
  />
</div>

<div className="col-span-3">
  <label className="block text-xs font-medium mb-0.5">Dropoff Number</label>
  <input
    type="text"
    value={form.dropoffNumber}
    className="w-full px-2 py-1 text-sm border rounded bg-gray-100"
    placeholder="Dropoff number"
  />
</div>

        <div className="col-span-6 flex justify-end mt-2">
          <Button type="submit">{id ? t("update") : t("create")}</Button>
        </div>
       
      </form>
  
        {/* RIGHT PANEL: Load Updates + Profit + Buttons */}
        <div className="flex flex-col gap-4 text-sm">
          <div className="border p-2 rounded">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-sm">{t("load_updates")}</h3>
              <Button size="sm" variant="outline" onClick={postUpdate}>{t("add")}</Button>
            </div>
            <textarea
              value={newUpdate}
              onChange={(e) => setNewUpdate(e.target.value)}
              placeholder="Write an update..."
              rows={3}
              className="w-full border rounded px-2 py-1 mb-2 text-sm"
            />
            <div className="h-64 overflow-y-auto pr-2 space-y-2">
              {updates.length > 0 ? updates.map((u, i) => (
                <div key={i} className="bg-gray-100 p-2 rounded">
                  <p className="text-xs text-blue-600 font-medium">
                    {u.user?.username} — {new Date(u.timestamp).toLocaleString()}
                  </p>
                  <pre className="whitespace-pre-line break-words">{u.message}</pre>
                </div>
              )) : <p className="text-muted-foreground italic">{t("no_updates_yet")}</p>}
            </div>
          </div>
  
          <div className="border p-2 rounded">
            <p>Total: ${form.totalPrice}</p>
            <p>Cost: ${form.totalCost}</p>
            <p className="font-bold">Profit: ${form.profit} ({form.profitPourcentage}%)</p>
          </div>
  
      <Button className="bg-blue-600 text-white w-full" onClick={downloadPdf}>
  {t("download_load_confirmation")}
</Button>

<Button className="bg-blue-600 text-white w-full" onClick={downloadBillOfLading}>
  {t("download_bill_of_lading")}
</Button>

{load?.status?.toUpperCase() === "DELIVERED" && (
  <>
    <Button className="bg-blue-600 text-white w-full" onClick={viewInvoice}>
      {t("view_invoice")}
    </Button>

    <Button
      className={`${invoiceSent ? "bg-red-600" : "bg-blue-600"} text-white w-full`}
      onClick={sendInvoice}
      disabled={invoiceSent} // optionally disable after sending
    >
      {invoiceSent ? t("invoice_sent") : t("send_invoice")}
    </Button>

    {message && (
      <div className="mt-2 text-sm text-green-600">
        {message}
      </div>
    )}
  </>
)}


{load?.status?.toUpperCase() === "DELIVERED" && (
  <div className="col-span-6">
    <label className="block text-xs font-medium mb-0.5">Proof of Delivery (PDF)</label>
    <FileUpload
      name="file"
      accept="application/pdf,image/*"
      maxFileSize={5000000} // 5MB
      customUpload
      uploadHandler={async (event) => {
        const file = event.files[0];
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


        </div>
      
      </div>
     {showRatingModal && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded p-6 shadow max-w-sm w-full">
      <h3 className="text-lg font-semibold mb-4">Rate the Carrier</h3>
      <div className="flex justify-center mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setCarrierRating(star)}
            className={`text-3xl ${
              star <= carrierRating ? "text-yellow-500" : "text-gray-300"
            }`}
          >
            ★
          </button>
        ))}
      </div>
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={() => setShowRatingModal(false)}>Cancel</Button>
        <Button
          onClick={() => {
            setShowRatingModal(false);
            setForm(prev => ({ ...prev, rating: carrierRating }));
          }}
        >
          Save Rating
        </Button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}  