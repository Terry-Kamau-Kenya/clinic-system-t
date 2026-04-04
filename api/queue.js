module.exports = async function handler(req, res) {
  return res.status(404).json({ message: 'Use /api/queue/update/:id' });
};
