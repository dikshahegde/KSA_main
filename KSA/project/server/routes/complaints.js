// server/routes/complaints.js
const express = require('express');
const supabase = require('../config/supabaseClient');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/complaints
 * Customer: get ONLY their complaints (with optional filters/pagination)
 */
router.get('/', auth, async (req, res) => {
  try {
    const customer_id = req.user.id;
    const { status, priority, page = 1, limit = 5 } = req.query;

    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;

    let query = supabase
      .from('complaints')
      .select(`
        id, title, description, category, priority, status,
        created_at, resolved_at, assigned_to,
        technician:users!complaints_assigned_to_fkey ( id, name )
      `, { count: 'exact' })
      .eq('customer_id', userId)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);

    const { data, error, count } = await query.range(from, to);
    if (error) throw error;

    return res.json({
      complaints: data || [],
      total: count || 0,
      currentPage: Number(page),
      totalPages: Math.max(1, Math.ceil((count || 0) / Number(limit))),
    });
  } catch (err) {
    console.error('GET /complaints error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/complaints/all
 * Admin: get ALL complaints (with customer & technician info)
 */
router.get('/all', auth, authorize('admin'), async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 10 } = req.query;

    const from = (Number(page) - 1) * Number(limit);
    const to = from + Number(limit) - 1;

    // NOTE: the !..._fkey names come from FK names; if yours differ,
    // adjust the suffix accordingly in Supabase
    let query = supabase
      .from('complaints')
      .select(`
        id, title, description, category, priority, status, created_at, resolved_at,
        customer:profiles!complaints_customer_id_fkey ( id, name, email ),
        technician:users!complaints_assigned_to_fkey ( id, name )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);

    const { data, error, count } = await query.range(from, to);
    if (error) throw error;

    res.json({
      complaints: data || [],
      total: count || 0,
      currentPage: Number(page),
      totalPages: Math.max(1, Math.ceil((count || 0) / Number(limit))),
    });
  } catch (err) {
    console.error('GET /complaints/all error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/complaints
 * Customer: create a complaint
 */
router.post('/', auth, authorize('customer'), async (req, res) => {
  try {
    const { title, description, category, priority } = req.body;

    const { data, error } = await supabase
      .from('complaints')
      .insert([{
        title,
        description,
        category: category || 'general',
        priority: priority || 'medium',
        status: 'open',
        customer_id: req.user.id,
      }])
      .select(`
        id, title, description, category, priority, status, created_at, customer_id
      `)
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Complaint created successfully', complaint: data });
  } catch (error) {
    console.error('POST /complaints error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * PUT /api/complaints/:id/assign
 * Admin: assign a technician & move to in-progress
 */
router.put('/:id/assign', auth, authorize('admin'), async (req, res) => {
  try {
    const { technicianId } = req.body;

    const { data, error } = await supabase
      .from('complaints')
      .update({ assigned_to: technicianId, status: 'in-progress' })
      .eq('id', req.params.id)
      .select(`
        id, title, description, category, priority, status, created_at, resolved_at,
        customer:profiles!complaints_customer_id_fkey ( id, name, email ),
        technician:users!complaints_assigned_to_fkey ( id, name )
      `)
      .single();

    if (error) throw error;

    res.json({ message: 'Complaint assigned successfully', complaint: data });
  } catch (error) {
    console.error('PUT /complaints/:id/assign error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * PUT /api/complaints/:id/status
 * Admin or Technician: update status; set resolved_at when resolved/closed
 */
router.put('/:id/status', auth, authorize('technician', 'admin'), async (req, res) => {
  try {
    const { status } = req.body;

    const payload = {
      status,
      resolved_at: (status === 'resolved' || status === 'closed') ? new Date() : null,
    };

    const { data, error } = await supabase
      .from('complaints')
      .update(payload)
      .eq('id', req.params.id)
      .select(`
        id, title, description, category, priority, status, created_at, resolved_at,
        customer:profiles!complaints_customer_id_fkey ( id, name, email ),
        technician:users!complaints_assigned_to_fkey ( id, name )
      `)
      .single();

    if (error) throw error;

    res.json({ message: 'Status updated successfully', complaint: data });
  } catch (error) {
    console.error('PUT /complaints/:id/status error:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/complaints/analytics
 * Admin: dashboard analytics
 */
router.get('/analytics', auth, authorize('admin'), async (_req, res) => {
  try {
    const [{ count: totalComplaints }, { count: openComplaints }, { count: inProgressComplaints }, { count: resolvedComplaints }] =
      await Promise.all([
        supabase.from('complaints').select('*', { count: 'exact', head: true }),
        supabase.from('complaints').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('complaints').select('*', { count: 'exact', head: true }).eq('status', 'in-progress'),
        supabase.from('complaints').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
      ]);

    // group by category
    const { data: byCat, error: catErr } = await supabase
      .from('complaints')
      .select('category, count:count(*)')
      .group('category');
    if (catErr) throw catErr;

    // group by priority
    const { data: byPri, error: priErr } = await supabase
      .from('complaints')
      .select('priority, count:count(*)')
      .group('priority');
    if (priErr) throw priErr;

    // monthly trend via SQL function (see Step 3)
    const { data: monthly, error: monErr } = await supabase.rpc('get_complaints_monthly');
    if (monErr) throw monErr;

    res.json({
      overview: {
        totalComplaints: totalComplaints || 0,
        openComplaints: openComplaints || 0,
        inProgressComplaints: inProgressComplaints || 0,
        resolvedComplaints: resolvedComplaints || 0,
      },
      complaintsByCategory: (byCat || []).map(r => ({ _id: r.category, count: r.count })),
      complaintsByPriority: (byPri || []).map(r => ({ _id: r.priority, count: r.count })),
      monthlyTrend: (monthly || []).map(r => ({ _id: { year: r.year, month: r.month }, count: r.count })),
    });
  } catch (err) {
    console.error('GET /complaints/analytics error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
