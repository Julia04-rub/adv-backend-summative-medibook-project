const Redis = require('ioredis');
const config = require('./index');

const redis = new Redis({ host: config.redis.host, port: config.redis.port });

redis.on('error', (err) => console.error('Redis error:', err.message));

module.exports = redis;