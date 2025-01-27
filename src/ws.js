const WebSocket = require('ws');
var uidSafe = require('uid-safe').sync;
const fs = require('fs');

const {putChat, getLast, putItem} = require('./api/utils/db');
const {PORT} = require('./config/vars');
const logger = require("./api/utils/logger");
const {dbKeys} = require("./api/constants");

const sockets = {g: {}, u: {}};

/** @type BotHelper */
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
                global.isDev && console.log(messageObj);

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
                if (!messageObj.g) return;

                if (messageObj.host) {
                    await putItem(messageObj, dbKeys.hosts).catch((e) => {
                        logger(e);
                    });
                }
                const groupID = messageObj.g.replace(/_S/, '');
                const supGr = messageObj.g.match(/_S/);
                messageObj.g = groupID;
                if (supGr) {
                    messageObj.superGroup = true;
                }

                const key = `${groupID}_chat_${messageUid}`;
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
                    if (!botHelper.sockets.g[key]) {
                        botHelper.sockets.g[key] = {ws, userId: messageUid};
                    }
                    ws.send(JSON.stringify(service));
                    return;
                }
                if (!botHelper.sockets.g[key]) {
                    let lastMess = [];
                    if (!messageObj.isRec) {
                        lastMess = await getLast(key, messageUid);
                    }
                    if (botHelper.sockets.g[key]) {
                        botHelper.sockets.g[key].ws = ws;
                        botHelper.sockets.g[key].userId = messageUid;
                    } else {
                        botHelper.sockets.g[key] = {ws, userId: messageUid};
                    }
                    if (isUndef || lastMess.length) {
                        const service = {service: 'setUid', message: messageUid};
                        ws.send(JSON.stringify(service));
                    }
                    ws.on('close', () => {
                        if (botHelper.sockets.g[key]) {
                            delete botHelper.sockets.g[key].ws;
                        }
                    });
                } else {
                    botHelper.sockets.g[key].ws = ws;
                }
                const CHAT_ID = +groupID * -1;

                if (messageObj.img) {
                    if (messageObj.message === 'logs') {
                        messageObj.message = messageObj.img;
                        botHelper.botMes(CHAT_ID, messageObj, groupID);
                        return;
                    }
                    const filePath = `./${new Date().getTime()}`;
                    const base64Data = messageObj.img.replace(/^data:([A-Za-z-+/]+);base64,/, '');

                    fs.writeFile(filePath, base64Data, 'base64', () => {
                        messageObj.message = 'Screen shot';
                        botHelper.sendTgPhoto(CHAT_ID, {source: fs.readFileSync(filePath)}, messageObj).then(() => {
                            fs.unlinkSync(filePath);
                        });
                    });
                    return;
                }
                if (!messageObj.login) {
                    await putChat(messageObj, key).catch((e) => {
                        logger(e);
                    });
                    botHelper.botMes(CHAT_ID, messageObj, groupID);
                }
            } catch (e) {
                logger(e)
                botHelper.sendAdmin(`${e}`);
            }
        });
    });
};

module.exports = initWs;
