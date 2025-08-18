import React, { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Selectt from 'react-select';
import { DataTable } from '@/components/common/DataTable';

const ChecklistTaskEditorPage = () => {
  const [form, setForm] = useState({
    id: null,
    originCountry: '',
    originProvince: [],
    destinationCountry: '',
    destinationProvince: [],
    equipments: [],
    type: [],
    clients: [],
    tasks: [],
    emails: []
  });
const [editingId, setEditingId] = useState(null);
  const [taskInput, setTaskInput] = useState('');
  const [equipmentOptions, setEquipmentOptions] = useState([]);
  const [clientOptions, setClientOptions] = useState([]);
const [emailInput, setEmailInput] = useState('');

  const countryProvinceMap = {
    Canada: ["Ontario", "Quebec", "British Columbia", "Alberta", "Manitoba", "New Brunswick", "Newfoundland and Labrador", "Nova Scotia", "Prince Edward Island", "Saskatchewan"],
    USA: [
      "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
      "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
      "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
      "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
      "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
      "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
      "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
      "Wisconsin", "Wyoming"
    ]
  };

  useEffect(() => {
    axios.get('/equipements')
      .then(res => setEquipmentOptions(res.data))
      .catch(() => setEquipmentOptions([]));
  }, []);

  useEffect(() => {
    axios.get('/clients')
      .then(res => setClientOptions(res.data))
      .catch(() => setClientOptions([]));
  }, []);


  const removeTask = (index) => {
    setForm(prev => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index)
    }));
  };

  // ✅ Ensure "Request Quote" always exists in tasks in-memory
  const ensureRequestQuote = (tasks = []) =>
    Array.from(new Set([...(tasks || []), "Request Quote"]));

  // ✅ Click handler from the table
  const handleEdit = async (rowData) => {
    const id = rowData?.id ?? rowData?.original?.id;
    if (!id) return;

    try {
      const res = await axios.get(`/api/admin/checklists/${id}`);
      const c = res.data;

      setForm({
        id: c.id,
        originCountry: c.originCountry || '',
        originProvince: c.originProvince || [],
        destinationCountry: c.destinationCountry || '',
        destinationProvince: c.destinationProvince || [],
        // react-select expects [{id}] for your current onChange
        equipments: (c.equipments || []).map(e => ({ id: e.id })),
        type: c.type || [],
        clients: (c.clients || []).map(cl => ({ id: cl.id })),
        tasks: ensureRequestQuote(c.tasks),
        emails: c.emails || []
      });

      setEditingId(id);
      // optional: scroll to the form
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error("Failed to load checklist", err);
      // toast({ title: "Error", description: "Failed to load checklist" });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({
      id: null,
      originCountry: '',
      originProvince: [],
      destinationCountry: '',
      destinationProvince: [],
      equipments: [],
      type: [],
      clients: [],
      tasks: [],
      emails: []
    });
    setEmailInput('');
  };

  // ✅ Your existing addTask but make sure it doesn’t duplicate
  const addTask = () => {
    const val = taskInput.trim();
    if (!val) return;
    setForm(prev => ({ ...prev, tasks: Array.from(new Set([...(prev.tasks || []), val])) }));
    setTaskInput('');
  };

  // ✅ Submit: send id when editing; backend createOrUpdate will handle update
  const handleSubmit = async () => {
    // Make sure "Request Quote" is always there
    const payload = {
      ...form,
      tasks: ensureRequestQuote(form.tasks),
    };
    try {
      await axios.post('/api/admin/checklists', payload); // same endpoint for create/update
      // toast({ title: editingId ? "Checklist updated" : "Checklist created" });
      setEditingId(null);
      setForm({
        id: null,
        originCountry: '', originProvince: [],
        destinationCountry: '', destinationProvince: [],
        equipments: [], type: [], clients: [], tasks: [], emails: []
      });
      setTaskInput('');
      setEmailInput('');
      fetchChecklists();
    } catch (e) {
      console.error('Failed to save checklist', e);
      // toast({ title: "Error", description: "Failed to save checklist" });
    }
  };


  const [checklists, setChecklists] = useState([]);

  const fetchChecklists = async () => {
    try {
      const res = await axios.get('/api/admin/checklists');
      setChecklists(res.data);
    } catch (error) {
      console.error('Failed to fetch checklists', error);
    }
  };

  const deleteChecklist = async (id) => {
    try {
      await axios.delete(`/api/admin/checklists/${id}`);
      setChecklists(prev => prev.filter(cl => cl.id !== id));
    } catch (error) {
      console.error('Failed to delete checklist', error);
    }
  };

  useEffect(() => {
    fetchChecklists();
  }, []);

  return (
    <>
      <Card className="p-6">
        <CardContent className="space-y-4">
          <h2 className="text-xl font-bold">Create Load Checklist</h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Origin Country */}
            <Selectt
              options={[
              { value: 'Canada', label: 'Canada' }, 
{ value: 'USA', label: 'USA' }

              ]}
              value={form.originCountry ? { value: form.originCountry, label: form.originCountry } : null}
              onChange={(selected) => setForm(prev => ({
                ...prev,
                originCountry: selected.value,
                originProvince: [] // reset province
              }))}
              placeholder="Origin Country"
            />

            {/* Origin Province */}
            <Selectt
              isMulti
              options={(countryProvinceMap[form.originCountry] || []).map(p => ({ value: p, label: p }))}
              value={form.originProvince.map(p => ({ value: p, label: p }))}
              onChange={(selectedOptions) =>
                setForm(p => ({
                  ...p,
                  originProvince: selectedOptions.map(o => o.value)
                }))
              }
              placeholder="Origin Province"
            />

            {/* Destination Country */}
            <Selectt
              options={[
               { value: 'Canada', label: 'Canada' }, 
{ value: 'USA', label: 'USA' }

              ]}
              value={form.destinationCountry ? { value: form.destinationCountry, label: form.destinationCountry } : null}
              onChange={(selected) => setForm(prev => ({
                ...prev,
                destinationCountry: selected.value,
                destinationProvince: [] // reset province
              }))}
              placeholder="Destination Country"
            />

            {/* Destination Province */}
            <Selectt
              isMulti
              options={(countryProvinceMap[form.destinationCountry] || []).map(p => ({ value: p, label: p }))}
              value={form.destinationProvince.map(p => ({ value: p, label: p }))}
              onChange={(selectedOptions) =>
                setForm(p => ({
                  ...p,
                  destinationProvince: selectedOptions.map(o => o.value)
                }))
              }
              placeholder="Destination Province"
            />

            {/* Equipments */}
            <Selectt
  isMulti
  options={equipmentOptions.map(e => ({ value: e.id, label: e.type }))}
  placeholder="Select Equipments"
  value={form.equipments.map(e => {
    const match = equipmentOptions.find(opt => opt.id === e.id);
    return match ? { value: match.id, label: match.type } : null;
  }).filter(Boolean)}
  onChange={(selectedOptions) =>
    setForm(p => ({
      ...p,
      equipments: selectedOptions.map(option => ({ id: option.value }))
    }))
  }
  className="w-full"
/>


            {/* Type */}
            <Selectt
              isMulti
              options={[
                { value: 'LTL', label: 'LTL' },
                { value: 'FTL', label: 'FTL' }
              ]}
              placeholder="Select Types"
              value={form.type.map(t => ({ value: t, label: t }))}
              onChange={(selectedOptions) =>
                setForm(p => ({
                  ...p,
                  type: selectedOptions.map(option => option.value),
                }))
              }
              className="w-full"
            />
          </div>

          {/* Clients Multi-select */}
          <Selectt
            isMulti
            options={clientOptions.map(c => ({ value: c.id, label: c.companyName }))}
            placeholder="Select Clients"
            value={form.clients.map(c => {
  const match = clientOptions.find(opt => opt.id === c.id);
  return match ? { value: match.id, label: match.companyName } : null;
}).filter(Boolean)}

            onChange={(selectedOptions) =>
              setForm(p => ({
                ...p,
                clients: selectedOptions.map(option => ({ id: option.value }))
              }))
            }
            className="w-full"
          />

          <div className="flex items-center gap-2 mt-4">
            <Input placeholder="New Task" value={taskInput} onChange={e => setTaskInput(e.target.value)} />
            <Button onClick={addTask}>Add Task</Button>
          </div>

          <ul className="list-disc pl-6 space-y-1">
            {form.tasks.map((task, index) => (
              <li key={index} className="flex justify-between items-center">
                <span>{task}</span>
                <Button size="sm" variant="ghost" onClick={() => removeTask(index)}>Remove</Button>
              </li>
            ))}
          </ul>
{/* Email List Input */}
<div className="col-span-2">
  <label className="block font-medium">Emails for Quote Requests</label>
  <div className="flex gap-2 mt-1">
    <Input
      type="email"
      placeholder="Enter email"
      value={emailInput || ''}
      onChange={(e) => setEmailInput(e.target.value)}
    />
    <Button
      type="button"
      onClick={() => {
        if (emailInput && !form.emails.includes(emailInput)) {
          setForm(prev => ({ ...prev, emails: [...prev.emails, emailInput] }));
          setEmailInput('');
        }
      }}
    >
      Add
    </Button>
  </div>

  {/* Show added emails */}
  <ul className="mt-2 space-y-1">
    {form.emails.map((email, idx) => (
      <li key={idx} className="flex items-center justify-between bg-gray-100 px-2 py-1 rounded">
        <span>{email}</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setForm(prev => ({
              ...prev,
              emails: prev.emails.filter((_, i) => i !== idx)
            }));
          }}
        >
          Remove
        </Button>
      </li>
    ))}
  </ul>
</div>

          <Button onClick={handleSubmit}>Save Checklist</Button>
        </CardContent>
      </Card>

      {/* Checklist Table */}
      <div className="p-6 space-y-4">
        <h2 className="text-2xl font-bold">All Checklists</h2>
        <DataTable
          data={checklists}
          title="Checklists"
          columns={[
            {
              header: 'Origin',
              accessorKey: 'originCountry',
              cell: (row) => `${row.originCountry} - ${row.originProvince.join(', ')}`
            },
            {
              header: 'Destination',
              accessorKey: 'destinationCountry',
              cell: (row) => `${row.destinationCountry} - ${row.destinationProvince.join(', ')}`
            },
            {
              header: 'Type',
              accessorKey: 'type',
              cell: (row) => row.type?.join(', ') || ''
            },
            {
              header: 'Equipments',
              accessorKey: 'equipments',
              cell: (row) => row.equipments.map((e) => e.type).join(', ')
            },
            {
              header: 'Clients',
              accessorKey: 'clients',
              cell: (row) => row.clients.map(c => c.contact).join(', ')
            },
            {
              header: 'Tasks',
              accessorKey: 'tasks',
              cell: (row) => (
                <ul className="list-disc pl-4">
                  {row.tasks.map((task, i) => (
                    <li key={i}>{task}</li>
                  ))}
                </ul>
              )
            },
            {
  header: 'Actions',
  accessorKey: 'actions',
  cell: (row) => (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => handleEdit(row)}>
        Update
      </Button>
      <Button variant="destructive" size="sm" onClick={() => deleteChecklist(row.id)}>
        Delete
      </Button>
    </div>
  )
}

          ]}
        />
      </div>
    </>
  );
};

export default ChecklistTaskEditorPage;
