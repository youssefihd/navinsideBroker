import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "@/lib/axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useTranslation } from "react-i18next";
import CarrierDocumentManager from "@/pages/CarrierDocumentManager";
const initialState = {
  companyName: "",
  dispatcher: "",
  email: "",
  contactNumber: "",
  fleet: "",
  rating: 0,
  address: "",
  country: "",
  coverage: "",
};

export default function CreateUpdateCarrier() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      setLoading(true);
      axios.get(`/carriers/${id}`)
        .then((res) => setForm(res.data))
        .catch(() => {
          toast({ title: t('error'), description: t('carrier_load_fail') });
        })
        .finally(() => setLoading(false));
    }
  }, [id, t]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (id) {
        await axios.put(`/carriers/${id}`, form);
        toast({ title: t('carrier_updated') });
      } else {
        await axios.post("/carriers", form);
        toast({ title: t('carrier_created') });
      }
      navigate("/carriers");
    } catch (error) {
      toast({ title: t('error'), description: t('carrier_submit_fail') });
    }
  };

  const fields: { label: string; name: keyof typeof form }[] = [
    { label: t('companyName'), name: "companyName" },
    { label: t('dispatcher'), name: "dispatcher" },
    { label: t('email'), name: "email" },
    { label: t('phone'), name: "contactNumber" },
    { label: t('fleet'), name: "fleet" },
    { label: t('country'), name: "country" },
    { label: t('address'), name: "address" },
     { label: t('coverage'), name: "coverage" },
  ];

  return (
    <div className="max-w-xl mx-auto mt-10 space-y-6">
      <h2 className="text-2xl font-bold">
        {id ? t('edit_carrier') : t('create_carrier')}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map(({ label, name }) => (
          <div key={name}>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <Input
              type="text"
              name={name}
              value={form[name]}
              onChange={handleChange}
              required
            />
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium mb-1">{t('rating')} (0–5)</label>
          <Input
            type="number"
            name="rating"
            min="0"
            max="5"
            step="0.1"
            value={form.rating}
            onChange={handleChange}
          />
        </div>

        <div className="pt-4 text-right">
          <Button type="submit" className="bg-blue-600 text-white">
            {id ? t('update') : t('create')}
          </Button>
        </div>
      </form>
      {id && (
  <CarrierDocumentManager
  carrierId={parseInt(id!)}
  filename={uploadedFileName}
  onUploadComplete={(name) => setUploadedFileName(name)}
/>
)}

    </div>
    
  );
}
