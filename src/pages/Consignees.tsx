import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/axios';
import { DataTable } from '@/components/common/DataTable';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface Consignee {
  id: number;
  companyName: string;
  contact: string;
  address: string;
  postalCode: string;
  province: string;
  country: string;
  city: string;
  phoneNumber: string;
  mcNumber: string;
}

export default function Consignees() {
  const [consignees, setConsignees] = useState<Consignee[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    api.get('/consignees')
      .then(res => setConsignees(res.data))
      .catch(err => {
        console.error('Erreur lors du chargement des destinataires:', err);
        toast({
          title: t('error'),
          description: t('consignees_fetch_fail'),
        });
      })
      .finally(() => setLoading(false));
  }, [t]);

  const columns = [
    { header: t('companyName'), accessorKey: 'companyName' as keyof Consignee },
    { header: t('contact'), accessorKey: 'contact' as keyof Consignee },
    { header: t('address'), accessorKey: 'address' as keyof Consignee },
    { header: t('postalCode'), accessorKey: 'postalCode' as keyof Consignee },
    { header: t('city'), accessorKey: 'city' as keyof Consignee },
    { header: t('province'), accessorKey: 'province' as keyof Consignee },
    { header: t('country'), accessorKey: 'country' as keyof Consignee },
    { header: t('phone'), accessorKey: 'phoneNumber' as keyof Consignee },
    { header: t('mcnumber'), accessorKey: 'mcNumber' as keyof Consignee },
    {
      header: t('actions'),
      accessorKey: 'actions' as any,
      cell: (consignee: Consignee) => (
        <div className="flex gap-2">
          <Button size="sm" className="bg-blue-600 text-white" onClick={() => navigate(`/consignees/edit/${consignee.id}`)}>
            {t('edit')}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={async () => {
              try {
                await api.delete(`/consignees/${consignee.id}`);
                toast({ title: t('delete_success') });
                setConsignees(consignees.filter(c => c.id !== consignee.id));
              } catch {
                toast({ title: t('error'), description: t('delete_fail') });
              }
            }}
          >
            {t('delete')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <DataTable
        data={consignees}
        columns={columns}
        title={t('consignees')}
        isLoading={loading}
        onAdd={() => navigate('/consignees/create')}
      />
    </div>
  );
}
