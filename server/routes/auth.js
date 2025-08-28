const express = require('express');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabaseClient');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'dummysecret',
    { expiresIn: process.env.JWT_EXPIRE || '1h' }
  );
};

// ======================
// Register a new customer
// ======================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Sign up with Supabase Auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role: 'customer' } // store role and name in metadata
      }
    });

    if (signUpError) {
      return res.status(400).json({ message: signUpError.message });
    }

    // Insert user profile in 'profiles' table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert([{ id: authData.user.id, name, email, role: 'customer' }])
      .select()
      .single();

    if (profileError) {
      return res.status(500).json({ message: profileError.message });
    }

    const token = generateToken(profile.id, profile.role);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: profile.id, name: profile.name, email: profile.email, role: profile.role }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ======================
// Login user
// ======================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Sign in via Supabase Auth
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (loginError || !loginData.user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', loginData.user.id)
      .single();

    if (profileError) {
      return res.status(500).json({ message: profileError.message });
    }

    const token = generateToken(profile.id, profile.role);

    res.json({
      message: 'Login successful',
      token,
      user: { id: profile.id, name: profile.name, email: profile.email, role: profile.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ======================
// Get current logged-in user
// ======================
router.get('/me', auth, async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, name, email, role')
      .eq('id', req.user.id)
      .single();

    if (error || !profile) return res.status(404).json({ message: 'User not found' });

    res.json({ user: profile });
  } catch (error) {
    console.error('Fetch user error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
