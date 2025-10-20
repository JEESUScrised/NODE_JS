const { Reply } = require('zeromq');


let min = 0;
let max = 0;
let currentGuess = 0;


async function startServer() {

    const responder = new Reply();

    await responder.bind('tcp://*:5555');

    console.log('Готов к игре...');
    console.log('Сервер запущен на порту 5555');

  
    for await (const [request] of responder) {
        try {
            const message = JSON.parse(request.toString());
            console.log('Получено от клиента:', message);
            
            let response = {};
            
            if (message.range) {
             
                const rangeParts = message.range.split('-');
                min = parseInt(rangeParts[0]);
                max = parseInt(rangeParts[1]);
                
              
                currentGuess = Math.floor((min + max) / 2);
                attempts = 1; 
                response = { answer: currentGuess };
                
                console.log(`Диапазон: ${min}-${max}, первое предположение: ${currentGuess}`);
                
            } else if (message.hint) {
             
                if (message.hint === 'more') {
                   
                    min = currentGuess + 1;
                    console.log(`Подсказка "больше", новый диапазон: ${min}-${max}`);
                } else if (message.hint === 'less') {
                 
                    max = currentGuess - 1;
                    console.log(`Подсказка "меньше", новый диапазон: ${min}-${max}`);
                }
                
                
                if (min > max) {
                    response = { error: 'Невозможно угадать число!' };
                    console.log('Ошибка: диапазон стал некорректным');
                } else if (min === max) {
                    
                    currentGuess = min;
                    response = { answer: currentGuess };
                    console.log(`Финальное предположение: ${currentGuess}`);
                } else {
                   
                    currentGuess = Math.floor((min + max) / 2);
                    attempts++; 
                    response = { answer: currentGuess };
                    console.log(`Новое предположение: ${currentGuess} (попытка ${attempts})`);
                }
            }
            
         
            await responder.send(JSON.stringify(response));
            console.log('Отправлено клиенту:', response);
            
         
            
        } catch (error) {
            console.error('Ошибка при обработке сообщения:', error);
            await responder.send(JSON.stringify({ error: 'Ошибка сервера' }));
        }
    }
}

process.on('SIGINT', async function() {
    console.log('\nЗавершение работы сервера...');
    process.exit();
});

// запускаем сервер
startServer().catch(console.error);