const express = require('express');
require('dotenv').config();

const nasabahRoutes = require('./routes/nasabahRoutes');
const transaksiRoutes = require('./routes/transaksiRoutes');

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/nasabah', nasabahRoutes);
app.use('/transaksi', transaksiRoutes);

// Health check — endpoint untuk cek apakah server jalan
app.get('/', (req, res) => {
  res.json({
    success: true,
    pesan: 'Banking API berjalan',
    versi: '1.0.0'
  });
});

// Jalankan server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🏦 Banking API berjalan di http://localhost:${PORT}`);
});