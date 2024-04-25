const Any = require('../models/any.model');
const { NODB } = require('../../config/vars');

const messages = Any.collection.conn.model(
  process.env.MONGO_COLL_LINKS || 'messages', Any.schema);

const uids = Any.collection.conn.model(
  process.env.MONGO_COLL_LINKS || 'uids', Any.schema);

const statUids = async () => {
  const cnt = await uids.countDocuments();
  return cnt;
};
const stat = async (coll = '') => {
  if(coll==='uids'){
    const cnt = await statUids();
  return cnt;
  }
  const cnt = await messages.countDocuments();
  return cnt;
};

const clear = async (msg) => {
  let search = msg.text.replace('/cleardb', '').trim();
  search = `${search}`.trim();
  if (!search) {
    return Promise.resolve('empty');
  }
  const s = new RegExp(`^https?:\/\/${search}`);
  const d = await messages.deleteMany({ url: s });
  return JSON.stringify(d);
};

const getKey = (val) => {
  let newVal = '';
  const hasSpace = val.match(/^\s/);
  if (hasSpace) {
    val = val.trim()
  }

  const valArr = `${val}`.split(/\s/)
  const firstVal = valArr.shift() || '';

  if (firstVal) {
    newVal = hasSpace ? new RegExp(`${firstVal}`) : new RegExp(`^${firstVal}`);
  }

  return newVal
}

const getLast = (key, uid) => {
  if (NODB || !uid) {
    return [];
  }
  if (uid.match(/\s/)) {
      uid = getKey(uid)
  }
  if (key.match(/\s/)) {
      key = getKey(key)
  }

  if (!key || !uid) {
    return [];
  }

  return messages.find({key, uid}).sort(
      {createdAt: -1}).limit(20)
};

const get = async (url) => {
  const me = await messages.findOne({ url });
  if (me) {
    await updateOne({ url });
    return me.toObject();
  }
  return false;
};

const updateOne = async (item) => {
  const { url } = item;
  item.$inc = { affects: 1 };
  return messages.updateOne({ url }, item, { upsert: true });
};

const putChat = async ({ g, u, pathname, host, ...item }, key) => {
  return !NODB && messages.bulkWrite([
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
