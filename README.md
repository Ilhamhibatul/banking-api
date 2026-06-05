# 🏦 Banking API

REST API sistem perbankan sederhana menggunakan Node.js dan PostgreSQL.

## Teknologi
- Node.js + Express
- PostgreSQL
- Docker ready

## Fitur
- Pendaftaran nasabah baru
- Lihat data nasabah & saldo
- Setor tunai
- Tarik tunai
- Transfer antar rekening
- Riwayat transaksi

## Cara Menjalankan

### 1. Clone repository
```bash
git clone https://github.com/USERNAME/banking-api.git
cd banking-api
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup environment
Buat file `.env` berdasarkan contoh berikut:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=banking_db
DB_USER=postgres
DB_PASSWORD=your_password
PORT=3000


### 4. Setup database
Jalankan script SQL di folder `database/init.sql` menggunakan DBeaver atau psql.

### 5. Jalankan aplikasi
```bash
node src/app.js
```

## Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | / | Health check |
| POST | /nasabah | Daftar nasabah baru |
| GET | /nasabah/:id | Lihat data nasabah |
| POST | /transaksi/setor | Setor tunai |
| POST | /transaksi/tarik | Tarik tunai |
| POST | /transaksi/transfer | Transfer antar rekening |
| GET | /transaksi/riwayat/:nomor | Riwayat transaksi |

## Contoh Request

### Setor Tunai
```json
POST /transaksi/setor
{
  "nomor_rekening": "1234567890",
  "jumlah": 500000,
  "keterangan": "Setor gaji"
}
```

### Transfer
```json
POST /transaksi/transfer
{
  "rekening_asal": "1234567890",
  "rekening_tujuan": "0987654321",
  "jumlah": 200000,
  "keterangan": "Transfer ke teman"
}
```