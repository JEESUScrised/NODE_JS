require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const notesRoutes = require('./routes/notes');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/notesdb';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', notesRoutes);

// Подключение к MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    }).on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`\nОшибка: Порт ${PORT} уже занят!`);
        console.error('Возможные решения:');
        console.error(`1. Остановите процесс на порту ${PORT}:`);
        console.error(`   Get-NetTCPConnection -LocalPort ${PORT} | Select-Object OwningProcess`);
        console.error(`   Stop-Process -Id <PID> -Force`);
        console.error(`2. Или используйте другой порт в файле .env: PORT=3001\n`);
      } else {
        console.error('Ошибка при запуске сервера:', error.message);
      }
      process.exit(1);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error.message);
    console.error('\nУбедитесь, что MongoDB запущен:');
    console.error('1. Установите MongoDB: https://www.mongodb.com/try/download/community');
    console.error('2. Запустите MongoDB сервис');
    console.error('3. Или используйте MongoDB Atlas (облачный сервис)');
    console.error(`4. Проверьте строку подключения: ${MONGODB_URI}\n`);
    process.exit(1);
  });

module.exports = app;

