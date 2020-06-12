Promise = require('bluebird'); // eslint-disable-line no-global-assign
const { NOBOT, PORT, blacklistFile } = require('./config/vars');
const mongoose = require('./config/mongoose');
const app = require('./config/express');
const botroute = require('./api/routes/botroute');
const api = require('./api/routes/api');
const conn = mongoose.connect();

app.get('/', (req, res) => res.send('use telegram bot <a href="tg://resolve?domain=CorsaBot">@CorsaBot</a>'));
app.use(api);
let botInstance;
if (!NOBOT && process.env.TBTKN) {
  botInstance = require('./config/bot');
  if (botInstance) {
    const { router, bot } = botroute(botInstance, conn);
    bot.setBlacklist(blacklistFile);
    app.use('/bot', router);
  }
}
app.listen(PORT, () => console.info(`server started on port ${PORT}`));
module.exports = app;
