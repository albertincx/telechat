const OPTS = 'Type /help to show options';
module.exports = {
  start: (n, id) => `1. First promote me to admin
2. Set the domain name by https://t.me/${n}?start=${id}`,
  startCode: (codes) => `Put this code into bottom body of your website
  \`\`\` ${codes.join(`\`\`\`\nor\n\`\`\``)} \`\`\``,
  startEmpty: (intro = '') => 'Please add me to group  ' + intro,
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
