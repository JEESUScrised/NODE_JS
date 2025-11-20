const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Раздаём статические файлы
app.use(express.static(path.join(__dirname, 'public')));

const wss = new WebSocket.Server({ server });

// Хранилище пользователей: Map<WebSocket, {name: string, color: string}>
const users = new Map();

// Список доступных цветов (если пользователь не выбрал свой)
const defaultColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
];
let colorIndex = 0;

wss.on('connection', (ws) => {
  console.log('Новое подключение');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      // Регистрация пользователя
      if (data.type === 'register') {
        const userName = data.name.trim();
        const userColor = data.color || defaultColors[colorIndex % defaultColors.length];
        colorIndex++;

        if (!userName) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Имя не может быть пустым'
          }));
          return;
        }

        // Проверка на уникальность имени
        const existingUser = Array.from(users.values()).find(u => u.name.toLowerCase() === userName.toLowerCase());
        if (existingUser) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Пользователь с таким именем уже существует'
          }));
          return;
        }

        users.set(ws, { name: userName, color: userColor });
        
        // Отправляем приветствие новому пользователю
        const userList = Array.from(users.values())
          .filter(u => u.name !== userName)
          .map(u => u.name);
        
        if (userList.length === 0) {
          ws.send(JSON.stringify({
            type: 'system',
            message: 'Добро пожаловать. Вы первый в чате.'
          }));
        } else {
          ws.send(JSON.stringify({
            type: 'system',
            message: `Добро пожаловать. В чате уже присутствуют: ${userList.join(', ')}.`
          }));
        }

        // Уведомляем остальных о новом пользователе
        broadcast({
          type: 'system',
          message: `${userName} присоединился к чату.`
        }, ws);

        // Обновляем список пользователей у всех
        updateUserList();
      }
      // Обычное сообщение
      else if (data.type === 'message') {
        const user = users.get(ws);
        if (!user) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Сначала представьтесь'
          }));
          return;
        }

        const messageData = {
          type: 'message',
          name: user.name,
          color: user.color,
          message: data.message,
          timestamp: new Date().toISOString()
        };

        // Приватное сообщение
        if (data.targetUser) {
          const targetWs = Array.from(users.entries())
            .find(([_, u]) => u.name === data.targetUser)?.[0];
          
          if (targetWs && targetWs !== ws) {
            targetWs.send(JSON.stringify({
              ...messageData,
              isPrivate: true,
              from: user.name
            }));
            ws.send(JSON.stringify({
              ...messageData,
              isPrivate: true,
              to: data.targetUser
            }));
          } else if (!targetWs) {
            ws.send(JSON.stringify({
              type: 'error',
              message: `Пользователь ${data.targetUser} не найден`
            }));
          }
        } else {
          // Общее сообщение всем (включая отправителя)
          console.log(`Отправка сообщения от ${user.name}: ${data.message}`);
          broadcast(messageData);
        }
      }
    } catch (error) {
      console.error('Ошибка обработки сообщения:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Ошибка обработки сообщения'
      }));
    }
  });

  ws.on('close', () => {
    const user = users.get(ws);
    if (user) {
      users.delete(ws);
      // Уведомляем остальных о выходе пользователя
      broadcast({
        type: 'system',
        message: `${user.name} покинул чат.`
      });
      // Обновляем список пользователей
      updateUserList();
      console.log(`Пользователь ${user.name} отключился`);
    }
  });

  ws.on('error', (error) => {
    console.error('Ошибка WebSocket:', error);
  });
});

// Функция рассылки сообщения всем клиентам
function broadcast(data, excludeWs = null) {
  wss.clients.forEach((client) => {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// Функция обновления списка пользователей
function updateUserList() {
  const userList = Array.from(users.values()).map(u => ({
    name: u.name,
    color: u.color
  }));
  
  broadcast({
    type: 'userList',
    users: userList
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});

