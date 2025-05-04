
import { DataTable } from '@/components/common/DataTable';

interface Carrier {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  fleet: string;
  rating: number;
}

const carriersData: Carrier[] = [
  {
    id: '1',
    name: 'Transport Express',
    contact: 'Philippe Dubois',
    email: 'p.dubois@transport-express.com',
    phone: '+33 1 23 45 67 89',
    fleet: '15 camions',
    rating: 4.8,
  },
  {
    id: '2',
    name: 'Logistique Rapide',
    contact: 'Isabelle Leroy',
    email: 'i.leroy@lograpide.fr',
    phone: '+33 1 98 76 54 32',
    fleet: '8 camions',
    rating: 4.2,
  },
  {
    id: '3',
    name: 'Transport Sud',
    contact: 'Michel Blanc',
    email: 'm.blanc@transportsud.fr',
    phone: '+33 4 11 22 33 44',
    fleet: '22 camions',
    rating: 4.5,
  },
  {
    id: '4',
    name: 'Nord Logistics',
    contact: 'Catherine Dupont',
    email: 'c.dupont@nordlogistics.fr',
    phone: '+33 3 45 67 89 01',
    fleet: '12 camions',
    rating: 3.9,
  },
  {
    id: '5',
    name: 'Ouest Transport',
    contact: 'Alain Moreau',
    email: 'a.moreau@ouesttransport.com',
    phone: '+33 2 34 56 78 90',
    fleet: '7 camions',
    rating: 4.3,
  },
];

const carriersColumns = [
  { header: 'Nom', accessorKey: 'name' as keyof Carrier },
  { header: 'Contact', accessorKey: 'contact' as keyof Carrier },
  { header: 'Email', accessorKey: 'email' as keyof Carrier },
  { header: 'Téléphone', accessorKey: 'phone' as keyof Carrier },
  { header: 'Flotte', accessorKey: 'fleet' as keyof Carrier },
  { 
    header: 'Note', 
    accessorKey: 'rating' as keyof Carrier,
    cell: (item: Carrier) => {
      const stars = '★'.repeat(Math.round(item.rating));
      const emptyStars = '☆'.repeat(5 - Math.round(item.rating));
      
      return (
        <span className="text-yellow-500">{stars}<span className="text-gray-300">{emptyStars}</span></span>
      );
    }
  },
];

export default function Carriers() {
  return (
    <div className="space-y-6">
      <DataTable 
        data={carriersData} 
        columns={carriersColumns} 
        title="Transporteurs" 
      />
    </div>
  );
}
