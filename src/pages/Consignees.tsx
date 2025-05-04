
import { DataTable } from '@/components/common/DataTable';

interface Consignee {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
}

const consigneesData: Consignee[] = [
  {
    id: '1',
    name: 'Entrepôt Central',
    contact: 'François Leclerc',
    email: 'f.leclerc@entrepot-central.fr',
    phone: '+33 1 11 22 33 44',
    address: 'Paris, FR',
  },
  {
    id: '2',
    name: 'Distri Sud',
    contact: 'Clara Martin',
    email: 'c.martin@distri-sud.com',
    phone: '+33 4 55 66 77 88',
    address: 'Marseille, FR',
  },
  {
    id: '3',
    name: 'Logistique Est',
    contact: 'Thierry Durand',
    email: 't.durand@logistique-est.fr',
    phone: '+33 3 99 88 77 66',
    address: 'Strasbourg, FR',
  },
  {
    id: '4',
    name: 'Nord Distribution',
    contact: 'Nathalie Petit',
    email: 'n.petit@nord-distri.fr',
    phone: '+33 3 12 23 34 45',
    address: 'Lille, FR',
  },
  {
    id: '5',
    name: 'Centre Logistique Ouest',
    contact: 'Paul Dubois',
    email: 'p.dubois@clo-ouest.com',
    phone: '+33 2 45 56 67 78',
    address: 'Nantes, FR',
  },
];

const consigneesColumns = [
  { header: 'Nom', accessorKey: 'name' as keyof Consignee },
  { header: 'Contact', accessorKey: 'contact' as keyof Consignee },
  { header: 'Email', accessorKey: 'email' as keyof Consignee },
  { header: 'Téléphone', accessorKey: 'phone' as keyof Consignee },
  { header: 'Adresse', accessorKey: 'address' as keyof Consignee },
];

export default function Consignees() {
  return (
    <div className="space-y-6">
      <DataTable 
        data={consigneesData} 
        columns={consigneesColumns} 
        title="Destinataires" 
      />
    </div>
  );
}
