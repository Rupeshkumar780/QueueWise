'use client';

import { useEffect, useState, use } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function CountersPage({ params }) {
  const resolvedParams = use(params);
  const businessId = resolvedParams.businessId;

  const [counters, setCounters] = useState([]);
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Counter Form
  const [newCounterName, setNewCounterName] = useState('');
  const [newEstDuration, setNewEstDuration] = useState(15);
  const [newTokenPrefix, setNewTokenPrefix] = useState('');
  const [newMaxCapacity, setNewMaxCapacity] = useState('');
  const [formFields, setFormFields] = useState([]);

  const loadData = async () => {
    try {
      const [countersRes, queuesRes] = await Promise.all([
        api.get(`/counters/business/${businessId}`),
        api.get(`/queues/business/${businessId}`)
      ]);
      setCounters(countersRes.data || []);
      setQueues(queuesRes.data || []);
    } catch (err) {
      console.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [businessId]);

  const handleAddField = () => {
    setFormFields([...formFields, { id: Date.now(), label: '', type: 'text', required: false }]);
  };

  const handleRemoveField = (id) => {
    setFormFields(formFields.filter(f => f.id !== id));
  };

  const handleFieldChange = (id, key, value) => {
    setFormFields(formFields.map(f => f.id === id ? { ...f, [key]: value } : f));
  };

  const [selectedServiceId, setSelectedServiceId] = useState('NEW');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingCounterId, setUpdatingCounterId] = useState(null);

  const handleCreateCounter = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      let targetServiceId = selectedServiceId;

      if (selectedServiceId === 'NEW') {
        // 1. Create the Service
        const serviceRes = await api.post(`/services/${businessId}`, {
          name: newCounterName,
          description: '',
          estimatedDuration: parseInt(newEstDuration),
          formTemplate: formFields.map(f => ({ label: f.label, type: f.type, required: f.required }))
        });
        const newService = serviceRes.data;
        targetServiceId = newService.id;
        
        // 2. Create the Queue for this service
        const queuePayload = {
          businessId,
          serviceId: newService.id,
          name: newCounterName,
          tokenPrefix: newTokenPrefix || undefined
        };
        if (newMaxCapacity) queuePayload.maxCapacity = parseInt(newMaxCapacity);
        
        await api.post(`/queues`, queuePayload);
      }

      // 3. Create the physical Counter
      await api.post(`/counters/${businessId}`, {
        name: newCounterName,
        supportedServices: [targetServiceId] 
      });

      setNewCounterName('');
      setNewEstDuration(15);
      setNewTokenPrefix('');
      setNewMaxCapacity('');
      setFormFields([]);
      setSelectedServiceId('NEW');
      toast.success(selectedServiceId === 'NEW' ? 'Counter & Queue created!' : 'Counter created and linked!');
      loadData();
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('You are not authorized to perform this action.');
      } else {
        toast.error('Error creating counter');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleCounterStatus = async (counter, newStatus) => {
    if (updatingCounterId) return;

    const previousStatus = counter.status;
    setUpdatingCounterId(counter.id);
    setCounters(currentCounters => currentCounters.map(currentCounter => (
      currentCounter.id === counter.id
        ? { ...currentCounter, status: newStatus }
        : currentCounter
    )));

    try {
      await api.post(`/counters/${counter.id}/status`, { status: newStatus });
      toast.success(`Counter set to ${newStatus}`);
      loadData();
    } catch (err) {
      setCounters(currentCounters => currentCounters.map(currentCounter => (
        currentCounter.id === counter.id
          ? { ...currentCounter, status: previousStatus }
          : currentCounter
      )));
      if (err.response?.status === 403) {
        toast.error('You are not authorized to perform this action.');
      } else {
        toast.error('Error changing counter status');
      }
    } finally {
      setUpdatingCounterId(null);
    }
  };

  const [counterToDelete, setCounterToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteCounter = async () => {
    if (!counterToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/counters/${counterToDelete.id}`);
      toast.success('Counter deleted successfully');
      setCounterToDelete(null);
      loadData();
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('You are not authorized to perform this action.');
      } else {
        toast.error(err.response?.data?.message || 'Error deleting counter');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return <div className="text-gray-500">Loading counters...</div>;

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Manage Counters & Lines</h2>
        <p className="text-gray-500 text-sm mt-1">Add counters. Each counter automatically gets its own dedicated queue line.</p>
      </div>

      {/* Add New Counter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">Add New Counter</h3>
        <form onSubmit={handleCreateCounter} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Service Queue to Support</label>
              <select
                value={selectedServiceId}
                onChange={e => setSelectedServiceId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="NEW" className="font-bold text-blue-600">+ Create Brand New Service & Queue</option>
                {queues.map(q => (
                  <option key={q.id} value={q.serviceId}>Link to existing: {q.service?.name || q.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Counter Name</label>
              <input 
                type="text" required
                value={newCounterName} onChange={e => setNewCounterName(e.target.value)}
                placeholder="e.g. Desk 1, Dr. Smith"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {selectedServiceId === 'NEW' && (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 space-y-6 mt-4">
              <h4 className="text-sm font-bold text-gray-800 border-b border-gray-200 pb-2">New Queue Configuration</h4>
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="w-full md:w-1/3">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Est. Duration (m)</label>
                  <input 
                    type="number" required min="1"
                    value={newEstDuration} onChange={e => setNewEstDuration(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="w-full md:w-1/3">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Token Prefix</label>
                  <input 
                    type="text" 
                    value={newTokenPrefix} onChange={e => setNewTokenPrefix(e.target.value)}
                    placeholder="e.g. C1-"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="w-full md:w-1/3">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Max Capacity</label>
                  <input 
                    type="number" 
                    value={newMaxCapacity} onChange={e => setNewMaxCapacity(e.target.value)}
                    placeholder="Optional"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-bold text-gray-800">Customer Form (Optional)</h4>
                  <button 
                    type="button" 
                    onClick={handleAddField}
                    className="text-xs bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold px-3 py-1.5 rounded"
                  >
                    + Add Field
                  </button>
                </div>
                
                {formFields.length === 0 ? (
                  <div className="text-sm text-gray-500 italic">No extra fields required. Customers will only provide basic location info.</div>
                ) : (
                  <div className="space-y-3">
                    {formFields.map((field, index) => (
                      <div key={field.id} className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-white p-3 rounded-lg border border-gray-200">
                        <span className="text-xs font-bold text-gray-400 w-6">{index + 1}.</span>
                        <input 
                          type="text" required placeholder="Field Label (e.g. Age, Reason)"
                          value={field.label} onChange={e => handleFieldChange(field.id, 'label', e.target.value)}
                          className="flex-1 text-sm border border-gray-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <select 
                          value={field.type} onChange={e => handleFieldChange(field.id, 'type', e.target.value)}
                          className="text-sm border border-gray-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                          <option value="text">Short Text</option>
                          <option value="number">Number</option>
                          <option value="email">Email</option>
                          <option value="tel">Phone</option>
                        </select>
                        <label className="flex items-center gap-1.5 text-sm text-gray-600">
                          <input 
                            type="checkbox" 
                            checked={field.required} onChange={e => handleFieldChange(field.id, 'required', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          Required
                        </label>
                        <button 
                          type="button" onClick={() => handleRemoveField(field.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add Counter'}
            </button>
          </div>
        </form>
      </div>

      {/* Active Counters */}
      <div className="space-y-4">
        {counters.length === 0 ? (
          <div className="bg-white p-8 text-center text-gray-500 rounded-xl border border-gray-200">
            No counters configured. Add one above.
          </div>
        ) : (
          counters.map(counter => {
            const linkedQueue = queues.find(q => counter.supportedServices?.includes(q.serviceId)) || queues.find(q => q.name === counter.name);

            return (
              <div key={counter.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4 mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{counter.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">Physical Desk / Service Window</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-2">Counter Status</span>
                      <select 
                        value={counter.status}
                        disabled={updatingCounterId === counter.id}
                        onChange={(e) => handleToggleCounterStatus(counter, e.target.value)}
                        aria-busy={updatingCounterId === counter.id}
                        className={`text-sm font-bold border-0 bg-transparent cursor-pointer focus:ring-0 disabled:cursor-wait disabled:opacity-60 ${counter.status === 'OFFLINE' ? 'text-gray-400' : 'text-green-600'}`}
                      >
                        <option value="AVAILABLE">Available</option>
                        <option value="BUSY">Busy</option>
                        <option value="OFFLINE">Offline</option>
                      </select>
                      {updatingCounterId === counter.id && (
                        <span className="text-xs font-medium text-blue-600" role="status">Updating...</span>
                      )}
                    </div>
                    <button 
                      onClick={() => setCounterToDelete(counter)}
                      className="text-sm font-semibold text-red-600 hover:text-red-800 ml-4 border-l pl-4 border-gray-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {linkedQueue && (
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex gap-6">
                      <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Queue Line Status</div>
                        <span className={`font-bold ${linkedQueue.status === 'OPEN' ? 'text-green-600' : linkedQueue.status === 'PAUSED' ? 'text-yellow-600' : 'text-red-600'}`}>{linkedQueue.status}</span>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Prefix</div>
                        <span className="font-mono text-sm font-bold bg-white px-2 py-0.5 rounded border border-gray-200">{linkedQueue.tokenPrefix || 'NONE'}</span>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Est. Time</div>
                        <span className="font-semibold">{linkedQueue.service?.estimatedDuration || 15}m</span>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Capacity limit</div>
                        <span className="font-semibold">{linkedQueue.maxCapacity || 'Unlimited'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {counterToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Counter?</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete <span className="font-semibold text-gray-900">{counterToDelete.name}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setCounterToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteCounter}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white font-medium hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
