const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbConnect, User, publicUser } = require('../_lib/clinic');

function parseBody(req) {
  let payload;

  try {
    payload = req.body;
  } catch (error) {
    error.statusCode = 400;
    throw error;
  }

  if (payload == null) {
    return {};
  }

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
  await dbConnect();

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, email, password, role } = parseBody(req);

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

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
    if (error && (error.statusCode === 400 || /invalid json/i.test(String(error.message)))) {
      return res.status(400).json({ message: 'Invalid request payload. Please try again.' });
    }

    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
