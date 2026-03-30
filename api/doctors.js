import dbConnect from '../utils/dbConnect';
import Doctor from '../server/models/Doctor';
import { verify } from 'jsonwebtoken';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    // Get all doctors
    try {
      const doctors = await Doctor.find();
      res.status(200).json(doctors);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  } else if (req.method === 'POST') {
    // Add a new doctor (admin only)
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ message: 'No token' });
      const decoded = verify(token, process.env.JWT_SECRET);
      if (decoded.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

      const { name, specialization } = req.body;
      const doctor = new Doctor({ name, specialization });
      await doctor.save();
      res.status(201).json(doctor);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
