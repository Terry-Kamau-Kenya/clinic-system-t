import dbConnect from '../utils/dbConnect';
import Appointment from '../server/models/Appointment';
import Doctor from '../server/models/Doctor';
import { verify } from 'jsonwebtoken';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'POST') {
    // Book appointment (patient)
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ message: 'No token' });
      const decoded = verify(token, process.env.JWT_SECRET);
      const { doctorId, date, time } = req.body;
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
      const appointment = new Appointment({ patient: decoded.id, doctor: doctorId, date, time });
      await appointment.save();
      res.status(201).json(appointment);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  } else if (req.method === 'GET') {
    // Get all appointments for logged-in patient
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ message: 'No token' });
      const decoded = verify(token, process.env.JWT_SECRET);
      const appointments = await Appointment.find({ patient: decoded.id }).populate('doctor');
      res.status(200).json(appointments);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
