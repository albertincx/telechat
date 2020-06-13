const url = require('url');
const messages = require('../../../messages/format');
const keyboards = require('./keyboards');
const buttons = require('../../../config/buttons');

const logger = require('../../utils/logger');
const { log } = require('../../utils/db');
const { validRegex } = require('../../../config/config.json');

const FILESLAVE = process.env.FILESLAVE;
let username = process.env.TBTUSERNAME;

const getLinkFromEntity = (entities, txt) => {
  let links = [];
  for (let i = 0; i < entities.length; i += 1) {
    if (entities[i].url) {
      links.push(entities[i].url);
      continue;
    }
    if (entities[i].type === 'url') {
      let checkFf = txt.substr(0, entities[i].length + 1).match(/\[(.*?)\]/);
      if (!checkFf) {
        links.push(txt.substr(entities[i].offset, entities[i].length));
      }
    }
  }
  return links;
};

function getLink(links) {
  let lnk = links[0];
  for (let i = 1; i < links.length; i += 1) {
    if (links[i].startsWith(lnk)) {
      lnk = links[i];
    }
  }
  return lnk;
}

function getAllLinks(text) {
  const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/ig;
  return text.match(urlRegex) || [];
}

const support = ({ reply }) => {
  const sup = [];
  for (let i = 0; i < 5; i += 1) {
    let sl = process.env[`SUP_LINK${i || ''}`];
    if (sl) sup.push(sl);
  }
  reply(messages.support(sup), {
    disable_web_page_preview: true,
  }).catch(() => {});
};

const back = ({ reply }) => {
  reply(messages.menu(), keyboards.start()).catch(() => {});
};

const startOrHelp = ({ reply, ...msg }) => {
  //console.log(reply);
  const opts = {};

  let code = '';
  if (msg.update && msg.update.message) {
    // console.log(msg.update, msg.update.message.entities);
    let ID = '';
    const str = msg.update.message.text.match('-?[0-9]+');
    if (str && str[0]) {
      ID = +str[0];
      let par = 'g';
      if (ID > 0) par = 'u'; else {
        ID *= -1;
      }
      code = `<script src="//${process.env.APP_DOMAINNAME2}/app/chatbot?${par}=${ID}" async></script>`;
      opts.parse_mode = 'Markdown';
    }
  }

  reply(code ? messages.startCode(code) : messages.startEmpty(), opts).catch(
    () => {});
};
const createIv = ({ reply }) => {
  reply(messages.createIv(), keyboards.createIv()).catch(() => {});
};
let txtDocMessage = messages.createIvTxt();
const createIvTxt = ({ reply }) => {
  const opts = {
    reply_markup: { force_reply: true },
  };
  console.log(opts);
  reply(txtDocMessage, opts).catch(() => {});
};

module.exports = (bot, botHelper) => {
  bot.command(['/start', buttons.help.command], startOrHelp);
  bot.hears(buttons.help.label, startOrHelp);
  bot.hears(buttons.back.label, back);
  bot.hears(buttons.support.label, support);
  bot.hears(buttons.create.label, createIv);
  bot.hears(buttons.createTxt.label, createIvTxt);
  bot.command(buttons.support.command, support);
  bot.command(buttons.create.command, createIv);
  bot.command(buttons.createTxt.command, createIvTxt);

  bot.action(/.*/, async (ctx) => {
    console.log(ctx);
    const [data] = ctx.match;
    const s = data === 'no_img';
    if (s) {
      const { message } = ctx.update.callback_query;
      const { message_id, chat, entities } = message;
      const rabbitMes = { message_id, chatId: chat.id, link: entities[1].url };
      return;
    }
    const resolveDataMatch = data.match(/^r_([0-9]+)_([0-9]+)/);
    if (resolveDataMatch) {
      let [, msgId, userId] = resolveDataMatch;
      const extra = { reply_to_message_id: msgId };
      let error = '';
      try {
        await bot.telegram.sendMessage(userId, messages.resolved(), extra);
      } catch (e) {
        error = JSON.stringify(e);
      }
      const { update: { callback_query } } = ctx;
      const { message: { text, message_id }, from } = callback_query;
      let RESULT = `${text}\nResolved! ${error}`;
      await bot.telegram.editMessageText(from.id, message_id, null, RESULT).
        catch(console.log);
    }
  });

  const addToQueue = async ({ message: msg, reply }) => {
    if (FILESLAVE) {
      return;
    }
    logger(msg);

    let { reply_to_message, entities, caption_entities } = msg;
    let document = msg.document;
    let rpl = reply_to_message;
    if (!document && rpl) document = rpl.document;
    const { chat: { id: chatId }, caption } = msg;
    let { text } = msg;
    if (rpl) {
      if (rpl.text === txtDocMessage) {
        document = msg.text;
      } else if (!document) {
        console.log('rpl', rpl);
        botHelper.sockSend(chatId, text)
        return;
      }
    }

    const isAdm = botHelper.isAdmin(chatId);

    if (msg.new_chat_participant || msg.left_chat_participant) {
      let s = msg.left_chat_participant ? 'left' : 'add';
      if (msg.new_chat_participant && msg.new_chat_participant.username ===
        username) {
        const res = await reply(messages.start(username, chatId)).catch(
          () => {}) ||
          {};
      }
      botHelper.sendAdmin(`support ${s}${JSON.stringify(msg)}`);
      return;
    }

    if (document) {
      const res = await reply('Wait...').catch(() => {}) ||
        {};
      const message_id = res && res.message_id;
      return;
    }

    if (caption) {
      text = caption;
      if (caption_entities) entities = caption_entities;
    }
    if (msg && text) {
      const force = isAdm && botHelper.checkForce(text);
      let links = getAllLinks(text);
      try {
        let link = links[0];
        if (!link && entities) {
          links = getLinkFromEntity(entities, text);
        }
        link = getLink(links);
        if (!link) return;
        const parsed = url.parse(link);
        if (link.match(/^(https?:\/\/)?(www.)?google/)) {
          const l = link.match(/url=(.*?)($|&)/);
          if (l && l[1]) link = decodeURIComponent(l[1]);
        }
        if (link.match(new RegExp(validRegex))) {
          if (botHelper.db !== false) {
            await log({ link, type: 'return' });
          }
          reply(messages.showIvMessage('', link, link),
            { parse_mode: 'Markdown' });
          return;
        }
        if (!parsed.pathname) {
          if (botHelper.db !== false) {
            await log({ link, type: 'nopath' });
          }
          return;
        }
        const res = await reply('Waiting for instantView...').catch(() => {}) ||
          {};
        const message_id = res && res.message_id;
        if (!message_id) throw new Error('blocked');
        const rabbitMes = { message_id, chatId, link };
        if (force) {
          rabbitMes.force = force;
        }
      } catch (e) {
        botHelper.sendError(e);
      }
    }
  };
  bot.hears(/.*/, (ctx) => addToQueue(ctx));
  bot.on('message', ({ update, reply }) => addToQueue({ ...update, reply }));
};
