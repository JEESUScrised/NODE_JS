const { Request } = require('zeromq');

// получаем аргументы из командной строки
const args = process.argv.slice(2);

if (args.length !== 2) {
    console.log('Использование: node game-client <min> <max>');
    console.log('Пример: node game-client 1 100');
    process.exit(1);
}

const min = parseInt(args[0]);
const max = parseInt(args[1]);

if (isNaN(min) || isNaN(max) || min >= max) {
    console.log('Ошибка: min и max должны быть числами, где min < max');
    process.exit(1);
}

// загадываем число
const secretNumber = Math.floor(Math.random() * (max - min + 1)) + min;
console.log(`Загадано число в диапазоне ${min}-${max}: ${secretNumber}`);

// для отладки 
// console.log('DEBUG: секретное число =', secretNumber);

// основная функция игры
async function playGame() {
    // создаем сокет для запросов
    const requester = new Request();

    // подключаемся к серверу
    await requester.connect('tcp://localhost:5555');

    let gameOver = false;
    let round = 0; // счетчик раундов

    try {
        // отправляем диапазон серверу
        console.log('Отправляем диапазон серверу...');
        await requester.send(JSON.stringify({ range: `${min}-${max}` }));
        
        console.log('Ожидаем ответов от сервера...');
        
        // основной цикл игры
        while (!gameOver) {
            round++;
            const [reply] = await requester.receive();
            const message = JSON.parse(reply.toString());
            console.log(`Раунд ${round} - Ответ сервера:`, message);
            
            if (message.error) {
                console.log('Ошибка сервера:', message.error);
                gameOver = true;
                break;
            }
            
            if (message.answer !== undefined) {
                const serverGuess = message.answer;
                console.log(`Сервер предполагает: ${serverGuess}`);
                
                if (serverGuess === secretNumber) {
                    console.log('🎉 Сервер угадал число! Игра окончена.');
                    console.log(`Потребовалось ${round} попыток`);
                    gameOver = true;
                    break;
                } else if (serverGuess < secretNumber) {
                    console.log('Подсказка: больше');
                    await requester.send(JSON.stringify({ hint: 'more' }));
                } else {
                    console.log('Подсказка: меньше');
                    await requester.send(JSON.stringify({ hint: 'less' }));
                }
            }
        }
        
    } catch (error) {
        console.error('Ошибка при игре:', error);
        // можно добавить retry логику, но пока так
    } finally {
        await requester.close();
        process.exit(0);
    }
}

// обработка ctrl+c
process.on('SIGINT', async function() {
    console.log('\nЗавершение игры...');
    process.exit();
});

// запускаем игру
playGame().catch(console.error);