const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const categoryNames = {
    'business': 'Бизнес',
    'economic': 'Экономика',
    'finances': 'Финансы',
    'politics': 'Политика',
    'auto': 'Автомобили'
};

app.get('/:count/news/for/:category', async (req, res) => {
    try {
        const count = parseInt(req.params.count);
        const category = req.params.category;

        if (isNaN(count) || count <= 0) {
            return res.status(400).send('<h3>Ошибка: количество новостей должно быть положительным числом</h3>');
        }

        if (!categoryNames[category]) {
            return res.status(400).send(`<h3>Ошибка: категория "${category}" не поддерживается</h3>`);
        }

        const rssUrl = `https://www.vedomosti.ru/rss/rubric/${category}`;
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

        console.log(`Запрос новостей: ${count} штук из категории ${category}`);
        console.log(`API URL: ${apiUrl}`);

        const response = await axios.get(apiUrl);

        if (response.data.status !== 'ok') {
            throw new Error('Ошибка при получении данных от rss2json');
        }

        let news = response.data.items || [];

        if (news.length > count) {
            news = news.slice(0, count);
        }

        const categoryName = categoryNames[category];

        res.render('news', {
            count: count,
            category: categoryName,
            news: news
        });

    } catch (error) {
        console.error('Ошибка при обработке запроса:', error.message);
        res.status(500).send(`<h3>Ошибка сервера: ${error.message}</h3>`);
    }
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
    console.log('Пример запроса: http://localhost:3000/10/news/for/business');
    console.log('Доступные категории: business, economic, finances, politics, auto');
});
