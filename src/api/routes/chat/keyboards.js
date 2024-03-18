const Markup = require('telegraf/markup');

const BUTTONS = require('../../../config/buttons');

function createIv() {
  return Markup.keyboard([
    [BUTTONS.createTxt.label, BUTTONS.createDoc.label],
    [BUTTONS.back.label],
  ]);
}

function start() {
  return Markup.keyboard([
    // [BUTTONS.create.label],
    [BUTTONS.help.label, BUTTONS.support.label],
  ]);
}

function report() {
  const replyMarkup = Markup.inlineKeyboard([
    Markup.callbackButton('No images', 'no_img'),
    Markup.callbackButton('No InstantViewButton', 'no_button'),
  ]);
  return replyMarkup;
}

function resolvedBtn(rmsgId, chatId) {
  const replyMarkup = Markup.inlineKeyboard([
    Markup.callbackButton('Report Resolved', `r_${rmsgId}_${chatId}`),
  ]);
  return replyMarkup;
}

module.exports.start = start;
module.exports.report = report;
module.exports.resolvedBtn = resolvedBtn;
module.exports.createIv = createIv;
