require('dotenv').config();
const { Bot, GrammyError, HttpError, Keyboard, InlineKeyboard, session } = require('grammy');
const fs = require('fs').promises;
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const { format } = require('date-fns');
const { ru } = require('date-fns/locale'); // Подключаем русскую локаль

// Создание экземпляра бота
const bot = new Bot(process.env.BOT_API_KEY);

// Настройка сессии с использованием внутреннего хранилища
bot.use(session({
  initial: () => ({
    correctAnswers: {
      html: 0,
      css: 0,
      js: 0,
      react: 0
    },
    hasStartedRatingMode: false
  })
}));

let questionsData = {};
let db;

// Загрузка вопросов в память при старте бота
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

async function initDatabase() {
  db = await open({
    filename: 'leaderboard.db',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS leaderboard (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      score INTEGER NOT NULL,
      last_played TEXT NOT NULL
    )
  `);
}

async function createProfile(username) {
  const existingEntry = await db.get('SELECT * FROM leaderboard WHERE username = ?', username);
  if (!existingEntry) {
    await db.run('INSERT INTO leaderboard (username, score, last_played) VALUES (?, ?, ?)', username, 0, 'Еще не играл');
  }
}

async function updateLeaderboard(username, score) {
  const now = new Date().toISOString();
  const existingEntry = await db.get('SELECT * FROM leaderboard WHERE username = ?', username);
  if (existingEntry) {
    if (existingEntry.score < score) {
      await db.run('UPDATE leaderboard SET score = ?, last_played = ? WHERE username = ?', score, now, username);
    } else {
      await db.run('UPDATE leaderboard SET last_played = ? WHERE username = ?', now, username);
    }
  } else {
    await db.run('INSERT INTO leaderboard (username, score, last_played) VALUES (?, ?, ?)', username, score, now);
  }
}

async function getLeaderboard() {
  return await db.all('SELECT username, score FROM leaderboard ORDER BY score DESC LIMIT 10');
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

function getStartKeyboard() {
  return new Keyboard()
    .text('HTML')
    .text('CSS')
    .row()
    .text('JavaScript')
    .text('React')
    .row()
    .text('🏆Рейтинговый режим')
    .row()
    .text('📣Таблица лидеров')
    .row();
}

bot.command('start', async (ctx) => {
  const username = ctx.from.username || ctx.from.first_name;
  await createProfile(username);

  const startKeyboard = getStartKeyboard();

  await ctx.reply(
    'Привет! Я помогу тебе подготовиться к собеседованию. Используй команды ниже для взаимодействия с ботом:\n' +
    '/start - Начать использование бота\n' +
    '/profile - Просмотр вашего профиля',
    { reply_markup: startKeyboard }
  );
  await ctx.reply('С чего начнем? Выбирай тему👇', {
    reply_markup: startKeyboard,
  });
});

bot.command('profile', async (ctx) => {
  const username = ctx.from.username || ctx.from.first_name;
  const result = await db.get('SELECT * FROM leaderboard WHERE username = ?', username);

  const htmlQuestionsTotal = questionsData.html.length;
  const cssQuestionsTotal = questionsData.css.length;
  const jsQuestionsTotal = questionsData.js.length;
  const reactQuestionsTotal = questionsData.react.length;

  const htmlCorrect = ctx.session.correctAnswers.html;
  const cssCorrect = ctx.session.correctAnswers.css;
  const jsCorrect = ctx.session.correctAnswers.js;
  const reactCorrect = ctx.session.correctAnswers.react;

  if (result) {
    const formattedDate = result.last_played === 'Еще не играл' ? result.last_played : format(new Date(result.last_played), 'dd MMMM yyyy, HH:mm', { locale: ru });
    const profileMessage = `👤 Профиль пользователя ${username}:\n` +
      `🏆 Счет в рейтинговой игре: ${result.score} очков\n` +
      `📅 Дата последней игры: ${formattedDate}\n` +
      `📚 Вопросы по HTML: решено верно ${htmlCorrect} из ${htmlQuestionsTotal}\n` +
      `📚 Вопросы по CSS: решено верно ${cssCorrect} из ${cssQuestionsTotal}\n` +
      `📚 Вопросы по JavaScript: решено верно ${jsCorrect} из ${jsQuestionsTotal}\n` +
      `📚 Вопросы по React: решено верно ${reactCorrect} из ${reactQuestionsTotal}`;

    await ctx.reply(profileMessage);
  } else {
    await ctx.reply('Профиль не найден. Начните игру в рейтинговом режиме, чтобы создать профиль.');
  }
});

bot.on('message', async (ctx) => {
  const { text } = ctx.message;
  if (text === 'Назад ↩️') {
    const startKeyboard = getStartKeyboard();

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
      case '🏆Рейтинговый режим':
        if (!ctx.session.hasStartedRatingMode) {
          ctx.session.hasStartedRatingMode = true;
          await ctx.reply(
            'Рейтинговый режим содержит вопросы из всех категорий. За каждый правильный ответ дается балл, а при неверном ответе игра прекращается. Таблица лидеров выводит топ 10 игроков в рейтинге.'
          );
        }
        initializeRatingMode(ctx);
        await startRatingQuiz(ctx);
        break;
      case '📣Таблица лидеров':
        await showLeaderboard(ctx);
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
      ctx.session.correctAnswers[ctx.session.currentCategory]++;
      if (ctx.session.ratingMode) {
        ctx.session.score += 1;
        await startRatingQuiz(ctx);
      } else {
        await startQuiz(ctx, ctx.session.currentCategory);
      }
    } else {
      if (ctx.session.ratingMode) {
        const username = ctx.from.username || ctx.from.first_name;
        await updateLeaderboard(username, ctx.session.score);
        ctx.session.ratingMode = false; // Завершаем рейтинговый режим
        const startKeyboard = getStartKeyboard();
        await ctx.reply(`Ошибка! Вы набрали ${ctx.session.score} очков.`, {
          reply_markup: startKeyboard,
        });
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
    const startKeyboard = getStartKeyboard();
    await ctx.reply(`Вы ответили на все вопросы по ${category.toUpperCase()}!`, {
      reply_markup: startKeyboard,
    });
    return;
  }

  const questionIndex = questions.indexOf(questionData);
  ctx.session.askedQuestions[category].push(questionIndex);
  ctx.session.currentQuestion = questionData;
  ctx.session.currentCategory = category;

  const keyboard = new Keyboard();
  questionData.options.forEach(option => keyboard.text(option).row());
  keyboard.text('Назад ↩️').row();

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
  keyboard.text('Назад ↩️').row();

  await ctx.reply(questionData.question, { reply_markup: keyboard });
}

async function showLeaderboard(ctx) {
  const topPlayers = await getLeaderboard();
  if (topPlayers.length === 0) {
    await ctx.reply('Таблица лидеров пока пуста.');
    return;
  }

  let leaderboardMessage = 'Таблица лидеров:\n';
  topPlayers.forEach(({ username, score }, index) => {
    leaderboardMessage += `${index + 1}. ${username}: ${score} очков\n`;
  });

  await ctx.reply(leaderboardMessage);
}

// Установка описаний команд
bot.api.setMyCommands([
  { command: 'start', description: 'Запуск бота' },
  { command: 'profile', description: 'Просмотр вашего профиля' }
]);

// Запуск бота
(async () => {
  await loadQuestions();
  await initDatabase();
  bot.start();
})();
