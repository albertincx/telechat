const Any = require('../models/any.model');
const logger = require('../utils/logger');

const links = Any.collection.conn.model(
  process.env.MONGO_COLL_LINKS || 'messages', Any.schema);
const uids = Any.collection.conn.model(
  process.env.MONGO_COLL_LINKS || 'uids', Any.schema);
const logs = Any.collection.conn.model(process.env.MONGO_COLL_LOGS || 'logs',
  Any.schema);

const stat = async () => {
  const cnt = await links.countDocuments();
  return cnt;
};

const clear = async (msg) => {
  let search = msg.text.replace('/cleardb', '').trim();
  search = `${search}`.trim();
  if (!search) {
    return Promise.resolve('empty');
  }
  const s = new RegExp(`^https?:\/\/${search}`);
  const d = await links.deleteMany({ url: s });
  return JSON.stringify(d);
};
const getLast = async (key, uid) => {
  const last = await links.find({ key, uid }).sort({ createdAt: -1 }).limit(20);
  return last;
};
const get = async (url) => {
  const me = await links.findOne({ url });
  if (me) {
    await updateOne({ url });
    return me.toObject();
  }
  return false;
};

const updateOne = async (item) => {
  const { url } = item;
  item.$inc = { affects: 1 };
  return links.updateOne({ url }, item, { upsert: true });
};
const log = async (item) => {
  const { url } = item;
  item.$inc = { affects: 1 };
  return logs.updateOne({ url }, item, { upsert: true });
};
const putChat = async ({ g, u, pathname, host, ...item }, key) => {
  return links.bulkWrite([
    {
      insertOne: {
        document: { key, ...item },
      },
    },
  ]);
};

const getUidUser = async (g, key) => {
  g = `${g}`;
  const last = await uids.findOne({ key, g });
  return last ? last.toObject() : null;
};

const putUidUser = async ({ g, u, ...item }, key) => {
  return uids.bulkWrite([
    {
      updateOne: {
        filter: { g, key },
        update: { g, key, u, ...item },
        upsert: true,
      },
    }]);
};
module.exports.stat = stat;
module.exports.clear = clear;
module.exports.updateOne = updateOne;
module.exports.get = get;
module.exports.getLast = getLast;
module.exports.putChat = putChat;
module.exports.putUidUser = putUidUser;
module.exports.getUidUser = getUidUser;
module.exports.log = log;
