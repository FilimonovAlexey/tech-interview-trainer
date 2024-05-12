require('dotenv').config();
const { Bot, GrammyError, HttpError, Keyboard, InlineKeyboard, session } = require('grammy');
const fs = require('fs').promises;

// Создание экземпляра бота
const bot = new Bot(process.env.BOT_API_KEY);

// Настройка сессии с использованием внутреннего хранилища
bot.use(session({
  initial: () => ({})
}));

bot.command('start', async (ctx) => {
  const startKeyboard = new Keyboard()
    .text('HTML')
    .text('CSS')
    .row()
    .text('JavaScript')
    .text('React')
    .row();

  await ctx.reply(
    'Привет! Я помогу тебе подготовиться к собеседованию.'
  );
  await ctx.reply('С чего начнем? Выбирай тему👇', {
    reply_markup: startKeyboard,
  });
});

bot.on('message', async (ctx) => {
  const { text } = ctx.message;
  switch (text) {
    case 'HTML':
      await startHTMLQuiz(ctx);
      break;
    case 'CSS':
      await startCSSQuiz(ctx);
      break;
    default:
      // Обработка ответов на вопросы
      handleQuizAnswer(ctx, text);
  }
});

async function handleQuizAnswer(ctx, answer) {
  try {
    if (!ctx.session.currentQuestion) {
      await ctx.reply('Кажется, я забыл вопрос. Давай начнем заново.');
      return;
    }

    const correctAnswer = ctx.session.currentQuestion.options[ctx.session.currentQuestion.correctOption];

    if (answer === correctAnswer) {
      await ctx.reply('Верно!');
      // Выбираем функцию викторины на основе текущей категории
      if (ctx.session.currentCategory === 'HTML') {
        await startHTMLQuiz(ctx);
      } else if (ctx.session.currentCategory === 'CSS') {
        await startCSSQuiz(ctx);
      }
    } else {
      await ctx.reply('Неправильно. Попробуйте еще раз.');
    }
  } catch (error) {
    console.error('Ошибка обработки ответа на вопрос:', error);
    await ctx.reply('Произошла ошибка при обработке ответа на вопрос. Попробуйте еще раз позже.');
  }
}



async function startHTMLQuiz(ctx) {
  try {
    const data = await fs.readFile('questions/html_questions.json', 'utf8');
    const { questions } = JSON.parse(data);
    const randomIndex = Math.floor(Math.random() * questions.length);
    const questionData = questions[randomIndex];

    ctx.session.currentQuestion = questionData;
    ctx.session.currentCategory = 'HTML'; // Сохраняем текущую категорию

    const keyboard = new Keyboard();
    questionData.options.forEach(option => keyboard.text(option).row());

    await ctx.reply(questionData.question, { reply_markup: keyboard });
  } catch (error) {
    console.error('Ошибка загрузки вопросов:', error);
    await ctx.reply('Произошла ошибка загрузки вопросов. Попробуйте еще раз позже.');
  }
}

async function startCSSQuiz(ctx) {
  try {
    const data = await fs.readFile('questions/css_questions.json', 'utf8');
    const { questions } = JSON.parse(data);
    const randomIndex = Math.floor(Math.random() * questions.length);
    const questionData = questions[randomIndex];

    ctx.session.currentQuestion = questionData;
    ctx.session.currentCategory = 'CSS'; // Сохраняем текущую категорию

    const keyboard = new Keyboard();
    questionData.options.forEach(option => keyboard.text(option).row());

    await ctx.reply(questionData.question, { reply_markup: keyboard });
  } catch (error) {
    console.error('Ошибка загрузки вопросов:', error);
    await ctx.reply('Произошла ошибка загрузки вопросов. Попробуйте еще раз позже.');
  }
}



// Запуск бота
bot.start();