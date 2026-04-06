const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbConnect, getModels, publicUser } = require('../_lib/clinic');

// Helper to handle body parsing for Vercel
function parseBody(req) {
  let payload;
  try {
    payload = req.body;
  } catch (error) {
    error.statusCode = 400;
    throw error;
  }
  if (payload == null) return {};
  if (typeof payload === 'string') {
    try {
      return JSON.parse(payload);
    } catch (error) {
      error.statusCode = 400;
      throw error;
    }
  }
  return payload;
}

module.exports = async function handler(req, res) {
  // Connect to MongoDB Atlas
  await dbConnect();

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { User } = await getModels();

  try {
    const { email, password } = parseBody(req);

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    
    // 1. Find the user in the database
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 2. Compare the encrypted password
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 3. Create the "Digital ID Card" (JWT Token)
    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // 4. Send back success
    return res.json({
      token,
      user: publicUser(user),
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};