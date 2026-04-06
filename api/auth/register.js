const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbConnect, getModels, publicUser } = require('../_lib/clinic');

module.exports = async function handler(req, res) {
  // 1. Ensure DB Connection
  await dbConnect();

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // 2. Vercel usually parses this automatically. 
    // If it's already an object, use it. If it's a string, parse it.
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const { User } = await getModels();
    
    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: role || 'patient',
    });

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.status(201).json({
      token,
      user: publicUser(user),
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};