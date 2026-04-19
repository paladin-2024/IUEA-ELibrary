/**
 * Mongoose adapter with a Prisma-shaped API.
 *
 * All controllers continue to call  prisma.user.findUnique(…),
 * prisma.book.findMany(…), etc. — this file translates those calls
 * into Mongoose queries without touching the controllers.
 */
const mongoose = require('mongoose');

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Convert a Prisma-style where object → Mongoose filter */
function toFilter(where) {
  if (!where) return {};
  const filter = {};

  for (const [k, v] of Object.entries(where)) {
    // Compound unique key  e.g. { userId_bookId: { userId, bookId } }
    if (k.includes('_') && v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(filter, toFilter(v));
      continue;
    }

    if (k === 'OR')  { filter.$or  = v.map(toFilter); continue; }
    if (k === 'AND') { filter.$and = v.map(toFilter); continue; }

    const field = k === 'id' ? '_id' : k;

    if (v === null) {
      filter[field] = null;
      continue;
    }

    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const cond      = {};
      const caseFlag  = v.mode === 'insensitive' ? 'i' : '';
      const escapeRx  = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      if ('gt'         in v) cond.$gt    = v.gt;
      if ('gte'        in v) cond.$gte   = v.gte;
      if ('lt'         in v) cond.$lt    = v.lt;
      if ('lte'        in v) cond.$lte   = v.lte;
      if ('contains'   in v) cond.$regex = new RegExp(escapeRx(v.contains), caseFlag || 'i');
      if ('startsWith' in v) cond.$regex = new RegExp(`^${escapeRx(v.startsWith)}`, caseFlag);
      if ('endsWith'   in v) cond.$regex = new RegExp(`${escapeRx(v.endsWith)}$`,   caseFlag);
      if ('equals'     in v) {
        if (caseFlag) { filter[field] = new RegExp(`^${escapeRx(v.equals)}$`, 'i'); continue; }
        filter[field] = v.equals; continue;
      }
      if ('notIn'    in v) cond.$nin   = v.notIn;
      if ('in'       in v) cond.$in    = v.in;
      if ('has'      in v) { filter[field] = v.has; continue; }
      if ('not'      in v) {
        if (v.not === null) { cond.$exists = true; cond.$ne = null; }
        else                cond.$ne = v.not;
      }
      if (Object.keys(cond).length === 0 && !('not' in v)) {
        filter[field] = v;
      } else {
        filter[field] = cond;
      }
      continue;
    }

    filter[field] = v;
  }
  return filter;
}

/** Convert Prisma orderBy → Mongoose sort */
function toSort(orderBy) {
  if (!orderBy) return {};
  const arr  = Array.isArray(orderBy) ? orderBy : [orderBy];
  const sort = {};
  for (const o of arr) {
    for (const [k, dir] of Object.entries(o)) {
      sort[k] = dir === 'asc' ? 1 : -1;
    }
  }
  return sort;
}

/** Convert Prisma select → Mongoose projection */
function toProjection(select) {
  if (!select) return null;
  const proj = {};
  for (const [k, v] of Object.entries(select)) {
    proj[k === 'id' ? '_id' : k] = v ? 1 : 0;
  }
  return proj;
}

/** Mongoose document → plain JS object with `id` as string */
function plain(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject({ virtuals: false }) : { ...doc };
  obj.id     = (obj._id ?? obj.id)?.toString();
  return obj;
}

/** Resolve include (populate referenced documents manually) */
async function applyIncludes(obj, include, Model) {
  for (const [key, opts] of Object.entries(include || {})) {
    if (!opts) continue;
    // Map include key → foreign-key field on the document
    const fkField = key + 'Id'; // "book" → "bookId", "user" → "userId"
    const refId   = obj[fkField];
    if (!refId) { obj[key] = null; continue; }

    // Find the referenced model
    const RefModel = mongoose.model(key.charAt(0).toUpperCase() + key.slice(1));
    const proj     = opts === true ? null : toProjection(opts.select);
    const refDoc   = proj
      ? await RefModel.findById(refId, proj).lean()
      : await RefModel.findById(refId).lean();

    if (refDoc) {
      refDoc.id = refDoc._id?.toString();
      obj[key]  = refDoc;
    } else {
      obj[key]  = null;
    }
  }
}

// ─── model wrapper ────────────────────────────────────────────────────────────

function wrap(ModelFn) {
  // ModelFn is a lazy getter so we don't require the model before mongoose is ready
  const M = () => ModelFn();

  return {
    // ── count ──────────────────────────────────────────────────────────────
    async count({ where } = {}) {
      return M().countDocuments(toFilter(where));
    },

    // ── findUnique ─────────────────────────────────────────────────────────
    async findUnique({ where, select, include } = {}) {
      const filter = toFilter(where);
      const proj   = toProjection(select);
      let doc = proj
        ? await M().findOne(filter, proj).lean()
        : await M().findOne(filter).lean();
      if (!doc) return null;
      doc.id = doc._id?.toString();
      if (include) await applyIncludes(doc, include, M());
      return doc;
    },

    // ── findFirst ──────────────────────────────────────────────────────────
    async findFirst({ where, select, orderBy, include } = {}) {
      const filter = toFilter(where);
      const proj   = toProjection(select);
      const sort   = toSort(orderBy);
      let doc = proj
        ? await M().findOne(filter, proj).sort(sort).lean()
        : await M().findOne(filter).sort(sort).lean();
      if (!doc) return null;
      doc.id = doc._id?.toString();
      if (include) await applyIncludes(doc, include, M());
      return doc;
    },

    // ── findMany ───────────────────────────────────────────────────────────
    async findMany({ where, select, orderBy, skip, take, include } = {}) {
      const filter = toFilter(where);
      const proj   = toProjection(select);
      const sort   = toSort(orderBy);

      let q = M().find(filter);
      if (proj) q = q.select(proj);
      if (sort && Object.keys(sort).length) q = q.sort(sort);
      if (skip != null) q = q.skip(Number(skip));
      if (take != null) q = q.limit(Number(take));

      const docs = await q.lean();
      for (const doc of docs) {
        doc.id = doc._id?.toString();
        if (include) await applyIncludes(doc, include, M());
      }
      return docs;
    },

    // ── create ─────────────────────────────────────────────────────────────
    async create({ data } = {}) {
      const doc = await M().create(data);
      return plain(doc);
    },

    // ── update ─────────────────────────────────────────────────────────────
    async update({ where, data, select } = {}) {
      const filter  = toFilter(where);
      const proj    = toProjection(select);
      // Split data into $set fields and $inc fields (Prisma { increment: N })
      const setData = {};
      const incData = {};
      for (const [k, v] of Object.entries(data || {})) {
        if (v && typeof v === 'object' && 'increment' in v) incData[k] = v.increment;
        else setData[k] = v;
      }
      const update = {};
      if (Object.keys(setData).length) update.$set = setData;
      if (Object.keys(incData).length) update.$inc = incData;
      const doc = await M().findOneAndUpdate(
        filter,
        update,
        { new: true, projection: proj || undefined },
      ).lean();
      if (!doc) {
        const err   = new Error('Record not found');
        err.code    = 'P2025';
        throw err;
      }
      doc.id = doc._id?.toString();
      return doc;
    },

    // ── upsert ─────────────────────────────────────────────────────────────
    async upsert({ where, update, create: createData } = {}) {
      const filter  = toFilter(where);
      const setData = {};
      const incData = {};
      for (const [k, v] of Object.entries(update || {})) {
        if (v && typeof v === 'object' && 'increment' in v) incData[k] = v.increment;
        else setData[k] = v;
      }
      const op = {};
      if (Object.keys(setData).length) op.$set = setData;
      if (Object.keys(incData).length) op.$inc = incData;
      op.$setOnInsert = createData;
      const doc = await M().findOneAndUpdate(filter, op, { upsert: true, new: true }).lean();
      doc.id = doc._id?.toString();
      return doc;
    },

    // ── delete ─────────────────────────────────────────────────────────────
    async delete({ where } = {}) {
      const filter = toFilter(where);
      const doc    = await M().findOneAndDelete(filter).lean();
      if (doc) doc.id = doc._id?.toString();
      return doc;
    },

    // ── deleteMany ─────────────────────────────────────────────────────────
    async deleteMany({ where } = {}) {
      const filter = toFilter(where);
      await M().deleteMany(filter);
    },
  };
}

// ─── exports ──────────────────────────────────────────────────────────────────
// Models are loaded lazily (after mongoose.connect) to avoid the
// "Schema hasn't been registered" error at require-time.

module.exports = {
  $connect:    async () => {},
  $disconnect: async () => mongoose.disconnect(),

  get user()          { return wrap(() => require('../models/User')); },
  get book()          { return wrap(() => require('../models/Book')); },
  get userProgress()  { return wrap(() => require('../models/UserProgress')); },
  get chatSession()   { return wrap(() => require('../models/ChatSession')); },
  get podcast()       { return wrap(() => require('../models/Podcast')); },
  get audioCache()    { return wrap(() => require('../models/AudioCache')); },
  get collection()    { return wrap(() => require('../models/Collection')); },
};
