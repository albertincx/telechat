const messages = require('../../../messages/format');
const keyboards = require('./keyboards');
const buttons = require('../../../config/buttons');

let username = process.env.TBTUSERNAME;

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

const startOrHelp = async ({ reply, message, ...msg }, botHelper) => {
  const opts = {
    disable_web_page_preview: true
  };
  let introtxt = '';
  if (process.env.POST_LINK) introtxt = `\n Intro ${process.env.POST_LINK}`;
  let text = messages.startEmpty(introtxt);
  let isStartMessage = true;
  try {
    if (msg.update && msg.update.message) {
      const result = await botHelper.processUpdateMessage(
        msg.update.message);
      if (result.text) {
        text = result.text;
        if (result.mode) {
          opts.parse_mode = result.mode;
        }
        isStartMessage = false;
      } else {
        if (msg.update.message.chat.id < 0) {
          isStartMessage = false;
          text = messages.start(username, msg.update.message.chat.id);
        }
      }
    }
  } catch (e) {
    console.log(e);
  }
  if (isStartMessage) {
    botHelper.forward(2, -1001487355894, message.from.id).catch(console.log);
    botHelper.sendAdmin({text: `${JSON.stringify(message.from)}`});
  } else {
    reply(text, opts).catch((e) => console.log(e));
  }
};

const createIv = ({ reply }) => {
  reply(messages.createIv(), keyboards.createIv()).catch(() => {});
};
let txtDocMessage = messages.createIvTxt();
const createIvTxt = ({ reply }) => {
  const opts = {
    reply_markup: { force_reply: true },
  };
  reply(txtDocMessage, opts).catch(() => {});
};

module.exports = (bot, botHelper) => {
  bot.command(['/start', buttons.help.command],
    ctx => startOrHelp(ctx, botHelper));
  bot.hears(buttons.help.label, startOrHelp);
  bot.hears(buttons.back.label, back);
  bot.hears(buttons.support.label, support);
  bot.hears(buttons.create.label, createIv);
  bot.hears(buttons.createTxt.label, createIvTxt);
  bot.command(buttons.support.command, support);
  bot.command(buttons.create.command, createIv);
  bot.command(buttons.createTxt.command, createIvTxt);

  const onMessage = async ({ message: msg, reply }) => {
    let { reply_to_message } = msg;
    let document = msg.document;
    let rpl = reply_to_message;
    if (!document && rpl) document = rpl.document;
    const { chat: { id: chatId }, caption } = msg;
    let { text } = msg;
    if (rpl) {
      if (rpl.text === txtDocMessage) {
      } else if (!document) {
        await botHelper.sockSend(chatId, text, rpl.text);
        return;
      }
    }

    if (msg.new_chat_participant || msg.left_chat_participant ||
      msg.group_chat_created) {
      let s = msg.left_chat_participant ? 'left' : 'add';
      if ((msg.new_chat_participant && msg.new_chat_participant.username ===
        username) || msg.group_chat_created) {
        await reply(messages.start(username, chatId)).catch(
          () => {});
      }
      botHelper.sendAdmin({text: `support ${s}${JSON.stringify(msg)}`});
    }
  };
  bot.hears(/.*/, (ctx) => onMessage(ctx));
  bot.on('message', ({ update, reply }) => onMessage({ ...update, reply }));
};
