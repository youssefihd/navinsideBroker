import React, { useState, useEffect, useCallback } from 'react';
import axios from '@/lib/axios';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Select from 'react-select'; // Fixed typo
import { DataTable } from '@/components/common/DataTable';

type Subtask = { id: string; title: string };
type WorkflowTask = { id: string; title: string; subtasks: Subtask[] };

const uid = () => Math.random().toString(36).slice(2, 9);

const ChecklistTaskEditorPage: React.FC = () => {
  const [form, setForm] = useState({
    id: null as number | null,
    originCountry: '' as string,
    originProvince: [] as string[],
    destinationCountry: '' as string,
    destinationProvince: [] as string[],
    equipments: [] as { id: number }[],
    type: [] as string[],
    clients: [] as { id: number }[],
    workflows: [] as WorkflowTask[],
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // inputs
  const [taskInput, setTaskInput] = useState('');
  const [subtaskInputs, setSubtaskInputs] = useState<Record<string, string>>({});

  const [equipmentOptions, setEquipmentOptions] = useState<any[]>([]);
  const [clientOptions, setClientOptions] = useState<any[]>([]);

  const countryProvinceMap: Record<string, string[]> = {
    Canada: ['Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Nova Scotia', 'Prince Edward Island', 'Saskatchewan'],
    USA: [
      'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'
    ],
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [equipmentRes, clientRes] = await Promise.all([
          axios.get('/equipements').catch(() => ({ data: [] })),
          axios.get('/clients').catch(() => ({ data: [] }))
        ]);
        setEquipmentOptions(equipmentRes.data);
        setClientOptions(clientRes.data);
      } catch (error) {
        console.error('Failed to fetch options:', error);
      }
    };
    fetchData();
  }, []);

  // Fixed drag and drop implementation with drop indicators
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [draggedSubtask, setDraggedSubtask] = useState<{ taskId: string; subId: string } | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{ 
    type: 'task' | 'subtask'; 
    position: 'before' | 'after'; 
    targetId: string; 
    taskId?: string;
  } | null>(null);

  const onTaskDragStart = useCallback((id: string) => (e: React.DragEvent) => {
    setDraggedTask(id);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const onTaskDragOver = useCallback((overId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedTask || draggedTask === overId) return;

    // Determine drop position based on mouse position
    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const position = e.clientY < midpoint ? 'before' : 'after';
    
    setDropIndicator({ type: 'task', position, targetId: overId });

    setForm(prev => {
      const items = [...prev.workflows];
      const fromIndex = items.findIndex(t => t.id === draggedTask);
      const toIndex = items.findIndex(t => t.id === overId);
      
      if (fromIndex === -1 || toIndex === -1) return prev;
      
      const [movedItem] = items.splice(fromIndex, 1);
      const insertIndex = position === 'before' ? toIndex : toIndex + 1;
      items.splice(insertIndex, 0, movedItem);
      
      return { ...prev, workflows: items };
    });
  }, [draggedTask]);

  const onTaskDragEnd = useCallback(() => {
    setDraggedTask(null);
    setDropIndicator(null);
  }, []);

  const onSubDragStart = useCallback((taskId: string, subId: string) => (e: React.DragEvent) => {
    setDraggedSubtask({ taskId, subId });
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const onSubDragOver = useCallback((taskId: string, overSubId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedSubtask || draggedSubtask.taskId !== taskId || draggedSubtask.subId === overSubId) return;

    // Determine drop position based on mouse position
    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const position = e.clientY < midpoint ? 'before' : 'after';
    
    setDropIndicator({ type: 'subtask', position, targetId: overSubId, taskId });

    setForm(prev => {
      const workflows = prev.workflows.map(task => {
        if (task.id !== taskId) return task;
        
        const subtasks = [...task.subtasks];
        const fromIndex = subtasks.findIndex(s => s.id === draggedSubtask.subId);
        const toIndex = subtasks.findIndex(s => s.id === overSubId);
        
        if (fromIndex === -1 || toIndex === -1) return task;
        
        const [movedItem] = subtasks.splice(fromIndex, 1);
        const insertIndex = position === 'before' ? toIndex : toIndex + 1;
        subtasks.splice(insertIndex, 0, movedItem);
        
        return { ...task, subtasks };
      });
      
      return { ...prev, workflows };
    });
  }, [draggedSubtask]);

  const onSubDragEnd = useCallback(() => {
    setDraggedSubtask(null);
    setDropIndicator(null);
  }, []);

  // Component for the drop indicator line
  const DropIndicator = ({ show, position }: { show: boolean; position: 'before' | 'after' }) => {
    if (!show) return null;
    
    return (
      <div className={`relative ${position === 'before' ? '-mb-1' : '-mt-1'}`}>
        <div className="h-0.5 bg-gradient-to-r from-transparent via-violet-400 to-transparent animate-pulse">
          <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-2 h-2 bg-violet-400 rounded-full shadow-lg animate-ping"></div>
          </div>
        </div>
      </div>
    );
  };

  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!form.originCountry) newErrors.originCountry = 'Origin country is required';
    if (!form.destinationCountry) newErrors.destinationCountry = 'Destination country is required';
    if (form.originProvince.length === 0) newErrors.originProvince = 'At least one origin province is required';
    if (form.destinationProvince.length === 0) newErrors.destinationProvince = 'At least one destination province is required';
    if (form.workflows.length === 0) newErrors.workflows = 'At least one workflow task is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------- Workflow helpers ----------
  const addWorkflowTask = useCallback(() => {
    const val = taskInput.trim();
    if (!val) return;
    
    // Create new task with default subtasks
    const newTask: WorkflowTask = {
      id: uid(),
      title: val,
      subtasks: [
        { id: uid(), title: 'Picked up' },
        { id: uid(), title: 'Delivered' }
      ]
    };
    
    setForm(prev => ({ 
      ...prev, 
      workflows: [...prev.workflows, newTask] 
    }));
    setTaskInput('');
    // Clear workflow error if exists
    if (errors.workflows) {
      setErrors(prev => ({ ...prev, workflows: '' }));
    }
  }, [taskInput, errors.workflows]);

  const removeWorkflowTask = useCallback((taskId: string) => {
    setForm(prev => ({ 
      ...prev, 
      workflows: prev.workflows.filter(t => t.id !== taskId) 
    }));
  }, []);

  const addSubtask = useCallback((taskId: string) => {
    const val = (subtaskInputs[taskId] || '').trim();
    if (!val) return;
    setForm(prev => ({
      ...prev,
      workflows: prev.workflows.map(t => 
        t.id === taskId 
          ? { ...t, subtasks: [...t.subtasks, { id: uid(), title: val }] } 
          : t
      ),
    }));
    setSubtaskInputs(prev => ({ ...prev, [taskId]: '' }));
  }, [subtaskInputs]);

  const removeSubtask = useCallback((taskId: string, subId: string) => {
    setForm(prev => ({
      ...prev,
      workflows: prev.workflows.map(t => 
        t.id === taskId 
          ? { ...t, subtasks: t.subtasks.filter(s => s.id !== subId) } 
          : t
      ),
    }));
  }, []);

  // ---------- Edit / Submit / Cancel ----------
  const handleEdit = async (rowData: any) => {
    const id = rowData?.id ?? rowData?.original?.id ?? rowData?.row?.id ?? rowData?.row?.original?.id;
    if (!id) return;
    
    try {
      const res = await axios.get(`/api/admin/checklists/${id}`);
      const c = res.data;

      const incomingFlatTasks: string[] = Array.isArray(c.tasks) ? c.tasks : [];
      const workflowsFromFlat: WorkflowTask[] = incomingFlatTasks.map(t => ({ 
        id: uid(), 
        title: t, 
        subtasks: [] 
      }));
      const incomingWorkflows: WorkflowTask[] = Array.isArray(c.workflows) 
        ? c.workflows 
        : workflowsFromFlat;

      setForm({
        id: c.id ?? null,
        originCountry: c.originCountry || '',
        originProvince: c.originProvince || [],
        destinationCountry: c.destinationCountry || '',
        destinationProvince: c.destinationProvince || [],
        equipments: (c.equipments || []).map((e: any) => ({ id: e.id })),
        type: c.type || [],
        clients: (c.clients || []).map((cl: any) => ({ id: cl.id })),
        workflows: incomingWorkflows,
      });

      setEditingId(id);
      setErrors({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Failed to load checklist', err);
      setErrors({ general: 'Failed to load checklist for editing' });
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    const flatTasks = (form.workflows || []).map(t => t.title);
    const payload = { ...form, tasks: flatTasks, workflows: form.workflows };
    
    try {
      await axios.post('/api/admin/checklists', payload);
      
      // Reset form
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
        workflows: [],
      });
      setTaskInput('');
      setSubtaskInputs({});
      setErrors({});
      
      await fetchChecklists();
    } catch (e) {
      console.error('Failed to save checklist', e);
      setErrors({ general: 'Failed to save checklist. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelEdit = useCallback(() => {
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
      workflows: [],
    });
    setTaskInput('');
    setSubtaskInputs({});
    setErrors({});
  }, []);

  // ---------- Table data ----------
  const [checklists, setChecklists] = useState<any[]>([]);
  
  const fetchChecklists = useCallback(async () => {
    try {
      const res = await axios.get('/api/admin/checklists');
      setChecklists(res.data || []);
    } catch (error) {
      console.error('Failed to fetch checklists', error);
    }
  }, []);

  const deleteChecklist = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this checklist?')) return;
    
    try {
      await axios.delete(`/api/admin/checklists/${id}`);
      setChecklists(prev => prev.filter(cl => cl.id !== id));
    } catch (error) {
      console.error('Failed to delete checklist', error);
    }
  };

  useEffect(() => {
    fetchChecklists();
  }, [fetchChecklists]);

  return (
    <>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-teal-50 via-sky-50 to-indigo-50">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-800">Checklist Builder</h2>
            <p className="text-sm text-slate-500 mt-1">
              Left: Route, Equipment, Type, Clients. Right: Workflow with subtasks & <span className="font-medium">drag-to-reorder</span>.
            </p>
            {errors.general && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                {errors.general}
              </div>
            )}
          </div>

          {/* Two-pane Body */}
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT PANE */}
            <div className="space-y-6">
              {/* Route */}
              <section className="rounded-2xl border border-teal-100/70 bg-white/70 backdrop-blur p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-teal-900 mb-3">Route</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">Origin Country</label>
                    <Select
                      options={[{ value: 'Canada', label: 'Canada' }, { value: 'USA', label: 'USA' }]}
                      value={form.originCountry ? { value: form.originCountry, label: form.originCountry } : null}
                      onChange={(selected: any) => {
                        setForm(prev => ({ 
                          ...prev, 
                          originCountry: selected?.value || '', 
                          originProvince: [] 
                        }));
                        if (errors.originCountry) {
                          setErrors(prev => ({ ...prev, originCountry: '' }));
                        }
                      }}
                      placeholder="Select origin country"
                      classNamePrefix="rs"
                    />
                    {errors.originCountry && (
                      <p className="text-xs text-red-500">{errors.originCountry}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">Origin Province/State</label>
                    <Select
                      isMulti
                      options={(countryProvinceMap[form.originCountry] || []).map(p => ({ 
                        value: p, 
                        label: p 
                      }))}
                      value={form.originProvince.map(p => ({ value: p, label: p }))}
                      onChange={(selectedOptions: any[]) => {
                        setForm(prev => ({ 
                          ...prev, 
                          originProvince: selectedOptions?.map(o => o.value) || [] 
                        }));
                        if (errors.originProvince) {
                          setErrors(prev => ({ ...prev, originProvince: '' }));
                        }
                      }}
                      placeholder="Select origin province/state"
                      classNamePrefix="rs"
                      isDisabled={!form.originCountry}
                    />
                    {errors.originProvince && (
                      <p className="text-xs text-red-500">{errors.originProvince}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">Destination Country</label>
                    <Select
                      options={[{ value: 'Canada', label: 'Canada' }, { value: 'USA', label: 'USA' }]}
                      value={form.destinationCountry ? { 
                        value: form.destinationCountry, 
                        label: form.destinationCountry 
                      } : null}
                      onChange={(selected: any) => {
                        setForm(prev => ({ 
                          ...prev, 
                          destinationCountry: selected?.value || '', 
                          destinationProvince: [] 
                        }));
                        if (errors.destinationCountry) {
                          setErrors(prev => ({ ...prev, destinationCountry: '' }));
                        }
                      }}
                      placeholder="Select destination country"
                      classNamePrefix="rs"
                    />
                    {errors.destinationCountry && (
                      <p className="text-xs text-red-500">{errors.destinationCountry}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">Destination Province/State</label>
                    <Select
                      isMulti
                      options={(countryProvinceMap[form.destinationCountry] || []).map(p => ({ 
                        value: p, 
                        label: p 
                      }))}
                      value={form.destinationProvince.map(p => ({ value: p, label: p }))}
                      onChange={(selectedOptions: any[]) => {
                        setForm(prev => ({ 
                          ...prev, 
                          destinationProvince: selectedOptions?.map(o => o.value) || [] 
                        }));
                        if (errors.destinationProvince) {
                          setErrors(prev => ({ ...prev, destinationProvince: '' }));
                        }
                      }}
                      placeholder="Select destination province/state"
                      classNamePrefix="rs"
                      isDisabled={!form.destinationCountry}
                    />
                    {errors.destinationProvince && (
                      <p className="text-xs text-red-500">{errors.destinationProvince}</p>
                    )}
                  </div>
                </div>
              </section>

              {/* Equipment & Type */}
              <section className="rounded-2xl border border-sky-100/70 bg-white/70 backdrop-blur p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-sky-900 mb-3">Equipment & Shipment Type</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">Equipments</label>
                    <Select
                      isMulti
                      options={equipmentOptions.map((e: any) => ({ value: e.id, label: e.type }))}
                      placeholder="Select equipments"
                      value={form.equipments
                        .map(e => {
                          const match = equipmentOptions.find((opt: any) => opt.id === e.id);
                          return match ? { value: match.id, label: match.type } : null;
                        })
                        .filter(Boolean) as any}
                      onChange={(selectedOptions: any[]) => setForm(prev => ({ 
                        ...prev, 
                        equipments: selectedOptions?.map(o => ({ id: o.value })) || [] 
                      }))}
                      classNamePrefix="rs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">Type</label>
                    <Select
                      isMulti
                      options={[{ value: 'LTL', label: 'LTL' }, { value: 'FTL', label: 'FTL' }]}
                      placeholder="Select shipment types"
                      value={form.type.map(t => ({ value: t, label: t }))}
                      onChange={(selectedOptions: any[]) => setForm(prev => ({ 
                        ...prev, 
                        type: selectedOptions?.map(o => o.value) || [] 
                      }))}
                      classNamePrefix="rs"
                    />
                  </div>
                </div>
              </section>

              {/* Clients */}
              <section className="rounded-2xl border border-indigo-100/70 bg-white/70 backdrop-blur p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-indigo-900 mb-3">Clients</h3>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600">Assign to Clients</label>
                  <Select
                    isMulti
                    options={clientOptions.map((c: any) => ({ value: c.id, label: c.companyName }))}
                    placeholder="Select clients"
                    value={form.clients
                      .map(c => {
                        const match = clientOptions.find((opt: any) => opt.id === c.id);
                        return match ? { value: match.id, label: match.companyName } : null;
                      })
                      .filter(Boolean) as any}
                    onChange={(selectedOptions: any[]) => setForm(prev => ({ 
                      ...prev, 
                      clients: selectedOptions?.map(o => ({ id: o.value })) || [] 
                    }))}
                    classNamePrefix="rs"
                  />
                </div>
              </section>
            </div>

            {/* RIGHT PANE — Workflow */}
            <div className="space-y-6">
              <section className="rounded-2xl border border-violet-100/70 bg-white/70 backdrop-blur p-4 shadow-sm">
                <div className="flex items-end justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-violet-900">Workflow</h3>
                    <p className="text-xs text-slate-500">Create tasks and subtasks. Drag items to reorder.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input 
                      className="h-9" 
                      placeholder="Add a task (e.g., Verify temp recorder)" 
                      value={taskInput} 
                      onChange={(e) => setTaskInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addWorkflowTask()}
                    />
                    <Button className="h-9" onClick={addWorkflowTask}>Add</Button>
                  </div>
                </div>

                {errors.workflows && (
                  <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                    {errors.workflows}
                  </div>
                )}

                <div className="space-y-3">
                  {(form.workflows || []).map((t, index) => (
                    <div key={t.id}>
                      {/* Drop indicator before task */}
                      <DropIndicator 
                        show={dropIndicator?.type === 'task' && dropIndicator.targetId === t.id && dropIndicator.position === 'before'}
                        position="before"
                      />
                      
                      <div
                        className={`rounded-lg border border-violet-100 bg-gradient-to-br from-white to-indigo-50/40 px-3 py-2 shadow-sm transition-all ${
                          draggedTask === t.id ? 'opacity-50 scale-95' : ''
                        } ${
                          dropIndicator?.targetId === t.id && dropIndicator.type === 'task' ? 'ring-2 ring-violet-300/50' : ''
                        }`}
                        draggable
                        onDragStart={onTaskDragStart(t.id)}
                        onDragOver={onTaskDragOver(t.id)}
                        onDragEnd={onTaskDragEnd}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium text-slate-800 cursor-move flex items-center gap-2">
                            <span className="text-violet-400 hover:text-violet-600 transition-colors">⋮⋮</span>
                            {t.title}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-rose-500 hover:text-rose-600"
                            onClick={() => removeWorkflowTask(t.id)}
                          >
                            Remove
                          </Button>
                        </div>

                        {/* Subtasks */}
                        <div className="mt-2 space-y-2">
                          {t.subtasks.map((s, subIndex) => (
                            <div key={s.id}>
                              {/* Drop indicator before subtask */}
                              <DropIndicator 
                                show={dropIndicator?.type === 'subtask' && dropIndicator.targetId === s.id && dropIndicator.position === 'before' && dropIndicator.taskId === t.id}
                                position="before"
                              />
                              
                              <div
                                className={`flex items-center justify-between rounded-md border border-indigo-100 bg-white/70 px-2 py-1 transition-all ${
                                  draggedSubtask?.subId === s.id ? 'opacity-50 scale-95' : ''
                                } ${
                                  dropIndicator?.targetId === s.id && dropIndicator.type === 'subtask' ? 'ring-1 ring-violet-300/50' : ''
                                }`}
                                draggable
                                onDragStart={onSubDragStart(t.id, s.id)}
                                onDragOver={onSubDragOver(t.id, s.id)}
                                onDragEnd={onSubDragEnd}
                              >
                                <div className="text-sm text-slate-700 cursor-move flex items-center gap-2">
                                  <span className="text-violet-300 hover:text-violet-500 transition-colors text-xs">⋮⋮</span>
                                  {s.title}
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-rose-500 hover:text-rose-600"
                                  onClick={() => removeSubtask(t.id, s.id)}
                                >
                                  Remove
                                </Button>
                              </div>
                              
                              {/* Drop indicator after last subtask */}
                              {subIndex === t.subtasks.length - 1 && (
                                <DropIndicator 
                                  show={dropIndicator?.type === 'subtask' && dropIndicator.targetId === s.id && dropIndicator.position === 'after' && dropIndicator.taskId === t.id}
                                  position="after"
                                />
                              )}
                            </div>
                          ))}

                          <div className="flex items-center gap-2">
                            <Input
                              className="h-9"
                              placeholder="Add a subtask"
                              value={subtaskInputs[t.id] || ''}
                              onChange={(e) => setSubtaskInputs(prev => ({ 
                                ...prev, 
                                [t.id]: e.target.value 
                              }))}
                              onKeyPress={(e) => e.key === 'Enter' && addSubtask(t.id)}
                            />
                            <Button className="h-9" onClick={() => addSubtask(t.id)}>Add</Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Drop indicator after task */}
                      {index === form.workflows.length - 1 && (
                        <DropIndicator 
                          show={dropIndicator?.type === 'task' && dropIndicator.targetId === t.id && dropIndicator.position === 'after'}
                          position="after"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <div className="flex justify-end gap-2">
                <Button 
                  onClick={handleSubmit} 
                  className="h-10 px-5"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : (editingId ? 'Update Checklist' : 'Save Checklist')}
                </Button>
                {editingId && (
                  <Button 
                    variant="outline" 
                    className="h-10 px-5" 
                    onClick={cancelEdit}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div className="p-6 space-y-4">
        <h2 className="text-2xl font-bold text-slate-800">All Checklists</h2>
        <DataTable
          data={checklists}
          title="Checklists"
          columns={[
            {
              header: 'Origin',
              accessorKey: 'originCountry',
              cell: (row: any) => `${row.originCountry ?? ''} - ${(row.originProvince || []).join(', ')}`,
            },
            {
              header: 'Destination',
              accessorKey: 'destinationCountry',
              cell: (row: any) => `${row.destinationCountry ?? ''} - ${(row.destinationProvince || []).join(', ')}`,
            },
            {
              header: 'Type',
              accessorKey: 'type',
              cell: (row: any) => (Array.isArray(row.type) ? row.type.join(', ') : ''),
            },
            {
              header: 'Equipments',
              accessorKey: 'equipments',
              cell: (row: any) => (Array.isArray(row.equipments) ? row.equipments.map((e: any) => e.type).join(', ') : ''),
            },
            {
              header: 'Clients',
              accessorKey: 'clients',
              cell: (row: any) => (Array.isArray(row.clients) ? row.clients.map((c: any) => c.contact).join(', ') : ''),
            },
            {
              header: 'Workflow',
              accessorKey: 'workflow',
              cell: (row: any) => {
                const flatTasks: string[] = Array.isArray(row.tasks) ? row.tasks : [];
                const structured: any[] = Array.isArray(row.workflows) ? row.workflows : [];
                const titles = structured.length ? structured.map((t) => t.title) : flatTasks;
                const subCount = structured.reduce((acc, t) => acc + (Array.isArray(t.subtasks) ? t.subtasks.length : 0), 0);
                return (
                  <div className="text-sm">
                    <div className="font-medium text-slate-800">{titles.length ? titles.join(', ') : '—'}</div>
                    {structured.length > 0 && (
                      <div className="text-xs text-slate-500">
                        {structured.length} tasks • {subCount} subtasks
                      </div>
                    )}
                  </div>
                );
              },
            },
            {
              header: 'Actions',
              accessorKey: 'actions',
              cell: (row: any) => (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(row)}>Update</Button>
                  <Button variant="destructive" size="sm" onClick={() => deleteChecklist(row.id)}>Delete</Button>
                </div>
              ),
            },
          ]}
        />
      </div>
    </>
  );
};

export default ChecklistTaskEditorPage;