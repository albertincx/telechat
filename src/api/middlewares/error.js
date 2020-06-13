const { env } = require('../../config/vars');

/**
 * Error handler. Send stacktrace only during development
 * @public
 */
const handler = (err, req, res, next) => {
  const response = {
    code: err.status,
    message: err.message || 500,
    errors: err.errors,
  };

  if (env !== 'development') {
    delete response.stack;
  }

  res.status(500);
  res.json(response);
};
exports.handler = handler;

/**
 * If error is not an instanceOf APIError, convert it.
 * @public
 */
exports.converter = (err, req, res, next) => {
  let convertedError = err;

  if (!(err instanceof Error)) {
    convertedError = new Error(err.message);
  }

  return handler(convertedError, req, res);
};

/**
 * Catch 404 and forward to error handler
 * @public
 */
exports.notFound = (req, res, next) => {
  const err = new Error('Not found');
  res.status(404)
  return handler(err, req, res);
};
