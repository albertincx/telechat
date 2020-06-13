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

  checkForce(txt) {
    const m = txt.match(
      /(pcache|content|custom|puppet|wget|cached)_force(.*?)$/);
    if (m && m[1]) {
      return m[1];
    }
    return false;
  }

  botMes(chatId, text, mark = true) {
    let opts = {};
    if (mark) {
      opts = { parse_mode: 'Markdown' };
    }
    return this.bot.sendMessage(chatId, text, opts).
      catch(e => this.sendError(e, `${chatId}${text}`));
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

  sendAdminOpts(text, opts) {
    const chatId = process.env.TGGROUPBUGS || TGADMIN;
    return this.bot.sendMessage(chatId, text, opts);
  }

  sendAdminMark(text, chatId) {
    return this.sendAdmin(text, chatId, true);
  }

  getParams(hostname, chatId, force) {
    let params = {};
    const contentSelector = force === 'content' ||
      this.getConf(`${hostname}_content`);
    if (contentSelector) {
      params.content = contentSelector;
    }
    const puppetOnly = force === 'puppet' || this.getConf(`${hostname}_puppet`);
    if (puppetOnly) {
      params.isPuppet = true;
    }
    const customOnly = force === 'custom' || this.getConf(`${hostname}_custom`);
    if (customOnly) {
      params.isCustom = true;
    }
    const wget = force === 'wget' || this.getConf(`${hostname}_wget`);
    if (wget) {
      params.isWget = true;
    }
    const cached = force === 'cached' || this.getConf(`${hostname}_cached`);
    if (cached) {
      params.isCached = true;
    }
    const scroll = this.getConf(`${hostname}_scroll`);
    if (scroll) {
      params.scroll = scroll;
    }
    const noLinks = force === 'nolinks' || this.getConf(`${hostname}_nolinks`);
    if (noLinks) {
      params.noLinks = true;
    }
    const pcache = force === 'pcache';
    if (pcache) {
      params.isCached = true;
      params.cachefile = 'puppet.html';
      params.content = this.getConf('pcache_content');
    }
    if (this.isAdmin(chatId)) {
      if (this.getConf('test_puppet')) {
        params.isPuppet = true;
      }
      if (this.getConf('test_custom')) {
        params.isCustom = true;
      }
    }
    return params;
  }

  getConf(param) {
    let c = this.config[param] || '';
    if (c === _OFF) c = '';
    return c;
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

  setBlacklist(f) {
    this.bllist = fs.readFileSync(f).toString() || '';
  }

  isBlackListed(h) {
    return this.bllist.match(h);
  }

  forward(mid, from, to) {
    return this.bot.forwardMessage(to, from, mid);
  }

  async sockSend(chatId, txt) {
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
      await putChat({ message: txt, sender: 'admin' }, key);
    } catch (e) {
      console.log(e);
    }
  }
}

module.exports = BotHelper;
