import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import { Eye } from "lucide-react";
import { format } from "date-fns";
import { DataTable } from "@/components/common/DataTable";

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

const LostLoadsTable = () => {
  const [lostLoads, setLostLoads] = useState<LoadSummary[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLostLoads = async () => {
      try {
        const res = await api.get("/loads/loads/summary");
        const allLoads: LoadSummary[] = res.data;
        const filtered = allLoads.filter((l) => l.status === "LOST");
        setLostLoads(filtered);
      } catch (err) {
        console.error("Failed to fetch loads", err);
      }
    };

    fetchLostLoads();
  }, []);

  const columns = [
    {
      header: "Load ID",
      accessorKey: "id",
    },
    {
      header: "Client",
      accessorKey: "clientName",
    },
    {
      header: "Pickup Date",
      accessorKey: "pickupDate",
      cell: (row: LoadSummary) =>
        row.pickupDate ? format(new Date(row.pickupDate), "yyyy-MM-dd") : "-",
    },
    {
      header: "Delivery Date",
      accessorKey: "deliveryDate",
      cell: (row: LoadSummary) =>
        row.deliveryDate ? format(new Date(row.deliveryDate), "yyyy-MM-dd") : "-",
    },
    {
      header: "Status",
      accessorKey: "status",
    },
    {
      header: "Price",
      accessorKey: "price",
      cell: (row: LoadSummary) => `$${(row.price ?? 0).toFixed(2)}`,
    },
    {
      header: "Cost",
      accessorKey: "cost",
      cell: (row: LoadSummary) => `$${(row.cost ?? 0).toFixed(2)}`,
    },
    {
      header: "Profit",
      accessorKey: "profit",
      cell: (row: LoadSummary) => {
        const price = row.price ?? 0;
        const cost = row.cost ?? 0;
        return `$${(price - cost).toFixed(2)}`;
      },
    },
    {
      header: "",
      accessorKey: "actions",
      cell: (row: LoadSummary) => (
        <Eye
          className="w-4 h-4 cursor-pointer"
          onClick={() => navigate(`/loads/update/${row.id}`)}
        />
      ),
    },
  ];

  return <DataTable data={lostLoads} columns={columns} title="Lost Loads" />;
};

export default LostLoadsTable;
