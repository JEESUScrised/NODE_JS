# Проект kt5

API для работы с заметками на Node.js + Express + MongoDB

## Структура проекта

```
.
├── models/
│   └── Note.js          # Модель заметки
├── routes/
│   └── notes.js         # Маршруты API
├── test/
│   ├── setup.js         # Настройка тестовой среды
│   └── notes.test.js    # Тесты для всех маршрутов
├── server.js            # Главный файл сервера
├── package.json         # Зависимости проекта
└── README.md           # Документация
```

## Установка

1. Установите зависимости:
```bash
npm install
```

2. Установите и запустите MongoDB:

   **Вариант 1: Локальная установка MongoDB**
   - Скачайте и установите MongoDB Community Server
   - Запустите MongoDB сервис
   - Проверьте: `mongosh` или `mongo`

   **Вариант 2: Docker**
   ```bash
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

3. Создайте файл `.env` в корне проекта:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/notesdb
```

## Запуск

### Запуск сервера:
```bash
npm start
```

### Запуск тестов:
```bash
npm test
```
