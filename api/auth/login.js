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
    const { email, password } = parseBody(req);

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.json({
      token,
      user: publicUser(user),
    });
  } catch (error) {
    if (error && (error.statusCode === 400 || /invalid json/i.test(String(error.message)))) {
      return res.status(400).json({ message: 'Invalid request payload. Please try again.' });
    }

    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
