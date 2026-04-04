const { dbConnect, User, Doctor, Appointment, requireUser } = require('../_lib/clinic');

module.exports = async function handler(req, res) {
  await dbConnect();

  if (req.method === 'POST') {
    const user = await requireUser(req, res);
    if (!user) {
      return;
    }

    try {
      const { doctorId, appointmentDate, appointmentTime, date, time } = req.body;
      const resolvedDate = appointmentDate || date;
      const resolvedTime = appointmentTime || time;

      if (!doctorId || !resolvedDate || !resolvedTime) {
        return res.status(400).json({ message: 'Doctor, date, and time are required' });
      }

      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }

      const queueNumber = (await Appointment.countDocuments({ doctorId, date: resolvedDate })) + 1;
      const appointment = await Appointment.create({
        patientId: user._id,
        doctorId,
        date: resolvedDate,
        time: resolvedTime,
        queueNumber,
        status: 'pending',
      });

      return res.status(201).json({
        message: 'Booked successfully',
        queueNumber,
        appointment,
      });
    } catch (error) {
      console.error('Appointment booking error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  if (req.method === 'GET') {
    const user = await requireUser(req, res);
    if (!user) {
      return;
    }

    try {
      const appointments = await Appointment.find({ patientId: user._id })
        .populate('doctorId', 'name specialization')
        .sort({ createdAt: -1 });

      return res.json(appointments);
    } catch (error) {
      console.error('Appointment list error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
};
