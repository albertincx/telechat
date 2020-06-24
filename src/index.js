const { NOBOT } = require('./config/vars');
const mongoose = require('./config/mongoose');
const botroute = require('./api/routes/botroute');
const conn = mongoose.connect();
let botInstance;
if (!NOBOT && process.env.TBTKN) {
  botInstance = require('./config/bot');
  if (botInstance) {
    const { bot } = botroute(botInstance, conn);
    require('./ws.js')(bot)
  }
}
