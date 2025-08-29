import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Clock, CheckCircle, AlertTriangle
} from 'lucide-react';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import Card from '../../components/UI/Card';
import Badge from '../../components/UI/Badge';
import Button from '../../components/UI/Button';
import Select from '../../components/UI/Select';
import { supabase } from '../../config/supabaseClient';
import toast from 'react-hot-toast';

const statusOptions = [
  { value: 'open', label: 'Open' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' }
];

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
];

const AdminDashboard: React.FC = () => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [details, setDetails] = useState<Record<string, string>>({});

  const loadComplaints = async () => {
    setLoading(true);
    let query = supabase.from('complaints').select('*, customer:profiles(*)');

    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    if (priorityFilter !== 'all') query = query.eq('priority', priorityFilter);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) console.error(error);
    else setComplaints(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadComplaints();
  }, [statusFilter, priorityFilter]);

  // Realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('public:complaints')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, () => {
        loadComplaints();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleUpdate = async (complaintId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('complaints')
        .update({
          status: newStatus,
          remarks: details[complaintId] || ''
        })
        .eq('id', complaintId);

      if (error) throw error;
      toast.success('Complaint updated');
      loadComplaints();
    } catch {
      toast.error('Update failed');
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'open': return 'warning';
      case 'in-progress': return 'info';
      case 'resolved': return 'success';
      case 'closed': return 'default';
      default: return 'default';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'low': return 'default';
      case 'medium': return 'info';
      case 'high': return 'warning';
      case 'urgent': return 'danger';
      default: return 'default';
    }
  };

  return (
    <DashboardLayout title="Admin Dashboard">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Select label="Status" value={statusFilter} onChange={(e: any) => setStatusFilter(e.target.value)} options={[{ value: 'all', label: 'All' }, ...statusOptions]} />
        <Select label="Priority" value={priorityFilter} onChange={(e: any) => setPriorityFilter(e.target.value)} options={[{ value: 'all', label: 'All' }, ...priorityOptions]} />
      </div>

      {/* Complaints List */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : complaints.length > 0 ? (
            <div className="space-y-4">
              {complaints.map((c) => (
                <div key={c.id} className="border rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-800">{c.title}</h3>
                      <p className="text-gray-600 text-sm">{c.description}</p>
                      <div className="flex space-x-2 text-xs text-gray-500 mt-1">
                        <span>Customer: {c.customer?.name}</span>
                        <span>Category: {c.category}</span>
                        <span>{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-1 ml-4">
                      <Badge variant={getStatusBadgeVariant(c.status)}>{c.status}</Badge>
                      <Badge variant={getPriorityBadgeVariant(c.priority)}>{c.priority}</Badge>
                    </div>
                  </div>

                  {/* Update Section */}
                  <div className="space-y-2 mt-3">
                    <Select
                      label="Change Status"
                      value={c.status}
                      onChange={(e) => handleUpdate(c.id, e.target.value)}
                      options={statusOptions}
                    />
                    <textarea
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-amber-400"
                      placeholder="Write details/remarks..."
                      value={details[c.id] || c.remarks || ''}
                      onChange={(e) => setDetails({ ...details, [c.id]: e.target.value })}
                      rows={3}
                    />
                    <Button onClick={() => handleUpdate(c.id, c.status)}>Save</Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No complaints found</p>
            </div>
          )}
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
