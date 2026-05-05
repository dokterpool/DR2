const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required for PostgreSQL connection.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

function toPgPlaceholders(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

function run(sql, params = [], cb) {
  const text = toPgPlaceholders(sql);
  pool.query(text, params)
    .then((res) => cb && cb.call({ changes: res.rowCount }, null))
    .catch((err) => cb && cb(err));
}

function get(sql, params = [], cb) {
  const text = toPgPlaceholders(sql);
  pool.query(text, params)
    .then((res) => cb && cb(null, res.rows[0] || null))
    .catch((err) => cb && cb(err));
}

function all(sql, params = [], cb) {
  const text = toPgPlaceholders(sql);
  pool.query(text, params)
    .then((res) => cb && cb(null, res.rows))
    .catch((err) => cb && cb(err));
}

function exec(sql, cb) {
  pool.query(sql)
    .then(() => cb && cb(null))
    .catch((err) => cb && cb(err));
}

function prepare(sql) {
  return {
    run: (...args) => {
      const cb = typeof args[args.length - 1] === 'function' ? args.pop() : undefined;
      run(sql, args, cb);
    },
    finalize: (cb) => cb && cb(),
  };
}

async function query(sql, params = []) {
  return pool.query(toPgPlaceholders(sql), params);
}

function close() {
  return pool.end();
}

module.exports = { pool, run, get, all, exec, prepare, query, close };
