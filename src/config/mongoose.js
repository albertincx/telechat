const mongoose = require('mongoose');
const {mongo, NODB} = require('./vars');

exports.connect = (uriStr) => {
    const uri = uriStr || mongo.uri;
    if (!uri || NODB) return false;

    mongoose.connect(uri, {
        connectTimeoutMS: 30000,
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    return mongoose.connection;
};
