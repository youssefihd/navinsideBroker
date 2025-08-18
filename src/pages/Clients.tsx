import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '@/components/common/DataTable';
import { toast } from '@/components/ui/use-toast';
import axios from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface Client {
  id: number;
  companyName: string;
  contact: string;
  contactNumber: string;
  email: string;
  address: string;
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const fetchClients = () => {
    setLoading(true);
    axios.get('/clients')
      .then(res => setClients(res.data))
      .catch(err => {
        toast({
          title: t('error_loading'),
          description: t('clients_fetch_fail'),
        });
        console.error(err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm(t('delete_confirm_client'))) return;
    try {
      await axios.delete(`/clients/${id}`);
      toast({ title: t('client_deleted') });
      fetchClients();
    } catch (error) {
      toast({ title: t('error'), description: t('client_delete_fail') });
      console.error(error);
    }
  };

  const handleEdit = (id: number) => {
    navigate(`/clients/edit/${id}`);
  };

  const handleAddClient = () => {
    navigate('/clients/create');
  };

  const clientsColumns = [
    { header: t('companyName'), accessorKey: 'companyName' },
    { header: t('contact'), accessorKey: 'contact' },
    { header: t('email'), accessorKey: 'email' },
    { header: t('phone'), accessorKey: 'contactNumber' },
    { header: t('address'), accessorKey: 'address' },
    {
      header: t('actions'),
      cell: (client: Client) => (
        <div className="flex gap-2">
          <Button type="submit" className="bg-blue-600 text-white" onClick={() => handleEdit(client.id)}>
            {t('edit')}
          </Button>
          <Button variant="destructive" onClick={() => handleDelete(client.id)}>
            {t('delete')}
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <DataTable 
        data={clients} 
        columns={clientsColumns} 
        title={t('clients')} 
        onAdd={handleAddClient}
        isLoading={loading}
      />
    </div>
  );
}
