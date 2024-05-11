require('dotenv').config();
const { Bot, GrammyError, HttpError, Keyboard, InlineKeyboard } = require('grammy');

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
    .row()
  await ctx.reply(
    'Привет! Я помогу тебе подготовиться к собеседованию. Напиши /start, чтобы начать.'
  );
  await ctx.reply('С чего начнем? Выбирай тему👇', {
    reply_markup: startKeyboard,
  });
});

//Обработчик ошибок
bot.catch((err) => {
  const ctx = err.ctx;
  logger.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;

  if (e instanceof GrammyError) {
    console.error("Error in request:", e.description);
  } else if (e instanceof HttpError) {
    console.error("Could not contact Telegram:", e);
  } else {
    console.error("Unknown error:", e);
  }
  });

bot.start();