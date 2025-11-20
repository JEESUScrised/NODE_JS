let ws = null;
let userName = null;
let userColor = null;
let isRegistered = false;
let selectedTargetUser = null;

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    const registerModal = document.getElementById('registerModal');
    const userNameInput = document.getElementById('userNameInput');
    const userColorInput = document.getElementById('userColorInput');
    const registerBtn = document.getElementById('registerBtn');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const targetUserSelect = document.getElementById('targetUserSelect');
    const targetIndicator = document.getElementById('targetIndicator');

    // Подключение к серверу
    connect();

    // Регистрация по кнопке
    registerBtn.addEventListener('click', registerUser);

    // Регистрация по Enter в поле имени
    userNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            registerUser();
        }
    });

    // Отправка сообщения по кнопке
    sendBtn.addEventListener('click', sendMessage);

    // Отправка сообщения по Enter
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Выбор получателя сообщения
    targetUserSelect.addEventListener('change', (e) => {
        selectedTargetUser = e.target.value || null;
        updateTargetIndicator();
    });

    function connect() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('Подключено к серверу');
            updateConnectionStatus(true);
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleMessage(data);
        };

        ws.onclose = () => {
            console.log('Отключено от сервера');
            updateConnectionStatus(false);
            // Попытка переподключения через 3 секунды
            setTimeout(connect, 3000);
        };

        ws.onerror = (error) => {
            console.error('Ошибка WebSocket:', error);
            updateConnectionStatus(false);
        };
    }

    function registerUser() {
        const name = userNameInput.value.trim();
        const color = userColorInput.value;

        if (!name) {
            alert('Пожалуйста, введите имя');
            return;
        }

        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'register',
                name: name,
                color: color
            }));
        } else {
            alert('Нет подключения к серверу');
        }
    }

    function sendMessage() {
        const message = messageInput.value.trim();
        
        if (!message) return;
        if (!isRegistered) {
            alert('Сначала представьтесь');
            return;
        }

        if (ws && ws.readyState === WebSocket.OPEN) {
            const messageData = {
                type: 'message',
                message: message,
                targetUser: selectedTargetUser
            };
            console.log('Отправка сообщения:', messageData);
            ws.send(JSON.stringify(messageData));
            messageInput.value = '';
        } else {
            console.error('WebSocket не подключен. Состояние:', ws ? ws.readyState : 'null');
        }
    }

    function handleMessage(data) {
        switch (data.type) {
            case 'system':
                // Обработка успешной регистрации
                if (data.message.includes('Добро пожаловать')) {
                    userName = userNameInput.value.trim();
                    userColor = userColorInput.value;
                    isRegistered = true;
                    registerModal.style.display = 'none';
                    messageInput.disabled = false;
                    sendBtn.disabled = false;
                    messageInput.focus();
                }
                addSystemMessage(data.message);
                break;
            
            case 'message':
                console.log('Получено сообщение:', data);
                addChatMessage(data.name, data.message, data.color, data.isPrivate, data.from, data.to);
                break;
            
            case 'userList':
                updateUserList(data.users);
                break;
            
            case 'error':
                alert(data.message);
                break;
        }
    }

    function addChatMessage(name, message, color, isPrivate = false, from = null, to = null) {
        const messagesDiv = document.getElementById('messages');
        if (!messagesDiv) {
            console.error('Элемент messages не найден!');
            return;
        }
        const messageDiv = document.createElement('div');
        
        const isMyMessage = name === userName;
        messageDiv.className = `message ${isMyMessage ? 'user-message' : 'other-message'}`;
        
        if (isPrivate) {
            messageDiv.classList.add('private-message');
        }

        // Устанавливаем цвет для сообщений других пользователей
        if (!isMyMessage && color) {
            messageDiv.style.borderLeftColor = color;
        }

        const header = document.createElement('div');
        header.className = 'message-header';
        
        if (isPrivate) {
            if (isMyMessage) {
                header.textContent = `→ ${to}`;
            } else {
                header.textContent = `← ${from}`;
            }
        } else {
            header.textContent = name;
        }
        
        // Устанавливаем цвет имени
        if (color) {
            header.style.color = isMyMessage ? 'white' : color;
        }

        const text = document.createElement('div');
        text.className = 'message-text';
        text.textContent = message;

        const time = document.createElement('div');
        time.className = 'message-time';
        time.textContent = new Date().toLocaleTimeString('ru-RU');

        messageDiv.appendChild(header);
        messageDiv.appendChild(text);
        messageDiv.appendChild(time);

        messagesDiv.appendChild(messageDiv);
        scrollToBottom();
    }

    function addSystemMessage(message) {
        const messagesDiv = document.getElementById('messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message system-message';
        messageDiv.textContent = message;
        messagesDiv.appendChild(messageDiv);
        scrollToBottom();
    }

    function updateUserList(users) {
        const userListDiv = document.getElementById('userList');
        const targetSelect = document.getElementById('targetUserSelect');
        
        // Очищаем списки
        userListDiv.innerHTML = '';
        targetSelect.innerHTML = '<option value="">Всем</option>';

        users.forEach(user => {
            // Добавляем в боковую панель
            const userItem = document.createElement('div');
            userItem.className = 'user-item';
            if (user.name === userName) {
                userItem.classList.add('selected');
            }

            const colorDiv = document.createElement('div');
            colorDiv.className = 'user-color';
            colorDiv.style.backgroundColor = user.color;

            const nameDiv = document.createElement('div');
            nameDiv.className = 'user-name';
            nameDiv.textContent = user.name;

            userItem.appendChild(colorDiv);
            userItem.appendChild(nameDiv);
            
            // Клик по пользователю для приватного сообщения
            if (user.name !== userName) {
                userItem.addEventListener('click', () => {
                    targetUserSelect.value = user.name;
                    selectedTargetUser = user.name;
                    updateTargetIndicator();
                });
            }

            userListDiv.appendChild(userItem);

            // Добавляем в селект для приватных сообщений
            if (user.name !== userName) {
                const option = document.createElement('option');
                option.value = user.name;
                option.textContent = user.name;
                targetSelect.appendChild(option);
            }
        });
    }

    function updateTargetIndicator() {
        if (selectedTargetUser) {
            targetIndicator.textContent = `→ ${selectedTargetUser}`;
            targetIndicator.style.display = 'inline';
        } else {
            targetIndicator.textContent = '';
            targetIndicator.style.display = 'none';
        }
    }

    function updateConnectionStatus(connected) {
        const statusDiv = document.getElementById('connectionStatus');
        if (connected) {
            statusDiv.textContent = 'Подключено';
            statusDiv.className = 'status connected';
        } else {
            statusDiv.textContent = 'Отключено';
            statusDiv.className = 'status disconnected';
        }
    }

    function scrollToBottom() {
        const messagesDiv = document.getElementById('messages');
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
});

