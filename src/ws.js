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

  wss.on('disconnect', ws => {
    console.log(ws);
  });
  wss.on('connection', ws => {
    ws.on('message', async message => {
      let messageObj = {};
      try {
        messageObj = JSON.parse(message);
        let isUndef = false;
        if (!messageObj.uid) isUndef = true;
        messageObj.uid = messageObj.uid || uid(5);
        if (messageObj.g) {
          let key = `${messageObj.g}`;
          if (!sockets.g[key]) {
            const lastMess = await getLast(key,messageObj.uid);
            sockets.g[key] = { ws, userId: messageObj.uid };
            if (isUndef || lastMess.length) {
              const service = { service: 'setUid', message: messageObj.uid };
              service.lastMess = lastMess;
              ws.send(JSON.stringify(service));
            }
            ws.on('close', () => {
              botHelper.botMes(+messageObj.g * -1, `
              #${messageObj.uid}: \n#disconnected`);
              delete sockets.g[key];
            });
          }
          if (!messageObj.login) {
            await putChat(messageObj, key);
          }
          botHelper.botMes(+messageObj.g * -1, `
          #${messageObj.uid}:\n${messageObj.message}`);
        }
      } catch (e) {
        botHelper.sendAdmin(e);
      }
    });
  });
};
