require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Konfigurasi koneksi database
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || ''
  // tidak menggunakan database di sini agar bisa membuatnya jika belum ada
});

// Koneksi ke database dan buat tabel jika belum ada
db.connect((err) => {
  if (err) {
    console.error('Error koneksi ke database:', err);
    return;
  }
  console.log('Terhubung ke database MySQL');

  // Membuat database jika belum ada
  db.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'toko_db'}\``, (err) => {
    if (err) {
      console.error('Error membuat database:', err);
      return;
    }
    
    // Gunakan database tersebut
    db.query(`USE \`${process.env.DB_NAME || 'toko_db'}\``, (err) => {
      if (err) {
         console.error('Error menggunakan database:', err);
         return;
      }

      // Membuat tabel produk secara otomatis jika belum ada
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS produk (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nama TEXT NOT NULL,
          harga INT NOT NULL,
          stok INT NOT NULL,
          kategori TEXT NOT NULL
        )
      `;
      db.query(createTableQuery, (err, result) => {
        if (err) {
          console.error('Error membuat tabel:', err);
        } else {
          console.log('Tabel "produk" siap digunakan');
        }
      });
    });
  });
});

// 1. GET /api/products : Menampilkan semua produk
app.get('/api/products', (req, res) => {
  const query = 'SELECT * FROM produk';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Berhasil mengambil data produk', data: results });
  });
});

// 2. POST /api/products : Menambah produk baru
app.post('/api/products', (req, res) => {
  const { nama, harga, stok, kategori } = req.body;
  if (!nama || harga === undefined || stok === undefined || !kategori) {
    return res.status(400).json({ error: 'Nama, harga, stok, dan kategori harus diisi' });
  }

  const query = 'INSERT INTO produk (nama, harga, stok, kategori) VALUES (?, ?, ?, ?)';
  db.query(query, [nama, harga, stok, kategori], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({
      message: 'Produk berhasil ditambahkan',
      data: { id: result.insertId, nama, harga, stok, kategori }
    });
  });
});

// 3. PUT /api/products/:id : Mengupdate data produk (Harga/Stok) berdasarkan ID
app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const { harga, stok } = req.body;

  if (harga === undefined && stok === undefined) {
    return res.status(400).json({ error: 'Harga atau stok harus diisi untuk diupdate' });
  }

  // Bangun query update dinamis
  let updateFields = [];
  let updateValues = [];
  
  if (harga !== undefined) {
    updateFields.push('harga = ?');
    updateValues.push(harga);
  }
  if (stok !== undefined) {
    updateFields.push('stok = ?');
    updateValues.push(stok);
  }

  updateValues.push(id);

  const query = `UPDATE produk SET ${updateFields.join(', ')} WHERE id = ?`;
  
  db.query(query, updateValues, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }
    res.json({ message: 'Produk berhasil diupdate' });
  });
});

// 4. DELETE /api/products/:id : Menghapus produk berdasarkan ID
app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM produk WHERE id = ?';
  
  db.query(query, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }
    res.json({ message: 'Produk berhasil dihapus' });
  });
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
