const { dbConnect, Appointment, requireUser } = require('../_lib/clinic');

module.exports = async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const user = await requireUser(req, res);
  if (!user) {
    return;
  }

  try {
    const appointments = await Appointment.find({ patientId: user._id })
      .populate('doctorId', 'name specialization')
      .sort({ createdAt: -1 });

    if (appointments.length === 0) {
      return res.json({ current: 'No Queue', yourPosition: 'None' });
    }

    const latest = appointments[0];
    const doctorId = latest.doctorId && latest.doctorId._id ? latest.doctorId._id : latest.doctorId;

    const currentlyServing = await Appointment.findOne({
      doctorId,
      date: latest.date,
      status: 'pending',
    }).sort({ queueNumber: 1 });

    return res.json({
      current: currentlyServing ? currentlyServing.queueNumber : 'Done',
      yourPosition: latest.queueNumber,
    });
  } catch (error) {
    console.error('Queue status error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
