const mongoose = require('mongoose');
const {mongo, NO_DB} = require('./vars');

exports.connect = (uriStr) => {
    const uri = uriStr || mongo.uri;
    if (!uri || NO_DB) return false;

    mongoose.connect(uri, {
        connectTimeoutMS: 30000,
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    return mongoose.connection;
};
