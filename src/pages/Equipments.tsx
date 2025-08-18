import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '@/components/common/DataTable';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import api from '@/lib/axios';
import { useTranslation } from 'react-i18next';

interface Equipment {
  id: number;
  type: string;
}

export default function Equipments() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    fetchEquipments();
  }, []);

  const fetchEquipments = () => {
    api.get('/equipements')
      .then(res => setEquipments(res.data))
      .catch(err => {
        console.error('Erreur lors du chargement des équipements:', err);
        toast({
          title: t('error'),
          description: t('equipment_load_fail'),
        });
      })
      .finally(() => setLoading(false));
  };

  const handleAddEquipment = () => {
    navigate('/equipements/create');
  };

  const handleEdit = (id: number) => {
    navigate(`/equipements/edit/${id}`);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('delete_confirm_equipment'))) return;
    try {
      await api.delete(`/equipements/${id}`);
      toast({ title: t('equipment_deleted') });
      fetchEquipments();
    } catch (err) {
      toast({ title: t('error'), description: t('equipment_delete_fail') });
    }
  };

  const equipmentsColumns = [
    { header: 'ID', accessorKey: 'id' as keyof Equipment },
    { header: t('type'), accessorKey: 'type' as keyof Equipment },
    {
      header: t('actions'),
      accessorKey: 'actions',
      cell: (item: Equipment) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(item.id)}>{t('edit')}</Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>{t('delete')}</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <DataTable
        data={equipments}
        columns={equipmentsColumns}
        title={t('equipments')}
        onAdd={handleAddEquipment}
        isLoading={loading}
      />
    </div>
  );
}