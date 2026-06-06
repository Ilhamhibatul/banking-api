const express = require('express');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const accountRoutes = require('./routes/accountRoutes');
const billingRoutes = require('./routes/billingRoutes');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/auth', authRoutes);
app.use('/', accountRoutes);
app.use('/', billingRoutes);

// Health check — endpoint untuk cek apakah server jalan
app.get('/health', (req, res) => {
  res.json({ success: true, pesan: 'Portal Billing API berjalan', versi: '1.0.0' });
});

// Jalankan server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🏦 Portal Billing API berjalan di http://localhost:${PORT}`);
});