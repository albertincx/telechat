const WebSocket = require('ws');
const { NOBOT, PORT, blacklistFile } = require('./config/vars');
const sockets = { g: {}, u: {} };
module.exports = (botHelper)=>{
  
  botHelper.setSockets(sockets)
const wss = new WebSocket.Server({ port: PORT });
  global.arsfChatSocket = (process.env.APP_DOMAINNAME ? process.env.APP_DOMAINNAME : 'localhost') + ':' + PORT;

  wss.on('connection', ws => {
    ws.on('message', message => {
      let messageObj = {};
      try {
        messageObj = JSON.parse(message);
        if (messageObj.g) {
          let key = `${messageObj.g}`
          if (!sockets.g[key]) {
            sockets.g[key] = ws;
            ws.on('close', () => {
              delete sockets.g[key];
            });
          }
          botHelper.botMes(+messageObj.g * -1, messageObj.message);
        }
      } catch (e) {
        botHelper.sendAdmin(message);
      }
    });
    ws.send(JSON.stringify({ message: 'Hi' }));
  });
}