import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import Card from "../../components/UI/Card";
import Select from "../../components/UI/Select";
import Badge from "../../components/UI/Badge";
import { supabase} from "../../config/supabaseClient";

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "open", label: "Open" },
  { value: "in-progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const priorityOptions = [
  { value: "all", label: "All Priority" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const MyComplaints: React.FC = () => {
  const user = localStorage.getItem("user");
  const customerId = user ? JSON.parse(user).id : undefined;

  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const loadComplaints = async () => {
    setLoading(true);
    let query = supabase.from("complaints").select("*").eq("customer_id", customerId);

    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    if (priorityFilter !== "all") query = query.eq("priority", priorityFilter);

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) console.error(error);
    else setComplaints(data || []);
    setLoading(false);
  };

  // Load complaints whenever filters change
  useEffect(() => {
    loadComplaints();
  }, [statusFilter, priorityFilter]);

  // Subscri// Subscribe to Supabase realtime updates
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


  const getStatusBadgeVariant = (status: string): 'warning' | 'info' | 'success' | 'default' => {
    switch (status) {
      case "open": return "warning";
      case "in-progress": return "info";
      case "resolved": return "success";
      case "closed": return "default";
      default: return "default";
    }
  };

  const getPriorityBadgeVariant = (priority: string): 'default' | 'info' | 'warning' | 'danger' => {
    switch (priority) {
      case "low": return "default";
      case "medium": return "info";
      case "high": return "warning";
      case "urgent": return "danger";
      default: return "default";
    }
  };

  return (
    <DashboardLayout title="My Complaints">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} options={statusOptions} />
            <Select label="Priority" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} options={priorityOptions} />
          </div>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          {loading ? <p>Loading complaints...</p> : complaints.map(c => (
            <div key={c.id} className="border rounded-lg p-4 mb-3">
              <h3 className="font-semibold">{c.title}</h3>
              <p>{c.description}</p>
              <div className="flex space-x-2 mt-2">
                <Badge variant={getStatusBadgeVariant(c.status)}>{c.status}</Badge>
                <Badge variant={getPriorityBadgeVariant(c.priority)}>{c.priority}</Badge>
              </div>
              {c.remarks && <p className="mt-2 text-sm text-gray-500">Admin Remarks: {c.remarks}</p>}
            </div>
          ))}
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default MyComplaints;
