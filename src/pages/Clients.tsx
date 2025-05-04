
import { DataTable } from '@/components/common/DataTable';
import { toast } from '@/components/ui/use-toast';

interface Client {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
}

const clientsData: Client[] = [
  {
    id: '1',
    name: 'Entreprise Martin',
    contact: 'Jean Martin',
    email: 'jean.martin@example.com',
    phone: '+33 1 23 45 67 89',
    address: 'Paris, FR',
  },
  {
    id: '2',
    name: 'Société Bernard',
    contact: 'Marie Bernard',
    email: 'marie.bernard@example.com',
    phone: '+33 1 98 76 54 32',
    address: 'Lyon, FR',
  },
  {
    id: '3',
    name: 'Groupe Thomas',
    contact: 'Pierre Thomas',
    email: 'pierre.thomas@example.com',
    phone: '+33 6 12 34 56 78',
    address: 'Marseille, FR',
  },
  {
    id: '4',
    name: 'Durand & Fils',
    contact: 'Sophie Durand',
    email: 'sophie.durand@example.com',
    phone: '+33 4 56 78 90 12',
    address: 'Bordeaux, FR',
  },
  {
    id: '5',
    name: 'Petit Import/Export',
    contact: 'Lucas Petit',
    email: 'lucas.petit@example.com',
    phone: '+33 7 89 01 23 45',
    address: 'Lille, FR',
  },
];

const clientsColumns = [
  { header: 'Nom', accessorKey: 'name' as keyof Client },
  { header: 'Contact', accessorKey: 'contact' as keyof Client },
  { header: 'Email', accessorKey: 'email' as keyof Client },
  { header: 'Téléphone', accessorKey: 'phone' as keyof Client },
  { header: 'Adresse', accessorKey: 'address' as keyof Client },
];

export default function Clients() {
  const handleAddClient = () => {
    toast({
      title: "Nouveau client",
      description: "Fonctionnalité à implémenter",
    });
  };

  return (
    <div className="space-y-6">
      <DataTable 
        data={clientsData} 
        columns={clientsColumns} 
        title="Clients" 
        onAdd={handleAddClient}
      />
    </div>
  );
}
