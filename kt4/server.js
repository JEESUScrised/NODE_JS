const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const dbPath = path.join(__dirname, 'urls.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS urls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_url TEXT NOT NULL,
    short_code TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

function generateShortCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

app.get('/create', (req, res) => {
  const originalUrl = req.query.url;

  if (!originalUrl) {
    return res.status(400).json({ error: 'Параметр url обязателен' });
  }

  try {
    new URL(originalUrl);
  } catch (e) {
    return res.status(400).json({ error: 'Некорректный URL' });
  }

  db.get('SELECT short_code FROM urls WHERE original_url = ?', [originalUrl], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Ошибка базы данных' });
    }

    if (row) {
      const shortUrl = `${req.protocol}://${req.get('host')}/${row.short_code}`;
      return res.json({ shortUrl: shortUrl });
    }

    let shortCode = generateShortCode();
    let attempts = 0;
    const maxAttempts = 10;

    const insertUrl = () => {
      db.run(
        'INSERT INTO urls (original_url, short_code) VALUES (?, ?)',
        [originalUrl, shortCode],
        function(err) {
          if (err) {
            if (err.message.includes('UNIQUE constraint')) {
              attempts++;
              if (attempts < maxAttempts) {
                shortCode = generateShortCode();
                insertUrl();
              } else {
                return res.status(500).json({ error: 'Не удалось создать уникальный код' });
              }
            } else {
              return res.status(500).json({ error: 'Ошибка при сохранении в базу данных' });
            }
          } else {
            const shortUrl = `${req.protocol}://${req.get('host')}/${shortCode}`;
            res.json({ shortUrl: shortUrl });
          }
        }
      );
    };

    insertUrl();
  });
});

app.get('/:shortCode', (req, res) => {
  const shortCode = req.params.shortCode;

  if (shortCode === 'create') {
    return res.status(404).json({ error: 'Не найдено' });
  }

  db.get('SELECT original_url FROM urls WHERE short_code = ?', [shortCode], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Ошибка базы данных' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Сокращённый URL не найден' });
    }

    res.redirect(301, row.original_url);
  });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`Пример использования: http://localhost:${PORT}/create?url=https://example.com`);
});

process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('База данных закрыта.');
    process.exit(0);
  });
});

