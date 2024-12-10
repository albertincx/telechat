const fs = require('fs');
const express = require('express');
const BotHelper = require('../utils/bot');
const chat = require('./chat');
const db = require('../utils/db');
const logger = require("../utils/logger");

const router = express.Router();
const filepath = 'count.txt';
if (!fs.existsSync(filepath)) fs.writeFileSync(filepath, '0');

let startCnt = parseInt(fs.readFileSync('count.txt'), 10);

module.exports = (bot, conn) => {
    const botHelper = new BotHelper(bot.telegram);
    if (conn) conn.on('error', (err) => {
        botHelper.disDb();
    });

    bot.command('config', ({message}) => {
        if (botHelper.isAdmin(message.chat.id)) {
            botHelper.toggleConfig(message);
        }
    });

    bot.command('showconfig', ({message, reply}) => {
        if (botHelper.isAdmin(message.chat.id)) {
            let c = JSON.stringify(botHelper.config);
            c = `${c} db ${botHelper.db}`;
            reply(c);
        }
    });

    bot.command('stat', ({message, reply}) => {
        if (botHelper.isAdmin(message.chat.id)) {
            db.stat().then(r => reply(r));
        }
    });

    bot.command('statuids', ({message, reply}) => {
        if (botHelper.isAdmin(message.chat.id)) {
            db.stat('uids').then(r => reply(r));
        }
    });

    bot.command('cleardb', ({message, reply}) => {
        if (botHelper.isAdmin(message.chat.id)) {
            return db.clear(message).then(r => reply(r));
        }
    });

    bot.command('srv', ({message}) => {
        if (botHelper.isAdmin(message.from.id)) {
            botHelper.sendAdmin({text: `srv: ${JSON.stringify(message)}`});
        }
    });

    bot.command(/^config/, ({message}) => {
        if (botHelper.isAdmin(message.chat.id)) {
            botHelper.toggleConfig(message);
        }
    });

    chat(bot, botHelper);

    bot.launch();

    if ((startCnt % 10) === 0 || global.isDev) {
        botHelper.sendAdmin({text: `started ${startCnt} times`});
    }
    startCnt += 1;
    if (startCnt >= 500) startCnt = 0;
    fs.writeFileSync(filepath, `${startCnt}`);

    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'))
    process.once('SIGTERM', () => bot.stop('SIGTERM'))

    return {router, botHelper};
};
