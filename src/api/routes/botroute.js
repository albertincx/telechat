const fs = require('fs');
const express = require('express');
<<<<<<< HEAD

=======
const WebSocket = require('ws');
>>>>>>> 44d5633fd3a2eac5042fed894b309cbf9633daf7
const BotHelper = require('../utils/bot');
const format = require('./chat');
const db = require('../utils/db');

const router = express.Router();
const filepath = 'count.txt';
if (!fs.existsSync(filepath)) fs.writeFileSync(filepath, 0);

let startCnt = parseInt(fs.readFileSync('count.txt'), 10);
<<<<<<< HEAD

module.exports = (bot, conn) => {
  const botHelper = new BotHelper(bot.telegram);
=======
const sockets = { g: {}, u: {} };
module.exports = (bot, conn) => {
  const botHelper = new BotHelper(bot.telegram, sockets);
>>>>>>> 44d5633fd3a2eac5042fed894b309cbf9633daf7
  if (conn) conn.on('error', (err) => {
    botHelper.disDb();
  });
  bot.command('config', ({ message }) => {
    if (botHelper.isAdmin(message.chat.id)) {
      botHelper.toggleConfig(message);
    }
  });

  bot.command('cconfig', ({ message }) => {
    if (botHelper.isAdmin(message.chat.id)) {
      botHelper.togglecConfig(message);
    }
  });

  bot.command('showconfig', ({ message, reply }) => {
    if (botHelper.isAdmin(message.chat.id)) {
      let c = JSON.stringify(botHelper.config);
      c = `${c} db ${botHelper.db}`;
      reply(c);
    }
  });

  bot.command('stat', ({ message, reply }) => {
    if (botHelper.isAdmin(message.chat.id)) {
      db.stat().then(r => reply(r));
    }
  });

  bot.command('cleardb', ({ message, reply }) => {
    if (botHelper.isAdmin(message.chat.id)) {
      return db.clear(message).then(r => reply(r));
    }
  });

  bot.command('srv', ({ message }) => {
    if (botHelper.isAdmin(message.from.id)) {
      botHelper.sendAdmin(`srv: ${JSON.stringify(message)}`);
    }
  });

  format(bot, botHelper);
  bot.launch();

  if ((startCnt % 10) === 0 || process.env.DEV) {
    botHelper.sendAdmin(`started ${startCnt} times`);
  }
  startCnt += 1;
  if (startCnt >= 500) startCnt = 0;

<<<<<<< HEAD
  
=======
  const wss = new WebSocket.Server({ port: 8080 });
  global.arsfChatSocket = 'localhost:8080';

  wss.on('connection', ws => {
    ws.on('message', message => {
      let messageObj = {};
      try {
        messageObj = JSON.parse(message);
        if (messageObj.g) {
          let key = `${messageObj.g}`
          if (!sockets.g[key]) {
            sockets.g[key] = ws;
            ws.on('close', () => {
              delete sockets.g[key];
            });
          }
          botHelper.botMes(+messageObj.g * -1, messageObj.message);
        }
      } catch (e) {
        botHelper.sendAdmin(message);
      }
    });
    ws.send(JSON.stringify({ message: 'Hi' }));
  });
>>>>>>> 44d5633fd3a2eac5042fed894b309cbf9633daf7
  fs.writeFileSync(filepath, startCnt);
  return { router, bot: botHelper };
};
