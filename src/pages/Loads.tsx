
import { DataTable } from '@/components/common/DataTable';
import { StatusDistributionChart, Status } from '@/components/common/StatusDistributionChart';
import { toast } from '@/components/ui/use-toast';

// Types
interface Load {
  id: string;
  reference: string;
  origin: string;
  destination: string;
  status: string;
  date: string;
  carrier: string;
}

// Exemple de données pour les charges
const loadsData: Load[] = [
  {
    id: '1',
    reference: 'LD-2023-001',
    origin: 'Paris, FR',
    destination: 'Lyon, FR',
    status: 'En cours',
    date: '2025-05-01',
    carrier: 'Transport Express',
  },
  {
    id: '2',
    reference: 'LD-2023-002',
    origin: 'Marseille, FR',
    destination: 'Nice, FR',
    status: 'Livré',
    date: '2025-04-28',
    carrier: 'Logistique Rapide',
  },
  {
    id: '3',
    reference: 'LD-2023-003',
    origin: 'Bordeaux, FR',
    destination: 'Toulouse, FR',
    status: 'Planifié',
    date: '2025-05-10',
    carrier: 'Transport Sud',
  },
  {
    id: '4',
    reference: 'LD-2023-004',
    origin: 'Lille, FR',
    destination: 'Strasbourg, FR',
    status: 'En cours',
    date: '2025-05-03',
    carrier: 'Nord Logistics',
  },
  {
    id: '5',
    reference: 'LD-2023-005',
    origin: 'Nantes, FR',
    destination: 'Rennes, FR',
    status: 'Planifié',
    date: '2025-05-15',
    carrier: 'Ouest Transport',
  },
];

// Map existing status to our Status enum
const getStatusEnum = (status: string): Status => {
  switch (status) {
    case 'Planifié': return Status.Quoting;
    case 'En cours': return Status.PickedUp;
    case 'Livré': return Status.Delivered;
    default: return Status.Confirmed;
  }
};

// Colonnes pour le tableau de charges
const loadsColumns = [
  { header: 'Référence', accessorKey: 'reference' as keyof Load },
  { header: 'Origine', accessorKey: 'origin' as keyof Load },
  { header: 'Destination', accessorKey: 'destination' as keyof Load },
  { 
    header: 'Statut', 
    accessorKey: 'status' as keyof Load,
    cell: (item: Load) => {
      const statusClasses = {
        'En cours': 'bg-blue-100 text-blue-800',
        'Livré': 'bg-green-100 text-green-800',
        'Planifié': 'bg-yellow-100 text-yellow-800',
      };
      const statusClass = statusClasses[item.status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800';
      
      return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}>
          {item.status}
        </span>
      );
    }
  },
  { header: 'Date', accessorKey: 'date' as keyof Load },
  { header: 'Transporteur', accessorKey: 'carrier' as keyof Load },
];

// Calculate status distribution
const calculateStatusDistribution = () => {
  const statusCounts: { [key in Status]: number } = {
    [Status.Quoting]: 0,
    [Status.Confirmed]: 0,
    [Status.PickedUp]: 0,
    [Status.Delivered]: 0
  };
  
  loadsData.forEach(load => {
    const status = getStatusEnum(load.status);
    statusCounts[status] += 1;
  });
  
  const statusColors = {
    [Status.Quoting]: '#9b87f5',   // Purple
    [Status.Confirmed]: '#F97316', // Bright Orange
    [Status.PickedUp]: '#0EA5E9',  // Ocean Blue
    [Status.Delivered]: '#10B981'  // Green
  };
  
  return Object.entries(statusCounts).map(([status, count]) => ({
    status: status as Status,
    count,
    color: statusColors[status as Status]
  }));
};

export default function Loads() {
  const statusDistribution = calculateStatusDistribution();
  const totalLoads = loadsData.length;
  
  const handleAddLoad = () => {
    toast({
      title: "Nouvelle charge",
      description: "Fonctionnalité à implémenter",
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-4">
        <div className="md:col-span-3">
          <DataTable 
            data={loadsData} 
            columns={loadsColumns} 
            title="Charges" 
            onAdd={handleAddLoad}
          />
        </div>
        <div>
          <StatusDistributionChart 
            data={statusDistribution} 
            total={totalLoads} 
          />
        </div>
      </div>
    </div>
  );
}
