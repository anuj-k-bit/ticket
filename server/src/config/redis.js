import Redis from 'ioredis';
import RedisMock from 'ioredis-mock';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

let isMock = false;

const createClientInstance = () => {
  try {
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 2) return null;
        return 200;
      }
    });

    client.on('error', (err) => {
      if (err.code === 'ECONNREFUSED' && !isMock) {
        console.warn('[Redis] Host 127.0.0.1:6379 unreachable. Using in-memory Redis mock client.');
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
}).catch(() => {
  console.warn('[Redis] Could not connect to real Redis, switching to in-memory mock.');
  isMock = true;
});

export const createRedisClient = () => {
  if (isMock) {
    return new RedisMock();
  }
  try {
    return new Redis(redisUrl, { maxRetriesPerRequest: null, enableReadyCheck: false });
  } catch (e) {
    return new RedisMock();
  }
};

// Distributed Lock Helper: Atomic SET key value NX EX ttlSeconds
export const acquireRedisLock = async (key, value, ttlSeconds) => {
  try {
    if (isMock || typeof redisClient.set !== 'function') {
      // Dev Mock Lock logic
      if (global._redisMockStore && global._redisMockStore.has(key)) {
        return null; // Lock failed
      }
      if (!global._redisMockStore) global._redisMockStore = new Map();
      global._redisMockStore.set(key, value);
      setTimeout(() => {
        if (global._redisMockStore.get(key) === value) {
          global._redisMockStore.delete(key);
        }
      }, ttlSeconds * 1000);
      return 'OK';
    }

    // Standard Redis SET key value NX EX ttl
    const result = await redisClient.set(key, value, 'NX', 'EX', ttlSeconds);
    return result; // 'OK' if acquired, null if already locked
  } catch (err) {
    console.error('[Redis Lock Error]:', err.message);
    // Fallback in-memory map on Redis error
    if (!global._redisMockStore) global._redisMockStore = new Map();
    if (global._redisMockStore.has(key)) return null;
    global._redisMockStore.set(key, value);
    return 'OK';
  }
};

// Distributed Lock Release Helper: DEL key
export const releaseRedisLock = async (key, value) => {
  try {
    if (global._redisMockStore) {
      global._redisMockStore.delete(key);
    }
    if (!isMock && typeof redisClient.del === 'function') {
      await redisClient.del(key);
    }
  } catch (err) {
    console.error('[Redis Release Error]:', err.message);
  }
};
