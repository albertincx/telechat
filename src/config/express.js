const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const compress = require('compression');
const methodOverride = require('method-override');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const srv = require('../api/routes/app');

const error = require('../api/middlewares/error');
const app = express();
app.enable('trust proxy');
if (process.env.NODE_ENV === 'production') {
  const defaultLimits = { WINDOWMS: 15, MAXREQUESTS: 100 };

  Object.keys(defaultLimits).map(k => {
    const v = process.env[k];
    if (v && !isNaN(v)) defaultLimits[k] = parseInt(v);
  });

  app.use(rateLimit({
    windowMs: defaultLimits.WINDOWMS * 60 * 1000, // 15 minutes
    max: defaultLimits.MAXREQUESTS, // limit each IP to 100 requests per windowMs
  }));
}
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(compress());
app.use(cookieParser());
app.use(methodOverride());

app.use(helmet({ frameguard: false }));
app.use(cors());

if (process.env.DEV) {
  app.use('/apidoc', express.static(`${__dirname}/../../public/docs`));
}
let pp = `${__dirname}/../../public/app/index.html`;
console.log(fs.existsSync(pp))
app.use('/popup', express.static(`${__dirname}/../../public/popup`));
app.use('/apps', express.static(`${__dirname}/../../public/app`));

app.use('/app', srv);

app.use(error.converter);

app.use(error.notFound);

app.use(error.handler);
module.exports = app;
