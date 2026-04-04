const { dbConnect, Appointment, requireRole } = require('../../_lib/clinic');

module.exports = async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const user = await requireRole(req, res, ['doctor', 'admin']);
  if (!user) {
    return;
  }

  try {
    const appointmentId = req.query.id;
    if (!appointmentId) {
      return res.status(400).json({ message: 'Appointment id is required' });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { status: 'completed' },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    return res.json({ message: 'Patient served', appointment });
  } catch (error) {
    console.error('Appointment complete error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
