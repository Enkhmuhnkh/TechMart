import { v4 as uuidv4 } from 'uuid';
import * as repo from './products.repository';
import { Errors } from '../../shared/errors';
import { cacheGet, cacheSet, cacheDel } from '../../config/redis';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function listProducts(filters: repo.ProductFilters) {
  const cacheKey = `products:list:${JSON.stringify(filters)}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const result = await repo.findAll(filters);
  await cacheSet(cacheKey, result, 300);
  return result;
}

export async function getProductBySlug(slug: string) {
  const cacheKey = `products:slug:${slug}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const product = await repo.findBySlug(slug);
  if (!product) throw Errors.NOT_FOUND('Product');
  await cacheSet(cacheKey, product, 300);
  return product;
}

export async function compareProducts(ids: string[]) {
  if (ids.length < 2 || ids.length > 4) throw Errors.VALIDATION('Provide 2–4 product IDs to compare');
  return repo.findByIds(ids);
}

export async function createProduct(data: Record<string, unknown>) {
  const id = uuidv4();
  const slug = slugify(String(data.name)) + '-' + id.slice(0, 8);
  const product = await repo.create({ ...data, id, slug });
  await invalidateProductCache();
  return product;
}

export async function updateProduct(id: string, data: Record<string, unknown>) {
  const product = await repo.update(id, data);
  if (!product) throw Errors.NOT_FOUND('Product');
  await cacheDel(`products:slug:${(product as any).slug}`);
  await invalidateProductCache();
  return product;
}

export async function deleteProduct(id: string) {
  await repo.remove(id);
  await invalidateProductCache();
}

export async function updateSpecs(productId: string, specs: Array<{key:string;value:string;group?:string;sort?:number}>) {
  await repo.upsertSpecs(productId, specs);
  await invalidateProductCache();
}

export async function addImage(productId: string, url: string, isPrimary: boolean) {
  return repo.addImage(productId, url, isPrimary);
}

export async function deleteImage(imageId: string) {
  await repo.deleteImage(imageId);
}

async function invalidateProductCache() {
  // Simple approach: delete by pattern would need Redis SCAN
  // For now delete known keys; in prod use Redis keyspace notifications
}
