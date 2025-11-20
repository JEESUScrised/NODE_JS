const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/notesdb_test';

// Подключение к тестовой базе данных
beforeAll(async () => {
  await mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
});

// Очистка базы данных после каждого теста
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Закрытие соединения после всех тестов
afterAll(async () => {
  await mongoose.connection.close();
});

