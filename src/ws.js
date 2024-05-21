const WebSocket = require('ws');
var uidSafe = require('uid-safe').sync;
const fs = require('fs');

const {putChat, getLast} = require('./api/utils/db');
const {PORT} = require('./config/vars');
const logger = require("./api/utils/logger");

const sockets = {g: {}, u: {}};

const getMessage = (messageObj) => `
          #u${messageObj.uid}:\n${messageObj.message}`;

const initWs = (botHelper) => {
    botHelper && botHelper.setSockets(sockets);
    const wss = new WebSocket.Server({port: PORT});
    const domainName = process.env.APP_DOMAINNAME || 'localhost';
    global.arsfChatSocket = domainName + ':' + PORT;

    wss.on('connection', ws => {
        ws.on('message', async message => {
            let messageObj = {};
            try {
                messageObj = JSON.parse(message);
                let isUndef = false;
                if (!messageObj.uid) {
                    isUndef = true;
                }

                let uid1 = messageObj.uid || uidSafe(5);
                if (isUndef) {
                    uid1 = uid1.replace(/-/g, '');
                }

                const messageUid = uid1 && `${uid1}`.trim();
                messageObj.uid = messageUid;

                if (messageObj.g) {
                    const key = `${messageObj.g}_chat_${messageUid}`;
                    if (messageObj.service === 'lastmes') {
                        let result = [];
                        try {
                            const lastMess = await getLast(key, messageUid);
                            if (lastMess) result = lastMess;
                        } catch (e) {
                            logger(e);
                        }
                        const service = {service: 'lastmes', message: messageUid};
                        service.lastMess = result;
                        ws.send(JSON.stringify(service));
                        return;
                    }
                    if (!sockets.g[key]) {
                        let lastMess = [];
                        if (!messageObj.isRec) {
                            lastMess = await getLast(key, messageUid);
                        }
                        sockets.g[key] = {ws, userId: messageUid};
                        if (isUndef || lastMess.length) {
                            const service = {service: 'setUid', message: messageUid};
                            ws.send(JSON.stringify(service));
                        }
                        ws.on('close', () => {
                            delete sockets.g[key];
                        });
                    }
                    const CHAT_ID = +messageObj.g * -1;

                    if (messageObj.img) {
                        if (messageObj.message === 'logs') {
                            messageObj.message = messageObj.img;
                            botHelper.botMes(CHAT_ID, getMessage(messageObj), messageObj.g);
                            return;
                        }
                        const filePath = `./${new Date().getTime()}`;
                        const base64Data = messageObj.img.replace(/^data:([A-Za-z-+/]+);base64,/, '');

                        fs.writeFile(filePath, base64Data, 'base64', () => {
                            messageObj.message = 'Screen shot';
                            botHelper.sendTgPhoto(CHAT_ID, {source: fs.readFileSync(filePath)}, getMessage(messageObj)).then(() => {
                                fs.unlinkSync(filePath);
                            });
                        });
                        return;
                    }
                    if (!messageObj.login) {
                        await putChat(messageObj, key).catch((e) => {
                            logger(e);
                        });
                        botHelper.botMes(CHAT_ID, getMessage(messageObj), messageObj.g);
                    }
                }
            } catch (e) {
                logger(e)
                botHelper.sendAdmin({text: `${e}`});
            }
        });
    });
};

module.exports = initWs;
