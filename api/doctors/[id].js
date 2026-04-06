const { dbConnect, Doctor, requireRole } = require('../_lib/clinic');

module.exports = async function handler(req, res) {
  await dbConnect();

  // 1. Ensure this file is named [id].js in your api/doctors folder!
  const doctorId = req.query.id;

  if (!doctorId) {
    return res.status(400).json({ message: 'Doctor id is required' });
  }

  // --- PUBLIC ACTION: Anyone can view a doctor ---
  if (req.method === 'GET') {
    try {
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }
      return res.json(doctor);
    } catch (error) {
      console.error('Doctor fetch error:', error);
      return res.status(500).json({ message: 'Server error while fetching doctor' });
    }
  }

  // --- PROTECTED ACTIONS: Admin only ---
  const user = await requireRole(req, res, ['admin']);
  if (!user) return; // requireRole sends the 401/403 response

  if (req.method === 'PUT') {
    try {
      const { name, specialization, email, status } = req.body;
      const updates = {};
      if (name !== undefined) updates.name = String(name).trim();
      if (specialization !== undefined) updates.specialization = String(specialization).trim();
      if (email !== undefined) updates.email = email ? String(email).trim() : null;
      if (status !== undefined) updates.status = status;

      const doctor = await Doctor.findByIdAndUpdate(doctorId, updates, {
        new: true,
        runValidators: true,
      });

      if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
      return res.json({ message: 'Doctor updated successfully', doctor });
    } catch (error) {
      return res.status(500).json({ message: 'Server error while updating doctor' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const doctor = await Doctor.findByIdAndDelete(doctorId);
      if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
      return res.json({ message: 'Doctor deleted successfully' });
    } catch (error) {
      return res.status(500).json({ message: 'Server error while deleting doctor' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
};