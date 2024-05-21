const fs = require('fs');

const logger = (content, file) => {
    if (global.isDev) {
        if (file) {
            fs.writeFileSync(`.conf/${file}`, `${content}`);
        } else {
            console.log(content);
        }
    }
};
module.exports = logger;
