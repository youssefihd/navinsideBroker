import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DataTable } from '@/components/common/DataTable';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import api from '@/lib/axios';

interface Shipper {
  id: number;
  companyName: string;
  contact: string;
  address: string;
  postalCode: string;
  province: string;
  country: string;
  city: string;
  phoneNumber: string;
}

export default function Shippers() {
  const [shippers, setShippers] = useState<Shipper[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    fetchShippers();
  }, []);

  const fetchShippers = () => {
    api.get('/shippers')
      .then(res => setShippers(res.data))
      .catch(err => {
        console.error('Erreur lors du chargement des expéditeurs:', err);
        toast({
          title: t('error'),
          description: t('shippers_fetch_fail'),
        });
      })
      .finally(() => setLoading(false));
  };

  const handleAddShipper = () => {
    navigate('/shippers/create');
  };

  const handleEdit = (id: number) => {
    navigate(`/shippers/edit/${id}`);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('delete_confirm'))) return;
    try {
      await api.delete(`/shippers/${id}`);
      toast({ title: t('delete_success') });
      fetchShippers();
    } catch (err) {
      toast({ title: t('error'), description: t('delete_fail') });
    }
  };

  const shippersColumns = [
    { header: t('company_name'), accessorKey: 'companyName' as keyof Shipper },
    { header: t('contact'), accessorKey: 'contact' as keyof Shipper },
    { header: t('phone'), accessorKey: 'phoneNumber' as keyof Shipper },
    { header: t('address'), accessorKey: 'address' as keyof Shipper },
    { header: t('city'), accessorKey: 'city' as keyof Shipper },
    { header: t('postal_code'), accessorKey: 'postalCode' as keyof Shipper },
    { header: t('province'), accessorKey: 'province' as keyof Shipper },
    { header: t('country'), accessorKey: 'country' as keyof Shipper },
    {
      header: t('actions'),
      accessorKey: 'actions',
      cell: (item: Shipper) => (
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
        data={shippers} 
        columns={shippersColumns} 
        title={t('shippers')} 
        onAdd={handleAddShipper}
        isLoading={loading}
      />
    </div>
  );
}
