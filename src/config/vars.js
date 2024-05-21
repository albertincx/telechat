const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv-safe');

const envPath = path.join(__dirname, '../../.env');

const confFile = path.join(__dirname, '../../.conf');
if (!fs.existsSync(confFile)) fs.mkdirSync(confFile);

if (fs.existsSync(envPath)) {
    dotenv.config({
        allowEmptyValues: true,
        path: envPath,
        sample: path.join(__dirname, '../../.env.example'),
    });
}
global.isDev = process.env.DEV === '1'
module.exports = {
    root: path.join(__dirname, '/../../'),
    env: process.env.NODE_ENV,
    logs: process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
    PORT: process.env.PORT || 4000,
    NO_BOT: process.env.NO_BOT || '',
    mongo: {
        uri: process.env.MONGO_URI,
    },
    NO_DB: process.env.NO_DB === '1',
};
