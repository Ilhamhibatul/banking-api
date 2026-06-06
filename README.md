## Tech
- Node.js + Express
- PostgreSQL
- Frontend HTML/CSS/JavaScript statis

## Fitur
- Autentikasi login untuk admin dan mahasiswa
- Billing inquiry, pembayaran, refund, dan manajemen billing
- Cek saldo rekening settlement
- Mutasi transaksi rekening
- Halaman frontend untuk login, daftar tagihan, manajemen tagihan, pembayaran, dan cek saldo

## Cara Menjalankan

### 1. Install dependencies
npm install

### 2. Setup environment
Buat file `.env.example`:

DB_HOST=localhost
DB_PORT=5432
DB_NAME=banking_db
DB_USER=postgres
DB_PASSWORD=your_password
PORT=3000

### 3. Setup database
Jalankan script SQL 

### 4. Jalankan aplikasi
npm start

### 5. Buka frontend
Akses halaman frontend di browser:
- http://localhost:3000/
- http://localhost:3000/login.html

## Endpoint Utama

| Method | Endpoint | Deskripsi |

| POST | /auth | Login user |
| GET | /check-balance?nomor_rekening=... | Cek saldo akun |
| POST | /transaction-history | Lihat mutasi rekening |
| GET | /bill-inquiry/:idbilling | Inquiry billing |
| POST | /bill-pay | Bayar billing |
| POST | /refund | Refund billing (admin) |
| GET | /list-billing | Daftar billing |
| GET | /detail-billing/:idbilling | Detail billing |
| POST | /create-billing | Buat billing baru (admin) |
| PUT | /update-billing | Update billing pending (admin) |
| DELETE | /delete-billing | Hapus billing pending (admin) |
| GET | /products | Daftar produk |
| POST | /products | Buat produk baru (admin) |

## Akun 

- Admin
  - Email: admin@fakultas.ac.id
  - Password: admin123
- Mahasiswa
  - Email: mahasiswa1@kampus.ac.id
  - Password: mahasiswa123

