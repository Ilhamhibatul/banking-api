const { Pool } = require('pg');
require('dotenv').config();

// Pool = kumpulan koneksi database yang dikelola otomatis
// Lebih efisien dari buka-tutup koneksi setiap request
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Test koneksi saat aplikasi pertama kali jalan
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Gagal koneksi ke database:', err.message);
  } else {
    console.log('✅ Berhasil koneksi ke PostgreSQL');
    release();
  }
});

module.exports = pool;