import Redis from 'ioredis';
import RedisMock from 'ioredis-mock';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const isTls = redisUrl.startsWith('rediss://');

let isMock = false;

const getRedisOptions = () => {
  const options = {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    connectTimeout: 5000,
    retryStrategy(times) {
      if (times > 2) return null;
      return 200;
    }
  };
  if (isTls) {
    options.tls = { rejectUnauthorized: false };
  }
  return options;
};

const createClientInstance = () => {
  try {
    const client = new Redis(redisUrl, getRedisOptions());
    client.on('error', (err) => {
      if (!isMock) {
        console.warn(`[Redis] Connection warning (${err.message}). Using in-memory Redis mock client.`);
        isMock = true;
      }
    });
    return client;
  } catch (e) {
    isMock = true;
    return new RedisMock();
  }
};

export const redisClient = createClientInstance();

redisClient.connect().then(() => {
  console.log('[Redis] Connected successfully');
}).catch((err) => {
  console.warn(`[Redis] Could not connect to real Redis (${err.message}), switching to in-memory mock.`);
  isMock = true;
});

export const createRedisClient = () => {
  if (isMock) {
    return new RedisMock();
  }
  try {
    const client = new Redis(redisUrl, getRedisOptions());
    client.on('error', () => { isMock = true; });
    return client;
  } catch (e) {
    isMock = true;
    return new RedisMock();
  }
};

// Atomic Lua script for Safe Distributed Lock Release (GET + compare + DEL)
const RELEASE_LOCK_LUA_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
else
    return 0
end
`;

// Distributed Lock Helper: Atomic SET key lockToken NX EX ttlSeconds
export const acquireRedisLock = async (key, lockToken, ttlSeconds) => {
  try {
    if (isMock || typeof redisClient.set !== 'function') {
      // Dev Mock Lock logic
      if (global._redisMockStore && global._redisMockStore.has(key)) {
        return null; // Lock failed
      }
      if (!global._redisMockStore) global._redisMockStore = new Map();
      global._redisMockStore.set(key, lockToken);
      setTimeout(() => {
        if (global._redisMockStore.get(key) === lockToken) {
          global._redisMockStore.delete(key);
        }
      }, ttlSeconds * 1000);
      return 'OK';
    }

    // Standard Redis SET key lockToken NX EX ttl
    const result = await redisClient.set(key, lockToken, 'NX', 'EX', ttlSeconds);
    return result; // 'OK' if acquired, null if already locked
  } catch (err) {
    console.error('[Redis Lock Error]:', err.message);
    // Fallback in-memory map on Redis error
    if (!global._redisMockStore) global._redisMockStore = new Map();
    if (global._redisMockStore.has(key)) return null;
    global._redisMockStore.set(key, lockToken);
    return 'OK';
  }
};

// Distributed Lock Release Helper: Safe Atomic Lua Release (GET + compare + DEL)
export const releaseRedisLock = async (key, lockToken) => {
  try {
    if (global._redisMockStore) {
      if (global._redisMockStore.get(key) === lockToken) {
        global._redisMockStore.delete(key);
      }
    }
    if (!isMock && typeof redisClient.eval === 'function') {
      await redisClient.eval(RELEASE_LOCK_LUA_SCRIPT, 1, key, lockToken);
    }
  } catch (err) {
    console.error('[Redis Release Error]:', err.message);
  }
};
