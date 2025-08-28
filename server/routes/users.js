const express = require('express');
const bcrypt = require('bcryptjs');
const supabase = require('../config/supabaseClient');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Create new user (admin only)
router.post('/create', auth, authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!['technician', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('users')
      .insert([{ name, email, password: hashedPassword, role, isActive: true }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'User created successfully', user: data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all technicians
router.get('/technicians', auth, authorize('admin'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, createdAt')
      .eq('role', 'technician')
      .eq('isActive', true);

    if (error) throw error;

    res.json({ technicians: data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Toggle user active status
router.put('/:id/toggle-status', auth, authorize('admin'), async (req, res) => {
  try {
    // Fetch current status
    const { data: existingUser } = await supabase
      .from('users')
      .select('isActive')
      .eq('id', req.params.id)
      .single();

    const { data, error } = await supabase
      .from('users')
      .update({ isActive: !existingUser.isActive })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: `User ${data.isActive ? 'activated' : 'deactivated'} successfully`, user: data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
