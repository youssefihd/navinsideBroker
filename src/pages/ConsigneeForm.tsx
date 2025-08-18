import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/lib/axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

interface Consignee {
  id?: number;
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

export default function ConsigneeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const { t } = useTranslation();

  const [form, setForm] = useState<Consignee>({
    companyName: '',
    contact: '',
    address: '',
    postalCode: '',
    province: '',
    country: '',
    city: '',
    phoneNumber: '',
    mcNumber: '',
  });

  useEffect(() => {
    if (isEditMode) {
      api.get(`/consignees/${id}`)
        .then(res => setForm(res.data))
        .catch(() => {
          toast({ title: t('error'), description: t('consignee_load_fail') });
          navigate('/consignees');
        });
    }
  }, [id, isEditMode, navigate, t]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await api.put(`/consignees/${id}`, form);
        toast({ title: t('consignee_updated') });
      } else {
        await api.post('/consignees', form);
        toast({ title: t('consignee_created') });
      }
      navigate('/consignees');
    } catch (err) {
      toast({ title: t('error'), description: t('consignee_save_fail') });
      console.error(err);
    }
  };

  const fields: { label: string; name: keyof Consignee }[] = [
    { label: t('companyName'), name: 'companyName' },
    { label: t('contact'), name: 'contact' },
    { label: t('address'), name: 'address' },
    { label: t('postalCode'), name: 'postalCode' },
    { label: t('province'), name: 'province' },
    { label: t('country'), name: 'country' },
    { label: t('city'), name: 'city' },
    { label: t('phone'), name: 'phoneNumber' },
    { label: t('mcnumber'), name: 'mcNumber' },

  ];

  return (
    <div className="max-w-2xl mx-auto mt-10 space-y-6 bg-white shadow-md rounded p-6">
      <h2 className="text-2xl font-bold">
        {isEditMode ? t('edit_consignee') : t('create_consignee')}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map(({ label, name }) => (
          <div key={name}>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <Input
              name={name}
              value={form[name]}
              onChange={handleChange}
              required
            />
          </div>
        ))}

        <div className="flex justify-end pt-4">
          <Button type="submit" className="bg-blue-600 text-white">
            {isEditMode ? t('update') : t('create')}
          </Button>
        </div>
      </form>
    </div>
  );
}
