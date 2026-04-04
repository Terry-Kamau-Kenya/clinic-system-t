const { dbConnect, Appointment, requireRole } = require('../../../_lib/clinic');

module.exports = async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const user = await requireRole(req, res, ['admin']);
  if (!user) {
    return;
  }

  try {
    const appointmentId = req.query.id;
    const { status } = req.body;

    if (!appointmentId) {
      return res.status(400).json({ message: 'Appointment id is required' });
    }

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { status },
      { new: true, runValidators: true }
    );

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    return res.json({ message: 'Queue updated successfully', appointment });
  } catch (error) {
    console.error('Queue update error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
