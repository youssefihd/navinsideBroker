import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "@/lib/axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useTranslation } from "react-i18next";

export default function CreateUpdateEquipment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (id) {
      setLoading(true);
      axios.get(`/equipements/${id}`)
        .then((res) => setType(res.data.type))
        .catch(() => {
          toast({ title: t("error"), description: t("equipment_load_fail") });
        })
        .finally(() => setLoading(false));
    }
  }, [id, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (id) {
        await axios.put(`/equipements/${id}`, { type });
        toast({ title: t("equipment_updated") });
      } else {
        await axios.post("/equipements", { type });
        toast({ title: t("equipment_created") });
      }
      navigate("/equipements");
    } catch (error) {
      toast({ title: t("error"), description: t("equipment_submit_fail") });
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 space-y-6">
      <h2 className="text-2xl font-bold">
        {id ? t("edit_equipment") : t("create_equipment")}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t("type")}</label>
          <Input
            type="text"
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
          />
        </div>

        <div className="pt-4 text-right">
          <Button type="submit" className="bg-blue-600 text-white">
            {id ? t("update") : t("create")}
          </Button>
        </div>
      </form>
    </div>
  );
}
