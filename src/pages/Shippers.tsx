
import { DataTable } from '@/components/common/DataTable';
import { toast } from '@/components/ui/use-toast';

interface Shipper {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
}

const shippersData: Shipper[] = [
  {
    id: '1',
    name: 'Production Nationale',
    contact: 'Antoine Lefèvre',
    email: 'a.lefevre@prod-nationale.fr',
    phone: '+33 1 23 45 67 89',
    address: 'Paris, FR',
  },
  {
    id: '2',
    name: 'Industrie du Sud',
    contact: 'Céline Durand',
    email: 'c.durand@industrie-sud.fr',
    phone: '+33 4 98 76 54 32',
    address: 'Marseille, FR',
  },
  {
    id: '3',
    name: 'Agro Export',
    contact: 'Thomas Bernard',
    email: 't.bernard@agroexport.com',
    phone: '+33 5 11 22 33 44',
    address: 'Bordeaux, FR',
  },
  {
    id: '4',
    name: 'Tech Logistics',
    contact: 'Julie Martin',
    email: 'j.martin@techlogistics.fr',
    phone: '+33 1 44 55 66 77',
    address: 'Paris, FR',
  },
  {
    id: '5',
    name: 'Nord Industries',
    contact: 'Marc Petit',
    email: 'm.petit@nordindustries.fr',
    phone: '+33 3 88 99 77 66',
    address: 'Lille, FR',
  },
];

const shippersColumns = [
  { header: 'Nom', accessorKey: 'name' as keyof Shipper },
  { header: 'Contact', accessorKey: 'contact' as keyof Shipper },
  { header: 'Email', accessorKey: 'email' as keyof Shipper },
  { header: 'Téléphone', accessorKey: 'phone' as keyof Shipper },
  { header: 'Adresse', accessorKey: 'address' as keyof Shipper },
];

export default function Shippers() {
  const handleAddShipper = () => {
    toast({
      title: "Nouvel expéditeur",
      description: "Fonctionnalité à implémenter",
    });
  };
  
  return (
    <div className="space-y-6">
      <DataTable 
        data={shippersData} 
        columns={shippersColumns} 
        title="Expéditeurs" 
        onAdd={handleAddShipper}
      />
    </div>
  );
}
