const OPTS = 'Type /help to show options';
module.exports = {
  start: (n, id) => `1. First promote me to admin
2. Set the domain name by https://t.me/${n}?start=${id}`,
  startCode: (code) => `Put this code into bottom body of your website
  \`\`\` ${code} \`\`\``,
  startEmpty: () => 'Please add me to group',
  showIvMessage: (...args) => `${args[3] ||
  ''}${args[0]}[InstantView](${args[1]}) from [Source](${args[2]})`,
  broken:
    link => `Sorry, but your [link](${link}) is broken, restricted, or content is empty`,
  brokenFile:
    reason => `Sorry, but your file invalid, reason: ${reason}`,
  isLooksLikeFile: link => `It looks like a file [link](${link})`,
  resolved: () => 'This error resolved, please check link again',
  createIv: () => 'Choose a source',
  createIvTxt: () => 'Send txt document to me: .txt, .html, .md or back to menu /start',
  support: links => {
    let s = 'For support:';
    s += `${links.length ? `\n${links.join('\n\n')}` : ''}`;
    return s;
  },
  menu: () => OPTS,
};
