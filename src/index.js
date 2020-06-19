//Promise = require('bluebird'); // eslint-disable-line no-global-assign
const { NOBOT, PORT, blacklistFile } = require('./config/vars');
const mongoose = require('./config/mongoose');
const app = require('./config/express');
const botroute = require('./api/routes/botroute');
const api = require('./api/routes/api');
const conn = mongoose.connect();
if(process.env.FILESLAVE) {
  app.get('/', (req, res) => res.send('use telegram bot <a href="tg://resolve?domain=InstantChatBot">@InstantChatBot</a>'));
  app.use(api);
  app.listen(PORT, () => console.info(`server started on port ${PORT}`));
} else {
  let botInstance;
  if (!NOBOT && process.env.TBTKN) {
    botInstance = require('./config/bot');
    if (botInstance) {
      const { bot } = botroute(botInstance, conn);
      require('./ws.js')(bot)
    }
  }
}

module.exports = app;
