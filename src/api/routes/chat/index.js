const messages = require('../../../messages');
const {LOST_WS_ERROR} = require("../../constants");
const logger = require("../../utils/logger");

let username = process.env.TBTUSERNAME;

const support = (ctx) => {
    const sup = [];
    for (let i = 0; i < 5; i += 1) {
        let sl = process.env[`SUP_LINK${i || ''}`];
        if (sl) sup.push(sl);
    }
    ctx.reply(messages.support(sup), {
        disable_web_page_preview: true,
    }).catch(() => {
    });
};

const startOrHelp = async (ctx, botHelper) => {
    const {message, payload, ...msg} = ctx;
    const opts = {
        disable_web_page_preview: true
    };

    const isPrivate = message.chat.type === 'private';

    let text = '';

    if (isPrivate && !payload) {
        ctx.reply(messages.startEmpty(), opts).catch((e) => {
            console.log(e);
        });
        return;
    }

    let isStartMessage = true;
    try {
        if (msg.update && msg.update.message) {
            const result = await botHelper.processUpdateMessage(msg.update.message);
            if (result.text) {
                text = result.text;
                if (result.mode) {
                    opts.parse_mode = result.mode;
                }
                isStartMessage = false;
            } else {
                if (msg.update.message.chat.id < 0) {
                    isStartMessage = false;
                    text = messages.start(username, msg.update.message.chat);
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
        ctx.reply(text, opts).catch((e) => {
            console.log(e);
        });
    }
};

/** @type BotHelper */
const closeTopic = (ctx, botHelper) => {
    const {chat, message_thread_id} = ctx.message
    botHelper.closeTopic(chat.id, message_thread_id);
    return ctx.reply('Topic closed').catch((e) => {
        console.log(e);
    });
}

/** @type BotHelper */
const deleteTopic = (ctx, botHelper) => {
    const {chat, message_thread_id} = ctx.message
    return botHelper.deleteTopic(chat.id, message_thread_id);
}

module.exports = (bot, botHelper) => {
    bot.command('start', ctx => startOrHelp(ctx, botHelper));
    bot.command('support', support);
    bot.command('closetopic', ctx => closeTopic(ctx, botHelper));
    bot.command('deletetopic', ctx => deleteTopic(ctx, botHelper));
    const onMessage = async (ctx) => {
        let {message: msg} = ctx;
        let {reply_to_message} = msg;
        let document = msg.document;
        let rpl = reply_to_message;
        if (!document && rpl) document = rpl.document;
        const {chat: {id: chatId}} = msg;
        let {text} = msg;
        if (rpl) {
            // const sKey = botHelper.getSocketKey(1, text);
            if (!document) {
                const error = await botHelper.sockSend(chatId, text, rpl);
                if (error === LOST_WS_ERROR) {
                    ctx.reply('User disconnected, your message saved', {reply_to_message_id: msg.message_id}).catch((e) => {
                        logger(e)
                    });
                }

                return;
            }
        }

        if (msg.new_chat_participant || msg.left_chat_participant ||
            msg.group_chat_created) {
            let s = msg.left_chat_participant ? 'left' : 'add';
            if ((msg.new_chat_participant && msg.new_chat_participant.username ===
                username) || msg.group_chat_created) {
                await ctx.reply(messages.start(username, chatId)).catch(
                    () => {
                    });
            }
            botHelper.sendAdmin({text: `support ${s}${JSON.stringify(msg)}`});
        }
    };
    bot.hears(/.*/, (ctx) => onMessage(ctx));
    bot.on('message', ctx => onMessage(ctx));
};
