const fs = require('fs');
var uid = require('uid-safe').sync;
const { putChat, putUidUser, getUidUser } = require('../utils/db');
const messages = require('../../messages/format');
const TGADMIN = parseInt(process.env.TGADMIN);
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
  return ` <script src="//${process.env.APP_DOMAINNAME2}/start.js" async></script>
<script type="text/`+`javascript">window.__arsfChatIdg='${ID}';window.__arsfChatUrl = 'api.cafechat.app';
window.instantChatBotUidName = 'userId'</script>`;
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
    return chatId === TGADMIN;
  }

  botMes(chatId, text, key, mark = false) {
    let opts = {};
    if (mark) {
      opts = { parse_mode: 'Markdown' };
    }
    let kkey = '';
    if (key) {
      key = +key;
      if (key < 0) {
        kkey = key * -1;
      }
      kkey = `#group-${key}:`;
    }
    return this.bot.sendMessage(chatId, text, opts).
      catch(e => {
        this.sendAdmin(`${kkey} ${text}`, process.env.TGGROUP);
      });
  }

  clearUnusedChats() {
    let chats = Object.keys(this.socketsLocal);
    let now = new Date();
    let hour = 1;
    hour = 0.1;
    for (let i = 0; i < chats.length; i += 1) {
      let skId = chats[i];
      let now1 = setHours(this.socketsLocal[skId].createdAt, hour, false);
      if (now1 < now) {
        let { userId, chatId } = this.socketsLocal[skId];
        let keyUid = `${chatId}_${userId}`;
        if (this.socketsLocalUid[keyUid]) delete this.socketsLocalUid[keyUid];
        delete this.socketsLocal[skId];
      }
    }
  }

  sendAdmin(text, chatId = TGADMIN, mark = false) {
    let opts = {};
    if (mark) {
      opts = {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      };
    }
    if (chatId === null) {
      chatId = TGADMIN;
    }
    if (chatId === TGADMIN) {
      text = `service: ${text}`;
    }
    return this.bot.sendMessage(chatId, text, opts);
  }

  togglecConfig(msg) {
    let params = msg.text.replace('/cconfig', '').trim();
    if (!params || !this.isAdmin(msg.chat.id)) {
      return Promise.resolve('no param or forbidden');
    }
    let { param, content } = this.parseConfig(params);
    let c = {};
    c[param] = content;
    fs.writeFileSync(`.conf/custom/${param}.json`, JSON.stringify(c));
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
    return { param, content };
  }

  toggleConfig(msg) {
    let params = msg.text.replace('/config', '').trim();
    if (!params || !this.isAdmin(msg.chat.id)) {
      return Promise.resolve('no param or forbidden');
    }

    let { param, content } = this.parseConfig(params);
    this.config[param] = content;
    fs.writeFileSync('.conf/config.json', JSON.stringify(this.config));
    return this.botMes(TGADMIN, content);
  }

  disDb() {
    this.db = false;
  }

  forward(mid, from, to) {
    return this.bot.forwardMessage(to, from, mid);
  }

  async processUpdateMessage({ chat, text }) {
    let ID = '';
    let result = {};
    const str = text.match('-?[0-9]+');
    const strTg = text.match(' tg-?[0-9]+');
    if (str && str[0]) {
      ID = +str[0];
      let par = 'g';
      if (strTg) {
        result.text = messages.startChat();
        await this.localSockSend(ID, 'joined to chat', null, chat.id);
      } else {
        if (ID > 0) par = 'u'; else {
          ID *= -1;
        }
        let codes = [];
        codes.push(includeScript(ID));
        codes.push(includeScriptInline(ID));
        result.text = messages.startCode(codes) +
          `\n\n ${messages.startTg(
            ID)}\n\n \`\`\`*\`\`\`instantChatBotUidName - unique user id`;
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
        let { userId } = this.socketsLocal[key];
        return this.botMes(userId, msg, chatId);
      }
      msg = messages.notFound();
    }
    return this.botMes(userId || chatId, msg, chatId);
  }

  addLocal({ chatId, userId, key }) {
    let keyUid = `${chatId}_${key}`;
    if (this.socketsLocal[keyUid]) return;
    let keyUser = `${chatId}_${userId}`;
    this.socketsLocalUid[keyUser] = key;
    let createdAt = new Date();
    const obj = {
      createdAt,
      uid: key,
      key,
      userId,
      chatId,
    };
    this.socketsLocal[keyUid] = obj;
  }

  async localSockSend(chatId, txt, uidID, userId = false) {
    if (!uidID) {
      uidID = uid(5);
      uidID = uidID.replace(/-/g, '');
      await putUidUser({ g: chatId, u: userId, txt }, uidID);
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
    let key = +chatId;
    try {
      if (key < 0) {
        key *= -1;
        key = `${key}_chat_${uid}`;
        if (this.sockets.g[key]) {
          this.sockets.g[key].ws.send(txt);
        }
      } else {
        if (this.sockets.u[key]) {
          this.sockets.u[key].ws.send(txt);
        }
      }
      await putChat({ message: txt, sender: 'admin', uid }, key).catch(
        () => {});
    } catch (e) {
      console.log(e);
    }
  }
}

module.exports = BotHelper;
