
## Установка

```bash
npm install
```

## Запуск

```bash
npm start
```

Сервер запустится на порту 3000 


### Создание сокращённого URL

Отправьте GET-запрос:
```
http://localhost:3000/create?url=https://example.com
```

Ответ:
```json
{
  "shortUrl": "http://localhost:3000/abc123"
}
```

### Переход по сокращённому URL

Откройте в браузере:
```
http://localhost:3000/abc123
```

Произойдёт автоматическая переадресация на оригинальный URL.

