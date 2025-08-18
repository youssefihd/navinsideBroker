import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "@/lib/axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useTranslation } from "react-i18next";

const initialState = {
  companyName: "",
  contact: "",
  address: "",
  postalCode: "",
  province: "",
  country: "",
  city: "",
  phoneNumber: "",
};

export default function CreateUpdateShipper() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (id) {
      setLoading(true);
      axios.get(`/shippers/${id}`)
        .then((res) => setForm(res.data))
        .catch(() => {
          toast({ title: t("error"), description: t("shipper_load_fail") });
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
        await axios.put(`/shippers/${id}`, form);
        toast({ title: t("shipper_updated") });
      } else {
        await axios.post("/shippers", form);
        toast({ title: t("shipper_created") });
      }
      navigate("/shippers");
    } catch (error) {
      toast({ title: t("error"), description: t("shipper_submit_fail") });
    }
  };

  const fields = [
    { label: t("companyName"), name: "companyName" },
    { label: t("contact"), name: "contact" },
    { label: t("address"), name: "address" },
    { label: t("city"), name: "city" },
    { label: t("postalCode"), name: "postalCode" },
    { label: t("province"), name: "province" },
    { label: t("country"), name: "country" },
    { label: t("phone"), name: "phoneNumber" },
  ];

  return (
    <div className="max-w-xl mx-auto mt-10 space-y-6">
      <h2 className="text-2xl font-bold">
        {id ? t("edit_shipper") : t("create_shipper")}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map(({ label, name }) => (
          <div key={name}>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <Input
              type="text"
              name={name}
              value={form[name as keyof typeof form]}
              onChange={handleChange}
              required
            />
          </div>
        ))}

        <div className="pt-4 text-right">
          <Button type="submit" className="bg-blue-600 text-white">
            {id ? t("update") : t("create")}
          </Button>
        </div>
      </form>
    </div>
  );
}
