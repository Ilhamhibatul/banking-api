const pool = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, pesan: 'Authorization header diperlukan' });
    }

    const token = header.replace('Bearer ', '').trim();
    const result = await pool.query(
      `SELECT s.token, s.expires_at, u.id, u.nama, u.email, u.role
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, pesan: 'Token tidak valid' });
    }

    const session = result.rows[0];
    if (new Date(session.expires_at) < new Date()) {
      return res.status(401).json({ success: false, pesan: 'Token sudah kadaluarsa' });
    }

    req.user = {
      id: session.id,
      nama: session.nama,
      email: session.email,
      role: session.role
    };
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, pesan: 'Terjadi kesalahan otentikasi' });
  }
};

const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, pesan: 'Akses ditolak' });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
