const fs = require('fs');
const uid = require('uid-safe').sync;
const {putChat, putUidUser, getUidUser} = require('../utils/db');
const messages = require('../../messages');
const logger = require("./logger");

const TG_ADMIN = parseInt(process.env.TGADMIN);

const _OFF = 'Off';
const _ON = 'On';

function setHours(date, hours, minus = true) {
    const d = new Date(date);
    let nh = d.getHours() + hours;
    if (minus) {
        nh = d.getHours() - hours;
    }
    d.setHours(nh);
    return new Date(d.getTime());
}

function includeScriptInline(ID) {
    return ' window.instantChatBotUidName = \'userId\';'
        + `window.__arsfChatIdg='${ID}';window.__arsfChatUrl = 'api.cafechat.app';` +
        'var newScript = document.createElement(\'script\');'
        + 'newScript.type = \'text/javascript\';'
        +
        'newScript.src = \'' +
        `//${process.env.APP_DOMAINNAME2}/start.js` + '\';'
        +
        'document.getElementsByTagName("head")[0].appendChild(newScript);';
}

function includeScript(ID) {
    return `<script type="text/\`+\`javascript">window.__arsfChatIdg='${ID}';window.__arsfChatUrl = 'api.cafechat.app';
window.instantChatBotUidName = 'userId'</script>
<script src="//${process.env.APP_DOMAINNAME2}/start.js" async></script>`;
}

class BotHelper {

    constructor(bot) {

        this.bot = bot;
        let c = {};
        try {
            c = JSON.parse(`${fs.readFileSync('.conf/config.json')}`);
        } catch (e) {
        }
        this.config = c;
        this.socketsLocal = {};
        this.socketsLocalUid = {};
    }

    setSockets(s) {
        this.sockets = s;
    }

    isAdmin(chatId) {
        return chatId === TG_ADMIN;
    }

    getKey(key) {
        let kkey = '';
        if (key) {
            key = +key;
            if (key < 0) {
                kkey = key * -1;
            }
            kkey = `#group-${key}:`;
        }
        return kkey;
    }

    sendTgPhoto(chatId, fileObj, text, key) {
        return this.bot.sendPhoto(chatId, fileObj, {caption: text}).catch(() => {
            return this.sendAdmin({text: `${this.getKey(key)} ${text}`, fileObj});
        });
    }

    async botMes(chatId, text, key = '', mark = false) {
        if (!this.bot) return;

        let opts = {};
        if (mark) {
            opts = {parse_mode: 'Markdown'};
        }
        const SUPER_G = process.env.SUPER_GROUP;

        const params = {
            chat_id: chatId,
            text,
            ...opts,
        };
        const sockKey = this.getSocketKey(chatId, text);
        const socketItem = this.sockets.g[sockKey];
        // console.log(sockKey, key, socketItem);

        if (SUPER_G) {
            chatId = +SUPER_G
            if (socketItem && socketItem.topId) {
                opts.message_thread_id = socketItem.topId;
            } else {
                await this.bot.createForumTopic(SUPER_G, text).then(msg => {
                    //{ message_thread_id: 9, name: '#u231 Test: test', icon_color: 7322096 }
                    console.log(msg);
                    // chatId = msg.message_thread_id;
                    opts.message_thread_id = msg.message_thread_id;
                    this.sockets.g[''].topId = msg.message_thread_id;
                    // params.message_thread_id = msg.message_thread_id;
                });
            }
        }
        console.log(params, opts, this.socketsLocal, this.socketsLocalUid, this.sockets);
        // const {chat_id, message_thread_id} = params;
        return this.bot.sendMessage(chatId, text, opts).catch((e) => {
            console.log(e);
            this.sendAdmin({text: `${this.getKey(key)} ${text}`}, process.env.TGGROUP);
        });
    }

    clearUnusedChats() {
        let chats = Object.keys(this.socketsLocal);
        let now = new Date();
        let hour = 0.1;
        for (let i = 0; i < chats.length; i += 1) {
            let skId = chats[i];
            let now1 = setHours(this.socketsLocal[skId].createdAt, hour, false);
            if (now1 < now) {
                let {userId, chatId} = this.socketsLocal[skId];
                let keyUid = `${chatId}_${userId}`;
                if (this.socketsLocalUid[keyUid]) delete this.socketsLocalUid[keyUid];
                delete this.socketsLocal[skId];
            }
        }
    }

    sendAdmin({text, fileObj}, chatId = TG_ADMIN, mark = false) {
        if (!this.bot) return;

        let opts = {};
        if (mark) {
            opts = {
                parse_mode: 'Markdown',
                disable_web_page_preview: true,
            };
        }
        if (chatId === null) {
            chatId = TG_ADMIN;
        }
        if (chatId === TG_ADMIN) {
            text = `service: ${text}`;
        }
        if (fileObj) {
            return this.bot.sendPhoto(chatId, fileObj, {caption: text}).catch((e) => {
                logger(e)
            });
        }
        return this.bot.sendMessage(chatId, text, opts).catch((e) => {
            logger(e)
        });
    }

    disDb() {
        this.db = false;
    }

    parseConfig(params) {
        let content = '';
        let param = '';
        let c = params.replace(' _content', '_content').split(/\s/);
        if (c.length === 2) {
            param = c[0];
            content = c[1].replace(/~/g, ' ');
        } else {
            param = c[0];
            if (this.config[param] === _ON) {
                content = _OFF;
            } else {
                content = _ON;
            }
        }
        return {param, content};
    }

    toggleConfig(msg) {
        let params = msg.text.replace('/config', '').trim();
        if (!params || !this.isAdmin(msg.chat.id)) {
            return Promise.resolve('no param or forbidden');
        }

        let {param, content} = this.parseConfig(params);
        this.config[param] = content;
        fs.writeFileSync('.conf/config.json', JSON.stringify(this.config));
        return this.botMes(TG_ADMIN, content);
    }

    forward(mid, from, to) {
        return this.bot.forwardMessage(to, from, mid);
    }

    async processUpdateMessage({chat, text}) {
        let ID = '';
        let result = {};
        const str = text.match('-?[0-9]+');
        const strTg = text.match(' tg-?[0-9]+');
        if (str && str[0]) {
            ID = +str[0];

            if (strTg) {
                result.text = messages.startChat();
                await this.localSockSend(ID, 'joined to chat', null, chat.id);
            } else {
                if (ID < 0) ID *= -1;

                let codes = [];
                codes.push(includeScript(ID));
                codes.push(includeScriptInline(ID));
                result.text = messages.startCode(codes) +
                    `\n\n ${messages.startTg(ID)}\n\n \`\`\`*\`\`\`instantChatBotUidName - unique user id`;
                result.mode = 'Markdown';
            }
        }
        return result;
    }

    async localSockReply(chatId, txt, uidID, userId = false) {
        let key = `${chatId}_${uidID}`;
        let msg = ``;
        if (userId) {
            let keyUid = `${chatId}_${userId}`;
            let uidFromGroup = this.socketsLocalUid[keyUid];
            if (uidFromGroup) {
                return this.localSockSend(chatId, txt, uidFromGroup, userId);
            }
            msg = messages.startChat();
            await this.localSockSend(chatId, 'joined to chat', null, userId);
        } else {
            let userFromDb = await getUidUser(chatId, uidID);
            if (userFromDb) {
                this.addLocal({
                    userId: userFromDb.u,
                    uid: uidID,
                    key: uidID,
                    chatId,
                });
            }
            if (this.socketsLocal[key]) {
                msg = `#tgchat${chatId}:\n${txt}`;
                let {userId} = this.socketsLocal[key];
                return this.botMes(userId, msg, chatId);
            }
            msg = messages.notFound();
        }
        return this.botMes(userId || chatId, msg, chatId);
    }

    addLocal({chatId, userId, key}) {
        let keyUid = `${chatId}_${key}`;
        if (this.socketsLocal[keyUid]) return;
        let keyUser = `${chatId}_${userId}`;
        this.socketsLocalUid[keyUser] = key;
        let createdAt = new Date();

        this.socketsLocal[keyUid] = {
            createdAt,
            uid: key,
            key,
            userId,
            chatId,
        };
    }

    async localSockSend(chatId, txt, uidID, userId = false) {
        if (!uidID) {
            uidID = uid(5);
            uidID = uidID.replace(/-/g, '');
            await putUidUser({g: chatId, u: userId, txt}, uidID);
        }
        this.addLocal({
            uid: uidID,
            key: uidID,
            userId,
            chatId,
        });
        let msg = `#tgu${uidID}:\n${txt}`;
        return this.botMes(chatId, msg, chatId);
    }

    getSocketKey(chatId, rplText) {
        let uid = rplText.match(/#u(.*?):/);
        if (uid && uid[1]) uid = uid[1];

        let guid = rplText.match(/#group(.*?):/);
        if (guid && guid[1]) {
            chatId = guid[1];
        }
        chatId = `${chatId}`.replace('--', '-');
        let key = +chatId;
        if (key < 0) {
            key *= -1;
            key = `${key}_chat_${uid}`.replace('--', '-');
        }
        return key
    }

    async sockSend(chatId, txt, rplText) {
        if (!rplText) return;
        let luid = rplText.match(/#tgu(.*?):/);
        if (luid && luid[1]) {
            luid = luid[1];
            return this.localSockReply(chatId, txt, luid);
        }
        let tgChat = rplText.match(/#tgchat(.*?):/);
        if (tgChat && tgChat[1]) {
            tgChat = tgChat[1];
            return this.localSockReply(tgChat, txt, luid, chatId);
        }
        let uid = rplText.match(/#u(.*?):/);
        if (uid && uid[1]) {
            uid = uid[1];
        }
        let guid = rplText.match(/#group(.*?):/);

        if (guid && guid[1]) {
            chatId = guid[1];
        }
        chatId = `${chatId}`.replace('--', '-');
        let key = +chatId;
        try {
            if (key < 0) {
                key *= -1;
                key = `${key}_chat_${uid}`.replace('--', '-');
                if (this.sockets.g[key]) {
                    this.sockets.g[key].ws.send(txt);
                }
            } else {
                if (this.sockets.u[key]) {
                    this.sockets.u[key].ws.send(txt);
                }
            }
            if (txt && txt.match(/#get/)) {
                //
            } else {
                await putChat({message: txt, sender: 'admin', uid}, key).catch(
                    () => {
                    });
            }
        } catch (e) {
            console.log(e);
        }
    }

    broadCast = () => {
        let chatsKeys = Object.keys(this.sockets.g);
        for (let i = 0; i < chatsKeys.length; i += 1) {
            let chat = this.sockets.g[chatsKeys[i]];
            if (chat && chat.ws) {
                chat.ws.send('hej!');
            }
        }
    }
}

module.exports = BotHelper;
