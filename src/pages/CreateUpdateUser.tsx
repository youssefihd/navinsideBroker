import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/lib/axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { MultiSelect } from "@/components/common/MultiSelect";
import { useTranslation } from "react-i18next";

interface Role {
  role: string;
}

export default function CreateUpdateUser() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const { t } = useTranslation();

  const [form, setForm] = useState({
    userId: '',
    username: '',
    email: '',
    password: '',
    roles: [] as string[],
  });
  const [allRoles, setAllRoles] = useState<Role[]>([]);

  useEffect(() => {
    api.get('/roles')
      .then(res => setAllRoles(res.data))
      .catch(() =>
        toast({ title: t('error'), description: t('role_load_fail') })
      );

    if (isEdit) {
      api.get(`/users/${id}`)
        .then(res => {
          const user = res.data;
          setForm({
            userId: user.userId,
            username: user.username,
            email: user.email,
            password: '',
            roles: user.roles.map((r: Role) => r.role),
          });
        })
        .catch(() =>
          toast({ title: t('error'), description: t('user_not_found') })
        );
    }
  }, [id, t]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const payload = {
    username: form.username,
    email: form.email,
    password: form.password,
    roles: form.roles.map(role => ({ role })),
  };

  try {
    if (isEdit) {
      await api.put(`/users/${id}`, payload);
      toast({ title: t('user_updated') });
    } else {
      await api.post('/users', payload); // No userId
      toast({ title: t('user_created') });
    }
    navigate('/users');
  } catch {
    toast({ title: t('error'), description: t('user_save_fail') });
  }
};


  return (
    <div className="max-w-xl mx-auto mt-10 space-y-6">
      <h2 className="text-2xl font-bold">
        {isEdit ? t('edit_user') : t('create_user')}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">{t('username')}</label>
          <Input name="username" value={form.username} onChange={handleChange} required />
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <Input name="email" type="email" value={form.email} onChange={handleChange} required />
        </div>
        {!isEdit && (
          <div>
            <label className="block text-sm font-medium">{t('password')}</label>
            <Input name="password" type="password" value={form.password} onChange={handleChange} required />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium">{t('roles')}</label>
          <MultiSelect
            options={allRoles.map(r => r.role)}
            selected={form.roles}
            onChange={(roles) => setForm(prev => ({ ...prev, roles }))}
          />
        </div>
        <div className="text-right">
          <Button type="submit" className="bg-blue-600 text-white">
            {isEdit ? t('update') : t('create')}
          </Button>
        </div>
      </form>
    </div>
  );
}
