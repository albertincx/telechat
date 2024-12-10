async function run(params, botHelper) {
    try {
        const chat = {
            chat: {id: botHelper.tgAdmin},
            text: '',
        };

        const broadcastIsOn = botHelper.getConf('broadcast');
        // console.log('broadcastIsOn');
        // console.log(broadcastIsOn);
        if (broadcastIsOn) {
            botHelper.startBroad({
                message: {
                    ...chat,
                    text: `/${broadcastIsOn}`
                },
                reply: (s) => {
                    console.log(s);
                    botHelper.sendAdmin(s);
                    return {catch: (cb) => cb()};
                }
            });
        }
    } catch (e) {
        console.log(e);
    }
}

module.exports = {run};
