const WebSocket = require('ws');
var uid = require('uid-safe').sync;
const { putChat, getLast } = require('./api/utils/db');
const { NOBOT, PORT, blacklistFile } = require('./config/vars');
const sockets = { g: {}, u: {} };
module.exports = (botHelper) => {
  botHelper.setSockets(sockets);
  const wss = new WebSocket.Server({ port: PORT });
  global.arsfChatSocket = (process.env.APP_DOMAINNAME
    ? process.env.APP_DOMAINNAME
    : 'localhost') + ':' + PORT;

  wss.on('connection', ws => {
    ws.on('message', async message => {
      let messageObj = {};
      try {
        messageObj = JSON.parse(message);
        let isUndef = false;
        if (!messageObj.uid) isUndef = true;
        let uid1 = messageObj.uid || uid(5);
        if (isUndef) {
          uid1 = uid1.replace(/-/g, '');
        }
        messageObj.uid = uid1;
        if (messageObj.g) {
          let key = `${messageObj.g}_chat_${messageObj.uid}`;
          if (!sockets.g[key]) {
            let lastMess = [];
            if (!messageObj.isRec) lastMess = await getLast(key,
              messageObj.uid);
            sockets.g[key] = { ws, userId: messageObj.uid };
            if (isUndef || lastMess.length) {
              const service = { service: 'setUid', message: messageObj.uid };
              service.lastMess = lastMess;
              ws.send(JSON.stringify(service));
            }
            ws.on('close', () => {
              // botHelper.botMes(+messageObj.g * -1, `
              // #u${messageObj.uid}: \n#disconnected`);
              delete sockets.g[key];
            });
          }
          if (!messageObj.login) {
            await putChat(messageObj, key);
            botHelper.botMes(+messageObj.g * -1, `
          #u${messageObj.uid}:\n${messageObj.message}`, messageObj.g);
          }
          
        }
      } catch (e) {
        botHelper.sendAdmin(e);
      }
    });
  });
};
