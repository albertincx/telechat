const OPTS = 'Type /help to show options';

let username = process.env.TBTUSERNAME;

module.exports = {
    start: (n, {id, type}) => {
        const sup = type === 'supergroup';
        return `1. First promote me to admin
2. Set the domain name by https://t.me/${n}?start=${id}${sup ? '_sup' : ''}`
    },
    startCode: (codes) => `Put this code into bottom body of your website
  \`\`\`${codes.join(`\`\`\`\n\nor\n\n\`\`\``)} \`\`\``,
    startTg: (id, sup = false) => {
        return `\nor Direct chat in telegram \n https://t.me/${username}?start=${sup ? 'sup-': ''}tg-${id}`
    },

    startEmpty: (intro = '') => 'Please add me to group  ' + intro,

    startChat: () => 'Wait for response...\nThis chat will be disconnected in an hour from the last answer',

    notFound: (id) => `Sorry but the conversation not found or deactivated${id
        ? `, try to start again https://t.me/${username}?start=tg${id}`
        : ''}`,
    support: links => {
        let s = 'For support:';
        s += `${links.length ? `\n${links.join('\n\n')}` : ''}`;
        return s;
    },
    menu: () => OPTS,
};
