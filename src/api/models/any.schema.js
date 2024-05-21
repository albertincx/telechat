const mongoose = require('mongoose');
const anySchema = new mongoose.Schema({}, {
    timestamps: true,
    strict: false,
});

anySchema.method({
    transform() {
        return this.toObject();
    },
});

module.exports = anySchema;
