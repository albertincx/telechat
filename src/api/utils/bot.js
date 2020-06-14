const fs = require('fs');
const { putChat } = require('../utils/db');
const TGADMIN = parseInt(process.env.TGADMIN);
const _OFF = 'Off';
const _ON = 'On';

class BotHelper {

  constructor(bot) {

    this.bot = bot;
    let c = {};
    try {
      c = JSON.parse(`${fs.readFileSync('.conf/config.json')}`);
    } catch (e) {
    }
    this.config = c;
  }

  setSockets(s) {
    this.sockets = s;
  }

  isAdmin(chatId) {
    return chatId === TGADMIN;
  }

  botMes(chatId, text, key, mark = true) {
    let opts = {};
    if (mark) {
      opts = { parse_mode: 'Markdown' };
    }
    let kkey = '';
    if (key) {
      key = +key
      if (key < 0) {
        kkey = key * -1;
      }
      kkey = `#group${key}:`;
    }
    return this.bot.sendMessage(chatId, text, opts).
      catch(e => {
        this.sendAdmin(`${kkey} ${text}`, process.env.TGGROUP);
      });
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
    return this.botMes(TGADMIN, content, false);
  }

  sendError(e, text = '') {
    e = `error: ${JSON.stringify(e)} ${e.toString()} ${text}`;
    return this.sendAdmin(e);
  }

  disDb() {
    this.db = false;
  }

  async sockSend(chatId, txt, rplText) {
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
        key = `${key}`;
        if (this.sockets.g[key]) {
          this.sockets.g[key].ws.send(txt);
        }
      } else {
        if (this.sockets.u[key]) {
          this.sockets.u[key].ws.send(txt);
        }
      }
      await putChat({ message: txt, sender: 'admin', uid }, key);
    } catch (e) {
      console.log(e);
    }
  }
}

module.exports = BotHelper;
