const { dbConnect, Appointment, resolveDoctorForUser, requireRole } = require('../../_lib/clinic');

module.exports = async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const user = await requireRole(req, res, ['doctor', 'admin']);
  if (!user) {
    return;
  }

  try {
    let doctorFilter = {};

    if (user.role === 'doctor') {
      const doctor = await resolveDoctorForUser(user);
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor profile not found for this account' });
      }

      doctorFilter = { doctorId: doctor._id };
    }

    const queue = await Appointment.find({
      ...doctorFilter,
      status: 'pending',
    })
      .populate('patientId', 'name email')
      .populate('doctorId', 'name specialization')
      .sort({ queueNumber: 1, createdAt: 1 });

    return res.json(queue);
  } catch (error) {
    console.error('Doctor queue error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
