module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    return res.json({ message: 'Use /api/auth/login or /api/auth/register' });
  }

  return res.status(405).json({ message: 'Method not allowed' });
};