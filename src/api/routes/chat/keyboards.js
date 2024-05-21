const Markup = require('telegraf/markup');

const BUTTONS = require('../../../config/buttons');

function start() {
    return Markup.keyboard([
        [BUTTONS.help.label, BUTTONS.support.label],
    ]);
}

module.exports.start = start;
