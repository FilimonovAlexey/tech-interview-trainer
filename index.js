require('dotenv').config();
const { Bot, GrammyError, HttpError, Keyboard, InlineKeyboard } = require('grammy');
const fs = require('fs').promises;

// Создание экземпляра бота
const bot = new Bot(process.env.BOT_API_KEY);

bot.command('start', async (ctx) => {
  const startKeyboard = new Keyboard()
    .text('HTML')
    .row()
    .text('CSS')
    .row()
    .text('JavaScript')
    .row()
    .text('React')
    .row();

  await ctx.reply(
    'Привет! Я помогу тебе подготовиться к собеседованию. Напиши /start, чтобы начать.'
  );
  await ctx.reply('С чего начнем? Выбирай тему👇', {
    reply_markup: startKeyboard,
  });
});

bot.on('message', async (ctx) => {
  const { text } = ctx.message;
  if (text === 'HTML') {
    await startHTMLQuiz(ctx);
  } else {
    // Добавляем обработчик ответа на вопрос
    handleQuizAnswer(ctx, text);
  }
});

async function handleQuizAnswer(ctx, answer) {
  try {
    // Получаем правильный ответ из базы данных или файла
    const correctAnswer = ""; // Ваш код для получения правильного ответа
  
    // Проверяем ответ пользователя
    if (answer === correctAnswer) {
      // Отправляем сообщение о правильном ответе
      await ctx.reply('Верно!');

      // Отправляем следующий вопрос
      await startHTMLQuiz(ctx);
    } else {
      // Отправляем сообщение о неправильном ответе
      await ctx.reply('Неправильно. Попробуйте еще раз.');
    }
  } catch (error) {
    console.error('Ошибка обработки ответа на вопрос:', error);
    await ctx.reply('Произошла ошибка при обработке ответа на вопрос. Попробуйте еще раз позже.');
  }
}

async function startHTMLQuiz(ctx) {
  try {
    // Загрузка вопросов из файла
    const data = await fs.readFile('questions/html_questions.json', 'utf8');
    const { questions } = JSON.parse(data);
    
    // Выбор случайного вопроса
    const randomIndex = Math.floor(Math.random() * questions.length);
    const { question, options } = questions[randomIndex];

    // Формирование клавиатуры с вариантами ответов
    const keyboard = new Keyboard();
    options.forEach(option => keyboard.text(option).row());

    // Отправка вопроса пользователю
    await ctx.reply(question, { reply_markup: keyboard });
  } catch (error) {
    console.error('Ошибка загрузки вопросов:', error);
    await ctx.reply('Произошла ошибка загрузки вопросов. Попробуйте еще раз позже.');
  }
}

// Запуск бота
bot.start();