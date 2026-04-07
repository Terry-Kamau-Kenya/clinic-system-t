const dbConnect = require('./dbConnect'); // Looks in the same folder
const jwt = require('jsonwebtoken');

let User, Doctor, Appointment;

/**
 * Ensures database is connected and models are loaded.
 * Uses local relative paths to avoid Vercel deployment errors.
 */
async function getModels() {
  await dbConnect();
  if (!User) {
    // This looks for schemas.js in the same folder as clinic.js
    const { User: U, Doctor: D, Appointment: A } = require('./schemas'); 
    User = U;
    Doctor = D;
    Appointment = A;
  }
  return { User, Doctor, Appointment };
}

function getBearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization || '';
  if (!header.startsWith('Bearer ')) {
    return null;
  }
  return header.slice(7);
}

function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

async function requireUser(req, res) {
  await dbConnect();

  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ message: 'No token, authorization denied' });
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { User } = await getModels();
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401).json({ message: 'User no longer exists in the database' });
      return null;
    }

    return user;
  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(401).json({ message: 'Token is not valid' });
    return null;
  }
}

async function requireRole(req, res, roles) {
  const user = await requireUser(req, res);
  if (!user) {
    return null;
  }

  if (!roles.includes(user.role)) {
    res.status(403).json({ message: 'Access denied' });
    return null;
  }

  return user;
}

async function resolveDoctorForUser(user) {
  if (!user) {
    return null;
  }

  const { Doctor } = await getModels();

  if (user.doctorId) {
    const doctorById = await Doctor.findById(user.doctorId);
    if (doctorById) {
      return doctorById;
    }
  }

  if (user.email) {
    const doctorByEmail = await Doctor.findOne({ email: user.email });
    if (doctorByEmail) {
      return doctorByEmail;
    }
  }

  if (user.name) {
    const doctorByName = await Doctor.findOne({ name: user.name });
    if (doctorByName) {
      return doctorByName;
    }
  }

  return null;
}

module.exports = {
  dbConnect,
  getModels,
  publicUser,
  requireUser,
  requireRole,
  resolveDoctorForUser,
};