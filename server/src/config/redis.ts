export const redis = {
  get: async (_k: string) => null,
  set: async () => null,
  setex: async () => null,
  del: async () => null,
  connect: async () => {},
  on: () => {},
} as any;

export async function connectRedis(): Promise<void> {
  console.log('⚠️ Redis skipped');
}

export async function cacheGet<T>(_key: string): Promise<T | null> {
  return null;
}

export async function cacheSet(_key: string, _value: unknown, _ttl = 300): Promise<void> {}

export async function cacheDel(_key: string): Promise<void> {}