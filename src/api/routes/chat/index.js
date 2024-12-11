const messages = require('../../../messages');
const {LOST_WS_ERROR} = require("../../constants");

let username = process.env.TBTUSERNAME;

let IV_CHAN_MID = 3;
let IV_CHAN_ID = 1001487355894;

const support = async (ctx, botHelper) => {
    let system = JSON.stringify(ctx.message.from);
    const {
        chat: {id: chatId},
    } = ctx.message;

    try {
        if (!Number.isNaN(IV_CHAN_MID)) {
            botHelper
                .forwardMes(IV_CHAN_MID, IV_CHAN_ID * -1, chatId)
                .catch(() => {
                });
        }
    } catch (e) {
        system = `${e}${system}`;
    }
    console.log(Object.keys(botHelper));
    try {
        botHelper && botHelper.sendAdmin(`support ${system}`);
    } catch (e) {
        console.log(e);
    }
};

const startOrHelp = async (ctx, botHelper) => {
    const {message, payload, ...msg} = ctx;
    const opts = {
        disable_web_page_preview: true,
    };

    const isPrivate = message.chat.type === 'private';

    let text = '';

    if (isPrivate && !payload) {
        ctx.reply(messages.startEmpty(), {
            ...opts,
            parse_mode: 'Markdown',
        }).catch((e) => {
            console.log(e);
        });
        botHelper.sendAdmin(`${JSON.stringify(message.from)}`);
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
        botHelper.sendAdmin(`${JSON.stringify(message.from)}`);
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
    bot.command('support', ctx => support(ctx, botHelper));
    bot.command('closetopic', ctx => closeTopic(ctx, botHelper));
    bot.command('deletetopic', ctx => deleteTopic(ctx, botHelper));
    const onMessage = async (ctx) => {
        let {message: msg} = ctx;
        // console.log(msg);
        if (
            msg &&
            msg.text &&
            msg.text.match(/(createBroadcast|startBroadcast)/)
        ) {
            botHelper.startBroad(ctx)
            return;
        }
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
                    botHelper.sendReaction(chatId, msg.message_id, [
                        {
                            type: 'emoji',
                            emoji: '👌',
                        }
                    ]);
                    // ctx.reply('User disconnected, your message saved', {reply_to_message_id: msg.message_id}).catch((e) => {
                    //     logger(e)
                    // });
                }

                return;
            }
        }

        if (msg.new_chat_participant || msg.left_chat_participant ||
            msg.group_chat_created) {
            let s = msg.left_chat_participant ? 'left' : 'add';
            if ((msg.new_chat_participant && msg.new_chat_participant.username ===
                username) || msg.group_chat_created) {
                await ctx.reply(messages.start(username, msg.chat)).catch(
                    () => {
                    });
            }
            botHelper.sendAdmin(`support ${s}${JSON.stringify(msg)}`);
        }
    };
    bot.hears(/.*/, (ctx) => onMessage(ctx));
    bot.on('message', ctx => onMessage(ctx));
};
