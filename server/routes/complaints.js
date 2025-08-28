const express = require('express');
const supabase = require('../config/supabaseClient');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Create complaint
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
        createdBy: req.user.id
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Complaint created successfully', complaint: data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get complaints (role-based)
router.get('/', auth, async (req, res) => {
  try {
    let query = supabase.from('complaints').select('*');

    if (req.user.role === 'customer') {
      query = query.eq('createdBy', req.user.id);
    } else if (req.user.role === 'technician') {
      query = query.eq('assignedTo', req.user.id);
    }

    const { data, error } = await query.order('createdAt', { ascending: false });

    if (error) throw error;

    res.json({ complaints: data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Assign complaint (admin only)
router.put('/:id/assign', auth, authorize('admin'), async (req, res) => {
  try {
    const { technicianId } = req.body;

    const { data, error } = await supabase
      .from('complaints')
      .update({ assignedTo: technicianId, status: 'in-progress' })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Complaint assigned successfully', complaint: data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update status (tech + admin)
router.put('/:id/status', auth, authorize('technician', 'admin'), async (req, res) => {
  try {
    const { status } = req.body;

    const { data, error } = await supabase
      .from('complaints')
      .update({ status, resolvedAt: (status === 'resolved' || status === 'closed') ? new Date() : null })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Status updated successfully', complaint: data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
