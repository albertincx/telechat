const { NOBOT } = require('./config/vars');
const mongoose = require('./config/mongoose');
const botroute = require('./api/routes/botroute');
const initCron = require('./cron');
const BotHelper = require('./api/utils/bot');
const conn = mongoose.connect();
let botInstance, bot;

if (!NOBOT && process.env.TBTKN) {
  botInstance = require('./config/bot');
  if (botInstance) {
    const { bot: bh } = botroute(botInstance, conn);
    bot = bh;
  }
} else {
  bot = new BotHelper(null);
}
require('./ws.js')(bot);
initCron(bot);
