async function run(params, botHelper) {
    try {
        let url = process.env.TEST_API;
        if (!url) return;
        await botHelper.clearUnusedChats();
        // await botHelper.sendAdmin('cron test check url', process.env.TGGROUP);
    } catch (e) {
        console.log(e);
    }
}

module.exports = {run};
