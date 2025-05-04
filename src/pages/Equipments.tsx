
import { DataTable } from '@/components/common/DataTable';

interface Equipment {
  id: string;
  type: string;
  identifier: string;
  status: string;
  location: string;
  lastMaintenance: string;
}

const equipmentsData: Equipment[] = [
  {
    id: '1',
    type: 'Remorque',
    identifier: 'REM-001',
    status: 'En service',
    location: 'Paris',
    lastMaintenance: '2025-04-15',
  },
  {
    id: '2',
    type: 'Conteneur',
    identifier: 'CONT-A123',
    status: 'Disponible',
    location: 'Marseille',
    lastMaintenance: '2025-03-22',
  },
  {
    id: '3',
    type: 'Remorque réfrigérée',
    identifier: 'REMR-002',
    status: 'En maintenance',
    location: 'Lyon',
    lastMaintenance: '2025-05-02',
  },
  {
    id: '4',
    type: 'Camion',
    identifier: 'CAM-B456',
    status: 'En service',
    location: 'Lille',
    lastMaintenance: '2025-04-10',
  },
  {
    id: '5',
    type: 'Conteneur',
    identifier: 'CONT-C789',
    status: 'Disponible',
    location: 'Bordeaux',
    lastMaintenance: '2025-04-28',
  },
];

const equipmentsColumns = [
  { header: 'Type', accessorKey: 'type' as keyof Equipment },
  { header: 'Identifiant', accessorKey: 'identifier' as keyof Equipment },
  { 
    header: 'Statut', 
    accessorKey: 'status' as keyof Equipment,
    cell: (item: Equipment) => {
      const statusClasses = {
        'En service': 'bg-green-100 text-green-800',
        'Disponible': 'bg-blue-100 text-blue-800',
        'En maintenance': 'bg-orange-100 text-orange-800',
      };
      const statusClass = statusClasses[item.status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800';
      
      return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}>
          {item.status}
        </span>
      );
    }
  },
  { header: 'Localisation', accessorKey: 'location' as keyof Equipment },
  { header: 'Dernière maintenance', accessorKey: 'lastMaintenance' as keyof Equipment },
];

export default function Equipments() {
  return (
    <div className="space-y-6">
      <DataTable 
        data={equipmentsData} 
        columns={equipmentsColumns} 
        title="Équipements" 
      />
    </div>
  );
}
