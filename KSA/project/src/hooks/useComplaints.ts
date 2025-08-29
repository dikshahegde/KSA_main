// src/hooks/useComplaints.ts
import { useState, useEffect } from "react";

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  resolved_at?: string | null;
  details?: string | null;
  technician?: { id: string; name: string } | null;
  customer?: { id: string; name: string; email: string } | null;
}

interface UseComplaintsProps {
  autoLoad?: boolean;
  pageSize?: number;
  customerId?: string; // optional: for customer mode
}

export const useComplaints = ({
  autoLoad = true,
  pageSize = 5,
  customerId,
}: UseComplaintsProps = {}) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const loadComplaints = async ({
    status,
    priority,
    page = 1,
    limit = pageSize,
  }: {
    status?: string;
    priority?: string;
    page?: number;
    limit?: number;
  } = {}) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      if (!token) throw new Error("User not authenticated");

      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      if (status && status !== "all") params.append("status", status);
      if (priority && priority !== "all") params.append("priority", priority);
      if (customerId) params.append("customerId", customerId);

      const res = await fetch(`http://localhost:5000/api/complaints?${params.toString()}`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch complaints");
      const data = await res.json();
      setComplaints(data.complaints || []);
      setTotal(data.total || 0);
      setCurrentPage(data.currentPage || 1);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Load complaints error:", err);
      setComplaints([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const updateComplaintStatus = async (id: string, status: string, details?: string) => {
    await fetch(`http://localhost:5000/api/complaints/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
      body: JSON.stringify({ status, details }),
    });
    await loadComplaints({ page: currentPage });
  };

  useEffect(() => {
    if (autoLoad) loadComplaints();
  }, []);

  return { complaints, loading, loadComplaints, updateComplaintStatus, total, currentPage, totalPages };
};
