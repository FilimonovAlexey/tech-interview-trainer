# Квиз Бот для Подготовки к Собеседованию на Frontend Разработчика

Этот Telegram бот разработан для помощи в подготовке к собеседованиям на позицию Frontend разработчика. Бот предлагает викторины по различным категориям, таким как HTML, CSS, JavaScript и React, и предоставляет рейтинговый режим для оценки навыков пользователя.

## Функциональности бота
- **Старт**: Пользователь начинает взаимодействие с ботом, используя команду `/start`. Бот приветствует пользователя и предлагает выбрать категорию вопросов или включить рейтинговый режим.
- **Викторины**: Пользователь выбирает одну из категорий (HTML, CSS, JavaScript, React) и отвечает на вопросы. После каждого ответа бот сообщает, правильный ли ответ, и предлагает следующий вопрос.
- **Рейтинговый режим**: Пользователь отвечает на вопросы из всех категорий до первой ошибки. Количество правильных ответов фиксируется как очки, которые сохраняются в таблице лидеров.
- **Таблица лидеров**: Пользователь может посмотреть топ-10 игроков, набравших наибольшее количество очков в рейтинговом режиме.
- **Профиль**: Команда `/profile` позволяет пользователю просмотреть информацию о количестве правильных ответов в каждой категории, а также последний результат в рейтинговом режиме.

## Используемые технологии
- **Node.js**: Серверная платформа для выполнения JavaScript-кода.
- **grammy**: Модуль для создания Telegram ботов.
- **sqlite**: Встраиваемая база данных для хранения результатов пользователей.
- **date-fns**: Библиотека для форматирования дат и времени.
- **dotenv**: Модуль для загрузки переменных окружения из `.env` файла.