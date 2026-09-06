'use client';

import { useState, useEffect, use } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function StaffPage({ params }) {
  const resolvedParams = use(params);
  const businessId = resolvedParams.businessId;

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('STAFF');

  const [staff, setStaff] = useState([]);
  const [ownerId, setOwnerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tempPassword, setTempPassword] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [staffToRemove, setStaffToRemove] = useState(null);

  const fetchStaff = async () => {
    try {
      const res = await api.get(`/businesses/${businessId}`);
      if (res.data.staff) {
        setStaff(res.data.staff);
      }
      if (res.data.ownerId) {
        setOwnerId(res.data.ownerId);
      }
    } catch (err) {
      toast.error('Failed to load staff list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [businessId]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email) return;

    if (staff.some(s => s.email.toLowerCase() === email.toLowerCase())) {
      return toast.error('This user is already part of the staff list.');
    }

    setIsSubmitting(true);
    const generatedPass = Math.random().toString(36).slice(-8);

    try {
      await api.post(`/businesses/${businessId}/staff`, {
        email,
        role,
        tempPassword: generatedPass
      });
      
      setTempPassword(generatedPass);
      toast.success(`Account created for ${email}`);
      fetchStaff();
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('You are not authorized to perform this action.');
      } else {
        toast.error(err.response?.data?.message || 'Failed to add staff member');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmRemove = async () => {
    if (!staffToRemove || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.post(`/businesses/${businessId}/staff/${staffToRemove.id}/remove`);
      toast.success("Staff member removed from business");
      setStaffToRemove(null);
      fetchStaff();
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('You are not authorized to perform this action.');
      } else {
        toast.error('Failed to remove staff member');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8">Loading staff...</div>;

  return (
    <div className="max-w-6xl space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage Staff</h2>
          <p className="text-gray-500 text-sm mt-1">Invite team members to help manage queues and counters.</p>
        </div>
        <button 
          onClick={() => setShowInviteModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg shadow-sm transition-colors"
        >
          + Invite Staff
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Member</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {staff.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-sm text-gray-500">
                  No staff assigned yet. Click "Invite Staff" to add team members.
                </td>
              </tr>
            ) : (
              staff.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold mr-4">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-500">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${member.role === 'BUSINESS_ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                      {member.role === 'BUSINESS_ADMIN' ? 'Admin' : 'Staff'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${member.status === 'Active' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {member.status || 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {member.id !== ownerId && (
                      <button onClick={() => setStaffToRemove(member)} className="text-red-600 hover:text-red-900">
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl relative">
            <button 
              onClick={() => {
                setShowInviteModal(false);
                setTempPassword(null);
                setEmail('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Add Team Member</h3>
            
            {tempPassword ? (
              <div className="mt-4">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h4 className="text-center text-lg font-bold text-gray-900 mb-2">Account Created!</h4>
                <p className="text-center text-sm text-gray-600 mb-6">
                  Please copy this temporary password and share it with <span className="font-semibold text-gray-900">{email}</span>. They can change it after logging in.
                </p>
                <div className="bg-slate-100 border border-slate-200 rounded-lg p-4 text-center mb-6">
                  <div className="text-xs text-slate-500 uppercase font-bold mb-1">Temporary Password</div>
                  <div className="text-2xl font-mono font-black text-slate-800 tracking-wider select-all">{tempPassword}</div>
                </div>
                <button 
                  onClick={() => {
                    setShowInviteModal(false);
                    setTempPassword(null);
                    setEmail('');
                  }}
                  className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <p className="text-gray-500 text-sm mb-6">Create an account for your staff to manage the queues.</p>
                
                <form onSubmit={handleInvite} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                    <input 
                      type="email" required
                      value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Assign Role</label>
                    <select 
                      value={role} onChange={e => setRole(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    >
                      <option value="STAFF">Staff (Manage queues & counters only)</option>
                      <option value="BUSINESS_ADMIN">Admin (Full dashboard access)</option>
                    </select>
                  </div>
                  <div className="pt-2">
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg shadow-sm transition-colors"
                    >
                      {isSubmitting ? 'Creating...' : 'Create Account'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {staffToRemove && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Remove Staff Member?</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to remove <span className="font-semibold text-gray-900">{staffToRemove.name}</span>? They will no longer have access to this business dashboard.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setStaffToRemove(null)}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={confirmRemove}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 text-white font-medium hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Removing...' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

