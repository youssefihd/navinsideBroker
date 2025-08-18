import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { DataTable } from "@/components/common/DataTable";
import { StatusDistributionChart, Status } from "@/components/common/StatusDistributionChart";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

export interface LoadSummary {
  id: number;
  loadId: number;
  price: number;
  cost: number;
  type: string;
  status: string;
  pickupCompanyName: string;
  deliveryCompanyName: string;
  clientContact: string;
  carrierCompanyName: string;
}
const getStatusEnum = (status: string): Status => {
  const normalized = status.toLowerCase();
  switch (normalized) {
    case "quoting":
      return Status.Quoting;
    case "confirmed":
      return Status.Confirmed;
    case "pickedup":
      return Status.PickedUp;
    case "delivered":
      return Status.Delivered;
    case "lost":
      return Status.Lost;
    case "canceled":
      return Status.Canceled;
    default:
      return Status.Confirmed;
  }
};




export default function Loads() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: loads = [], isLoading, refetch } = useQuery({
    queryKey: ["loads", statusFilter],
    queryFn: async () => {
      const url = statusFilter !== "all" ? `/loads/search?status=${encodeURIComponent(statusFilter)}` : "loads/loads/summary";
      const res = await api.get(url);
      return res.data;
    },
  });

  useEffect(() => {
    refetch();
  }, [statusFilter, refetch]);

  const calculateStatusDistribution = () => {
   const counts: Record<Status, number> = {
  [Status.Quoting]: 0,
  [Status.Confirmed]: 0,
  [Status.PickedUp]: 0,
  [Status.Delivered]: 0,
  [Status.Lost]: 0, // ← Add this line
    [Status.Canceled]: 0, // ← Add this line

};

    loads.forEach((load: LoadSummary) => {
      const status = getStatusEnum(load.status);
      counts[status]++;
    });
    const colors = {
      [Status.Quoting]: "#facc15",
      [Status.Confirmed]: "#fb923c",
      [Status.PickedUp]: "#60a5fa",
      [Status.Delivered]: "#34d399",
      [Status.Lost]: "#f87171",
      [Status.Canceled]: "#49c671", // ← Add this line
// ← Add this line

    };
    return Object.entries(counts).map(([status, count]) => ({
      status: status as Status,
      count,
      color: colors[status as Status],
    }));
  };

  const handleAddLoad = () => {
    navigate("/loads/create");
  };

  const loadsColumns = [
    { header: t("load_id"), accessorKey: "id" },
    { header: t("price"), accessorKey: "price" },
    { header: t("cost"), accessorKey: "cost" },
    { header: t("type"), accessorKey: "type" },
    {
      header: t("pickup"),
      accessorKey: "pickupCompanyName",
      cell: (item: LoadSummary) => item.pickupCompanyName || "-",
    },
    {
      header: t("delivery"),
      accessorKey: "deliveryCompanyName",
      cell: (item: LoadSummary) => item.deliveryCompanyName || "-",
    },
    {
      header: t("status"),
      accessorKey: "status",
      cell: (item: LoadSummary) => {
        const statusColors = {
          Delivered: "bg-green-100 text-green-800",
          Quoting: "bg-yellow-100 text-yellow-800",
          Confirmed: "bg-orange-100 text-orange-800",
          PickedUp: "bg-blue-100 text-blue-800",
          Lost : "bg-red-100 text-red-800",
           Canceled : "bg-purple-100 text-purple-800",

        };
        const statusKey = getStatusEnum(item.status);
        const className =
          statusColors[Status[statusKey] as keyof typeof statusColors] ?? "bg-gray-100 text-gray-800";
        return (
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
            {t(item.status.toLowerCase())}
          </span>
        );
      },
    },
    {
      header: t("actions"),
      cell: (item: LoadSummary) => (
        <div className="flex space-x-2">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/loads/update/${item.id}`);
            }}
            type="button"
            className="bg-blue-600 text-white"
          >
            {t("update")}
          </Button>
          <Button
            onClick={async (e) => {
              e.stopPropagation();
              try {
                await api.delete(`/loads/${item.id}`);
                toast({ title: t("delete_success") });
                refetch();
              } catch (err) {
                toast({ title: t("error"), description: t("delete_fail") });
                console.error(err);
              }
            }}
            type="button"
            className="bg-red-600 text-white"
          >
            {t("delete")}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t("loads")}</h2>
        <Select onValueChange={setStatusFilter} defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("filter_by_status")} />
          </SelectTrigger>
         <SelectContent>
  <SelectItem value="Quoting">{t("quoting")}</SelectItem>
  <SelectItem value="PickedUp">{t("pickedup")}</SelectItem>
  <SelectItem value="DELIVERED">{t("delivered")}</SelectItem>
  <SelectItem value="LOST">{t("lost")}</SelectItem>
    <SelectItem value="Canceled">{t("canceled")}</SelectItem>
    <SelectItem value="Confirmed">{t("confirmed")}</SelectItem>
  <SelectItem value="all">{t("all")}</SelectItem>
</SelectContent>

        </Select>
      </div>

      <div className="">
        <div className="">
          <DataTable
            data={loads}
            columns={loadsColumns}
            title={t("loads_list")}
            onAdd={handleAddLoad}
            isLoading={isLoading}
            onRowClick={(row) => navigate(`/loads/view/${row.id}`)}
          />
        </div>
        <div>
        </div>
      </div>
    </div>
  );
}
