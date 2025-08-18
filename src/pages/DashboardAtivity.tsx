import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import { Eye } from "lucide-react";
import { format } from "date-fns";
import { DataTable } from "@/components/common/DataTable"; // Adjust the path if needed

interface LoadSummary {
  id: number;
  loadId: number;
  clientName: string;
  pickupDate: string | null;
  deliveryDate: string | null;
  status: string;
  cost?: number;
  price?: number;
  profit?: number;
}

const DashboardLoads = () => {
  const [activeLoads, setActiveLoads] = useState<LoadSummary[]>([]);
  const [quotingLoads, setQuotingLoads] = useState<LoadSummary[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLoads = async () => {
      try {
        const res = await api.get("/loads/loads/summary");
        const allLoads: LoadSummary[] = res.data;
        setActiveLoads(allLoads.filter(l => ["Confirmed", "PickedUp"].includes(l.status)));
        setQuotingLoads(allLoads.filter(l => l.status === "Quoting"));
      } catch (err) {
        console.error("Failed to fetch loads", err);
      }
    };

    fetchLoads();
  }, []);

  const columns = [
    { header: "Load ID", accessorKey: "id" },
    { header: "Client", accessorKey: "clientName" },
    {
      header: "Pickup Date",
      accessorKey: "pickupDate",
      cell: (item: LoadSummary) => item.pickupDate ? format(new Date(item.pickupDate), "yyyy-MM-dd") : "-"
    },
    {
      header: "Delivery Date",
      accessorKey: "deliveryDate",
      cell: (item: LoadSummary) => item.deliveryDate ? format(new Date(item.deliveryDate), "yyyy-MM-dd") : "-"
    },
    { header: "Status", accessorKey: "status" },
    {
      header: "",
      accessorKey: "id",
      cell: (item: LoadSummary) => (
        <button onClick={() => navigate(`/loads/update/${item.id}`)}>
          <Eye className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <DataTable data={activeLoads} columns={columns} title="Recent Activity (Confirmed / PickedUp)" />
      <DataTable data={quotingLoads} columns={columns} title="Quoting Loads" />
    </div>
  );
};

export default DashboardLoads;
