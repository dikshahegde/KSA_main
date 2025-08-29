const API_BASE = 'http://localhost:5000/api';

const authHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` || '', 'Content-Type': 'application/json' };
};

export const complaintsAPI = {
  // Customer: submit complaint
  create: async (data: { title: string; description: string; category: string; priority: string }) => {
    const res = await fetch(`${API_BASE}/complaints`, {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to submit complaint');
    return res.json();
  },

  // Admin: list all complaints
  getAll: async (params: { status?: string; priority?: string; page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.status && params.status !== 'all') qs.append('status', params.status);
    if (params.priority && params.priority !== 'all') qs.append('priority', params.priority);
    qs.append('page', String(params.page || 1));
    qs.append('limit', String(params.limit || 10));

    const res = await fetch(`${API_BASE}/complaints/all?${qs.toString()}`, {
      headers: authHeader(),
    });
    if (!res.ok) throw new Error('Failed to load complaints');
    return res.json();
  },

  // Admin: assign technician
  assign: async (complaintId: string, technicianId: string) => {
    const res = await fetch(`${API_BASE}/complaints/${complaintId}/assign`, {
      method: 'PUT',
      headers: authHeader(),
      body: JSON.stringify({ technicianId }),
    });
    if (!res.ok) throw new Error('Failed to assign complaint');
    return res.json();
  },

  // Admin: update status + details
  updateComplaintStatus: async (complaintId: string, status: string, details?: string) => {
    const res = await fetch(`${API_BASE}/complaints/${complaintId}`, {
      method: 'PUT',
      headers: authHeader(),
      body: JSON.stringify({ status, details }),
    });
    if (!res.ok) throw new Error('Failed to update complaint');
    return res.json();
  },
};

export const usersAPI = {
  getTechnicians: async () => {
    const res = await fetch(`${API_BASE}/users/technicians`, { headers: authHeader() });
    if (!res.ok) throw new Error('Failed to load technicians');
    return res.json();
  },
};
