import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/lib/axios";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface ClientForm {
  contact: string;
  contactNumber: string;
  companyNumber: string;
  email: string;
  accountingEmail: string;
  postalCode: string;
  province: string;
  address: string;
  country: string;
  companyName: string;
  userId: string;
}

export default function CreateEditClient() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useTranslation();

  const [form, setForm] = useState<ClientForm>({
    contact: "",
    contactNumber: "",
    companyNumber: "",
    email: "",
    accountingEmail: "",
    postalCode: "",
    province: "",
    address: "",
    country: "",
    companyName: "",
    userId: ""
  });

  useEffect(() => {
    if (id) {
      api.get(`/clients/${id}`)
        .then(res => setForm(res.data))
        .catch(err => console.error(err));
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (id) {
        await api.put(`/clients/${id}`, form);
        toast({ title: t("client_updated") });
      } else {
        await api.post("/clients", form);
        toast({ title: t("client_created") });
      }
      navigate("/clients");
    } catch (error) {
      toast({ title: t("error"), description: t("client_submit_fail") });
      console.error(error);
    }
  };

  const fields: { label: string; name: keyof ClientForm }[] = [
    { label: t("companyName"), name: "companyName" },
    { label: t("contact"), name: "contact" },
    { label: t("email"), name: "email" },
    { label: t("accountingEmail"), name: "accountingEmail" },
    { label: t("phone"), name: "contactNumber" },
    { label: t("companyNumber"), name: "companyNumber" },
    { label: t("postalCode"), name: "postalCode" },
    { label: t("province"), name: "province" },
    { label: t("country"), name: "country" },
    { label: t("address"), name: "address" },
    { label: t("userId"), name: "userId" },
  ];

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white shadow-md rounded p-6 space-y-6">
      <h2 className="text-2xl font-bold">{id ? t("edit_client") : t("create_client")}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map(({ label, name }) => (
          <div key={name}>
            <label className="block text-sm font-medium">{label}</label>
            <Input
              name={name}
              value={form[name]}
              onChange={handleChange}
              required
            />
          </div>
        ))}
        <div className="flex justify-end pt-4">
          <Button type="submit" className="bg-blue-600 text-white">
            {id ? t("update") : t("create")}
          </Button>
        </div>
      </form>
    </div>
  );
}
