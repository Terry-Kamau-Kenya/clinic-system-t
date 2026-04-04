const { dbConnect, Appointment, requireRole } = require('../_lib/clinic');

module.exports = async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const user = await requireRole(req, res, ['admin']);
  if (!user) {
    return;
  }

  try {
    const appointments = await Appointment.find({})
      .populate('patientId', 'name email')
      .populate('doctorId', 'name specialization')
      .sort({ createdAt: -1 });

    const payload = appointments.map((appointment) => ({
      _id: appointment._id,
      patientName: appointment.patientId ? appointment.patientId.name : 'Unknown',
      patientEmail: appointment.patientId ? appointment.patientId.email : '',
      doctorName: appointment.doctorId ? appointment.doctorId.name : 'Unknown',
      doctorSpecialization: appointment.doctorId ? appointment.doctorId.specialization : '',
      date: appointment.date,
      time: appointment.time,
      status: appointment.status,
      queueNumber: appointment.queueNumber,
    }));

    return res.json(payload);
  } catch (error) {
    console.error('Admin appointments error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
