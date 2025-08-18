import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '@/lib/axios';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

interface Carrier {
  id: number;
  companyName: string;
  dispatcher: string;
  email: string;
  contactNumber: string;
  fleet: string;
  rating: number;
  address: string;
}

export default function Carriers() {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    fetchCarriers();
  }, []);

  const fetchCarriers = () => {
    setLoading(true);
    axios
      .get('/carriers')
      .then((res) => setCarriers(res.data))
      .catch((err) => {
        console.error('Error loading carriers:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('delete_confirm'))) return;
    try {
      await axios.delete(`/carriers/${id}`);
      toast({ title: t('delete_success') });
      fetchCarriers();
    } catch (err) {
      toast({ title: t('delete_fail') });
    }
  };

  const handleEdit = (id: number) => {
    navigate(`/carriers/edit/${id}`);
  };

  const handleAddCarrier = () => {
    navigate('/carriers/create');
  };

  const carriersColumns = [
    { header: t('companyName'), accessorKey: 'companyName' as keyof Carrier },
    { header: t('contact'), accessorKey: 'dispatcher' as keyof Carrier },
    { header: t('email'), accessorKey: 'email' as keyof Carrier },
    { header: t('phone'), accessorKey: 'contactNumber' as keyof Carrier },
    { header: t('address'), accessorKey: 'address' as keyof Carrier },
{
  header: t('rating'),
  accessorKey: 'rating' as keyof Carrier,
  cell: (item: Carrier) => {
    const rating = Math.round(item.rating || 0);
    const stars = '★'.repeat(rating);
    const emptyStars = '☆'.repeat(5 - rating);

    return (
      <div className="flex items-center gap-1">
        <span className="text-yellow-500">{stars}</span>
        <span className="text-gray-300">{emptyStars}</span>
        <span className="text-xs text-gray-500">({item.rating?.toFixed(1) ?? "0.0"})</span>
      </div>
    );
  },
},
{
      header: t('actions'),
      accessorKey: 'actions',
      cell: (item: Carrier) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(item.id)}>
            {t('edit')}
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
            {t('delete')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <DataTable
        data={carriers}
        columns={carriersColumns}
        title={t('carriers')}
        isLoading={loading}
        onAdd={handleAddCarrier}
      />
    </div>
  );
}
