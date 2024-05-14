require('dotenv').config();
const { Bot, GrammyError, HttpError, Keyboard, InlineKeyboard, session } = require('grammy');
const fs = require('fs').promises;

// Создание экземпляра бота
const bot = new Bot(process.env.BOT_API_KEY);

// Настройка сессии с использованием внутреннего хранилища
bot.use(session({
  initial: () => ({})
}));

let questionsData = {};

async function loadQuestions() {
  const categories = {
    html: 'html_questions.json',
    css: 'css_questions.json',
    js: 'js_questions.json',
    react: 'react_questions.json'
  };
  for (const [category, file] of Object.entries(categories)) {
    try {
      const data = await fs.readFile(`questions/${file}`, 'utf8');
      questionsData[category] = JSON.parse(data).questions;
    } catch (error) {
      console.error(`Ошибка при загрузке вопросов из файла ${file}:`, error);
    }
  }
}

function initializeQuizState(ctx, category) {
  if (!ctx.session.askedQuestions) {
    ctx.session.askedQuestions = {};
  }
  if (!ctx.session.askedQuestions[category]) {
    ctx.session.askedQuestions[category] = [];
  }
}

function initializeRatingMode(ctx) {
  ctx.session.ratingMode = true;
  ctx.session.score = 0;
  ctx.session.askedQuestions = {};
  ctx.session.currentCategory = null;
}

bot.command('start', async (ctx) => {
  const startKeyboard = new Keyboard()
    .text('HTML')
    .text('CSS')
    .row()
    .text('JavaScript')
    .text('React')
    .row()
    .text('Рейтинговый режим')
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
  if (text === 'Назад') {
    const startKeyboard = new Keyboard()
      .text('HTML')
      .text('CSS')
      .row()
      .text('JavaScript')
      .text('React')
      .row()
      .text('Рейтинговый режим')
      .row();

    await ctx.reply('Выберите категорию:', {
      reply_markup: startKeyboard,
    });
  } else {
    switch (text) {
      case 'HTML':
        await startQuiz(ctx, 'html');
        break;
      case 'CSS':
        await startQuiz(ctx, 'css');
        break;
      case 'JavaScript':
        await startQuiz(ctx, 'js');
        break;
      case 'React':
        await startQuiz(ctx, 'react');
        break;
      case 'Рейтинговый режим':
        initializeRatingMode(ctx);
        await startRatingQuiz(ctx);
        break;
      default:
        handleQuizAnswer(ctx, text);
    }
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
      if (ctx.session.ratingMode) {
        ctx.session.score += 1;
        await startRatingQuiz(ctx);
      } else {
        await startQuiz(ctx, ctx.session.currentCategory);
      }
    } else {
      if (ctx.session.ratingMode) {
        await ctx.reply(`Ошибка! Вы набрали ${ctx.session.score} очков.`);
        ctx.session.ratingMode = false; // Завершаем рейтинговый режим
        ctx.session.score = 0;
      } else {
        await ctx.reply('Неправильно. Попробуйте еще раз.');
      }
    }
  } catch (error) {
    console.error('Ошибка обработки ответа на вопрос:', error);
    await ctx.reply('Произошла ошибка при обработке ответа на вопрос. Попробуйте еще раз позже.');
  }
}

function getRandomQuestion(questions, asked) {
  const availableQuestions = questions.filter((_, index) => !asked.includes(index));
  if (availableQuestions.length === 0) {
    return null; // Все вопросы были заданы
  }
  const randomIndex = Math.floor(Math.random() * availableQuestions.length);
  return availableQuestions[randomIndex];
}

async function startQuiz(ctx, category) {
  initializeQuizState(ctx, category);

  const questions = questionsData[category];
  if (!questions) {
    await ctx.reply(`Не удалось загрузить вопросы для категории ${category.toUpperCase()}. Проверьте файл: questions/${category}_questions.json`);
    return;
  }

  const questionData = getRandomQuestion(questions, ctx.session.askedQuestions[category]);
  if (!questionData) {
    await ctx.reply(`Вы ответили на все вопросы по ${category.toUpperCase()}!`);
    return;
  }

  const questionIndex = questions.indexOf(questionData);
  ctx.session.askedQuestions[category].push(questionIndex);
  ctx.session.currentQuestion = questionData;
  ctx.session.currentCategory = category;

  const keyboard = new Keyboard();
  questionData.options.forEach(option => keyboard.text(option).row());
  keyboard.text('Назад').row();

  await ctx.reply(questionData.question, { reply_markup: keyboard });
}

async function startRatingQuiz(ctx) {
  const categories = ['html', 'css', 'js', 'react'];
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];

  initializeQuizState(ctx, randomCategory);

  const questions = questionsData[randomCategory];
  if (!questions) {
    await ctx.reply(`Не удалось загрузить вопросы для категории ${randomCategory.toUpperCase()}. Проверьте файл: questions/${randomCategory}_questions.json`);
    return;
  }

  const questionData = getRandomQuestion(questions, ctx.session.askedQuestions[randomCategory]);
  if (!questionData) {
    await ctx.reply(`Вы ответили на все вопросы по ${randomCategory.toUpperCase()}!`);
    return;
  }

  const questionIndex = questions.indexOf(questionData);
  ctx.session.askedQuestions[randomCategory].push(questionIndex);
  ctx.session.currentQuestion = questionData;
  ctx.session.currentCategory = randomCategory;

  const keyboard = new Keyboard();
  questionData.options.forEach(option => keyboard.text(option).row());
  keyboard.text('Назад').row();

  await ctx.reply(questionData.question, { reply_markup: keyboard });
}

// Запуск бота
(async () => {
  await loadQuestions();
  bot.start();
})();
