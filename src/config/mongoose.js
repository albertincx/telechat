const mongoose = require('mongoose');
const { mongo, NODB } = require('./vars');

exports.connect = () => {
  if (!mongo.uri || NODB) return false;
  mongoose.connect(mongo.uri, {
    connectTimeoutMS: 30000,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  return mongoose.connection;
};
