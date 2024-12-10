const {NO_BOT} = require('./config/vars');
const mongoose = require('./config/mongoose');
const botroute = require('./api/routes/botroute');
const initCron = require('./cron');
const BotHelper = require('./api/utils/bot');
const conn = mongoose.connect();
let botInstance, bot;

if (!NO_BOT && process.env.TBTKN) {
    botInstance = require('./config/bot');
    if (botInstance) {
        const {botHelper} = botroute(botInstance, conn);
        bot = botHelper;
        initCron(bot);
    }
} else {
    bot = new BotHelper(null);
}
require('./ws.js')(bot);

