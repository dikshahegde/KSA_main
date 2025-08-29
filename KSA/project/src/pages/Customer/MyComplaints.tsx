import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "../../components/Layout/DashboardLayout";
import Card from "../../components/UI/Card";
import Select from "../../components/UI/Select";
import Badge from "../../components/UI/Badge";
import Button from "../../components/UI/Button";
import { useComplaints } from "../../hooks/useComplaints";

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

  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const { complaints, loading, loadComplaints, total } = useComplaints({ customerId });

  useEffect(() => {
    loadComplaints({
      status: statusFilter === "all" ? undefined : statusFilter,
      priority: priorityFilter === "all" ? undefined : priorityFilter,
    });
  }, [statusFilter, priorityFilter]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "open": return "warning";
      case "in-progress": return "info";
      case "resolved": return "success";
      case "closed": return "default";
      default: return "default";
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Filters</h3>
            <p className="text-sm text-gray-600">{total} complaints found</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} options={statusOptions} />
            <Select label="Priority" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} options={priorityOptions} />
          </div>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          {loading ? <p>Loading...</p> : complaints.map(c => (
            <div key={c.id} className="border rounded-lg p-4 mb-3">
              <h3 className="font-semibold">{c.title}</h3>
              <p>{c.description}</p>
              <div className="flex space-x-2 mt-2">
                <Badge variant={getStatusBadgeVariant(c.status)}>{c.status}</Badge>
                <Badge variant={getPriorityBadgeVariant(c.priority)}>{c.priority}</Badge>
              </div>
            </div>
          ))}
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default MyComplaints;
