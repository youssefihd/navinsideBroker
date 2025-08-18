import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/axios';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

interface Role {
  role: string;
}

interface AppUser {
  userId: string;
  username: string;
  email: string;
  roles: Role[];
}

const columns = [
  { header: 'Username', accessorKey: 'username' as keyof AppUser },
  { header: 'Email', accessorKey: 'email' as keyof AppUser },
  {
    header: 'Roles',
    accessorKey: 'roles' as keyof AppUser,
    cell: (row: AppUser) => row.roles.map(r => r.role).join(', '),
  },
  {
    header: 'Actions',
    accessorKey: 'actions',
    cell: (row: AppUser) => (
      <div className="flex gap-2">
        <Button size="sm" onClick={() => handleEdit(row.userId)}>Modifier</Button>
        <Button size="sm" variant="destructive" onClick={() => handleDelete(row.userId)}>Supprimer</Button>
      </div>
    )
  }
];

let handleEdit = (id: string) => {};
let handleDelete = (id: string) => {};

export default function Users() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  handleEdit = (id: string) => navigate(`/users/edit/${id}`);

  handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    try {
      await api.delete(`/users/${id}`);
      toast({ title: 'Utilisateur supprimé avec succès' });
      fetchUsers();
    } catch {
      toast({ title: 'Erreur', description: 'Échec de la suppression.' });
    }
  };

  const fetchUsers = () => {
    api.get('/users')
      .then(res => setUsers(res.data))
      .catch(() => toast({ title: 'Erreur', description: 'Impossible de charger les utilisateurs.' }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="space-y-6">
      <DataTable
        title="Utilisateurs"
        data={users}
        columns={columns}
        isLoading={loading}
        onAdd={() => navigate('/users/create')}
      />
    </div>
  );
}