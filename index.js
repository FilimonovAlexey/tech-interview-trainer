require('dotenv').config();
const { Bot, GrammyError, HttpError, Keyboard, InlineKeyboard, session } = require('grammy');
const fs = require('fs').promises;

// Создание экземпляра бота
const bot = new Bot(process.env.BOT_API_KEY);

// Настройка сессии с использованием внутреннего хранилища
bot.use(session({
  initial: () => ({})
}));

function initializeQuizState(ctx, category) {
  if (!ctx.session.askedQuestions) {
    ctx.session.askedQuestions = {};
  }
  if (!ctx.session.askedQuestions[category]) {
    ctx.session.askedQuestions[category] = [];
  }
}

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
  if (text === 'Назад') {
    const startKeyboard = new Keyboard()
      .text('HTML')
      .text('CSS')
      .row()
      .text('JavaScript')
      .text('React')
      .row();

    await ctx.reply('Выберите категорию:', {
      reply_markup: startKeyboard,
    });
  } else {
    switch (text) {
      case 'HTML':
        await startHTMLQuiz(ctx);
        break;
      case 'CSS':
        await startCSSQuiz(ctx);
        break;
      case 'JavaScript':
        await startJavaScriptQuiz(ctx);
        break;
      case 'React':
        await startReactQuiz(ctx);
        break;
      default:
        // Обработка ответов на вопросы
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
      // Выбираем функцию викторины на основе текущей категории
      switch (ctx.session.currentCategory) {
        case 'HTML':
          await startHTMLQuiz(ctx);
          break;
        case 'CSS':
          await startCSSQuiz(ctx);
          break;
        case 'JavaScript':
          await startJavaScriptQuiz(ctx);
          break;
        case 'React':
          await startReactQuiz(ctx);
          break;
        default:
          await ctx.reply('Выберите категорию:', {
            reply_markup: startKeyboard,
          });
      }
    } else {
      await ctx.reply('Неправильно. Попробуйте еще раз.');
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

async function startHTMLQuiz(ctx) {
  initializeQuizState(ctx, 'HTML');
  
  const data = await fs.readFile('questions/html_questions.json', 'utf8');
  const { questions } = JSON.parse(data);
  const questionData = getRandomQuestion(questions, ctx.session.askedQuestions['HTML']);
  
  if (!questionData) {
    await ctx.reply("Вы ответили на все вопросы по HTML!");
    return;
  }
  
  const questionIndex = questions.indexOf(questionData);
  ctx.session.askedQuestions['HTML'].push(questionIndex);
  ctx.session.currentQuestion = questionData;
  ctx.session.currentCategory = 'HTML';
  
  const keyboard = new Keyboard();
  questionData.options.forEach(option => keyboard.text(option).row());
  keyboard.text('Назад').row(); // Добавляем кнопку "Назад"
  
  await ctx.reply(questionData.question, { reply_markup: keyboard });
}

async function startCSSQuiz(ctx) {
  initializeQuizState(ctx, 'CSS');
  
  const data = await fs.readFile('questions/css_questions.json', 'utf8');
  const { questions } = JSON.parse(data);
  const questionData = getRandomQuestion(questions, ctx.session.askedQuestions['CSS']);
  
  if (!questionData) {
    await ctx.reply("Вы ответили на все вопросы по CSS!");
    return;
  }
  
  const questionIndex = questions.indexOf(questionData);
  ctx.session.askedQuestions['CSS'].push(questionIndex);
  ctx.session.currentQuestion = questionData;
  ctx.session.currentCategory = 'CSS';
  
  const keyboard = new Keyboard();
  questionData.options.forEach(option => keyboard.text(option).row());
  keyboard.text('Назад').row(); // Добавляем кнопку "Назад"
  
  await ctx.reply(questionData.question, { reply_markup: keyboard });
}

async function startJavaScriptQuiz(ctx) {
  initializeQuizState(ctx, 'JavaScript');
  
  const data = await fs.readFile('questions/js_questions.json', 'utf8');
  const { questions } = JSON.parse(data);
  const questionData = getRandomQuestion(questions, ctx.session.askedQuestions['JavaScript']);
  
  if (!questionData) {
    await ctx.reply("Вы ответили на все вопросы по JavaScript!");
    return;
  }
  
  const questionIndex = questions.indexOf(questionData);
  ctx.session.askedQuestions['JavaScript'].push(questionIndex);
  ctx.session.currentQuestion = questionData;
  ctx.session.currentCategory = 'JavaScript';
  
  const keyboard = new Keyboard();
  questionData.options.forEach(option => keyboard.text(option).row());
  keyboard.text('Назад').row();
  
  await ctx.reply(questionData.question, { reply_markup: keyboard });
}

async function startReactQuiz(ctx) {
  initializeQuizState(ctx, 'React');
  
  const data = await fs.readFile('questions/react_questions.json', 'utf8');
  const { questions } = JSON.parse(data);
  const questionData = getRandomQuestion(questions, ctx.session.askedQuestions['React']);
  
  if (!questionData) {
    await ctx.reply("Вы ответили на все вопросы по React!");
    return;
  }
  
  const questionIndex = questions.indexOf(questionData);
  ctx.session.askedQuestions['React'].push(questionIndex);
  ctx.session.currentQuestion = questionData;
  ctx.session.currentCategory = 'React';
  
  const keyboard = new Keyboard();
  questionData.options.forEach(option => keyboard.text(option).row());
  keyboard.text('Назад').row();
  
  await ctx.reply(questionData.question, { reply_markup: keyboard });
}

// Запуск бота
bot.start();