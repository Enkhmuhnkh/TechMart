import { query, queryOne } from '../../shared/db';
import { parsePagination, buildMeta } from '../../shared/paginate';

export interface ProductFilters {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  inStock?: boolean;
  page?: number;
  limit?: number;
}

export async function findAll(filters: ProductFilters) {
  const { page, limit, offset } = parsePagination(filters as Record<string, unknown>);
  const conditions: string[] = ["p.status = 'active'"];
  const vals: unknown[] = [];
  let i = 1;

  if (filters.search) {
    conditions.push(`(p.name ILIKE $${i} OR p.name_mn ILIKE $${i} OR p.description ILIKE $${i})`);
    vals.push(`%${filters.search}%`); i++;
  }
  if (filters.category) {
    conditions.push(`c.slug = $${i++}`); vals.push(filters.category);
  }
  if (filters.brand) {
    conditions.push(`b.name ILIKE $${i++}`); vals.push(`%${filters.brand}%`);
  }
  if (filters.minPrice !== undefined) {
    conditions.push(`COALESCE(p.sale_price, p.price) >= $${i++}`); vals.push(filters.minPrice);
  }
  if (filters.maxPrice !== undefined) {
    conditions.push(`COALESCE(p.sale_price, p.price) <= $${i++}`); vals.push(filters.maxPrice);
  }
  if (filters.inStock) {
    conditions.push('p.stock_quantity > 0');
  }

  const sortMap: Record<string, string> = {
    price: 'COALESCE(p.sale_price, p.price)',
    name: 'p.name',
    created: 'p.created_at',
    stock: 'p.stock_quantity',
  };
  const orderBy = sortMap[filters.sortBy || 'created'] || 'p.created_at';
  const dir = filters.sortDir === 'asc' ? 'ASC' : 'DESC';

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN brands b ON p.brand_id = b.id
     ${where}`, vals
  );
  const total = parseInt(countResult?.count || '0');

  vals.push(limit, offset);
  const { rows } = await query(
    `SELECT p.id, p.name, p.name_mn, p.slug, p.price, p.sale_price,
            p.stock_quantity, p.created_at,
            c.name as category_name, c.slug as category_slug,
            b.name as brand_name,
            (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image_url
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN brands b ON p.brand_id = b.id
     ${where}
     ORDER BY ${orderBy} ${dir}
     LIMIT $${i++} OFFSET $${i++}`,
    vals
  );

  return { data: rows, meta: buildMeta(page, limit, total) };
}

export async function findBySlug(slug: string) {
  const product = await queryOne(
    `SELECT p.*, c.name as category_name, c.slug as category_slug,
            b.name as brand_name, b.logo_url as brand_logo
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN brands b ON p.brand_id = b.id
     WHERE p.slug = $1 AND p.status = 'active'`,
    [slug]
  );
  if (!product) return null;

  const { rows: images } = await query(
    'SELECT * FROM product_images WHERE product_id = $1 ORDER BY sort_order',
    [product.id]
  );
  const { rows: specs } = await query(
    'SELECT * FROM product_specs WHERE product_id = $1 ORDER BY spec_group, sort_order',
    [product.id]
  );
  const { rows: reviews } = await query(
    `SELECT r.*, u.full_name as user_name FROM reviews r
     JOIN users u ON r.user_id = u.id
     WHERE r.product_id = $1 AND r.approved = true
     ORDER BY r.created_at DESC LIMIT 10`,
    [product.id]
  );

  return { ...product, images, specs, reviews };
}

export async function findByIds(ids: string[]) {
  if (!ids.length) return [];
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
  const { rows } = await query(
    `SELECT p.*, c.name as category_name, b.name as brand_name,
            (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image_url,
            json_agg(json_build_object('key', ps.spec_key, 'value', ps.spec_value, 'group', ps.spec_group) ORDER BY ps.sort_order) as specs
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN brands b ON p.brand_id = b.id
     LEFT JOIN product_specs ps ON ps.product_id = p.id
     WHERE p.id = ANY(ARRAY[${placeholders}]::uuid[])
     GROUP BY p.id, c.name, b.name`,
    ids
  );
  return rows;
}

export async function findRelated(productId: string, categoryId: string, limit = 6) {
  const { rows } = await query(
    `SELECT p.id, p.name, p.name_mn, p.slug, p.price, p.sale_price,
            (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image_url
     FROM products p
     WHERE p.category_id = $1 AND p.id != $2 AND p.status = 'active'
     ORDER BY RANDOM() LIMIT $3`,
    [categoryId, productId, limit]
  );
  return rows;
}

export async function create(data: Record<string, unknown>) {
  const product = await queryOne(
    `INSERT INTO products (id, name, name_mn, slug, category_id, brand_id, price, sale_price,
      stock_quantity, description, description_mn, status, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, NOW()) RETURNING *`,
    [data.id, data.name, data.name_mn, data.slug, data.category_id, data.brand_id,
     data.price, data.sale_price ?? null, data.stock_quantity ?? 0,
     data.description ?? null, data.description_mn ?? null, data.status ?? 'active']
  );
  return product;
}

export async function update(id: string, data: Record<string, unknown>) {
  const allowed = ['name','name_mn','slug','category_id','brand_id','price','sale_price',
                   'stock_quantity','description','description_mn','status'];
  const sets: string[] = [];
  const vals: unknown[] = [];
  let i = 1;
  for (const key of allowed) {
    if (data[key] !== undefined) { sets.push(`${key} = $${i++}`); vals.push(data[key]); }
  }
  if (!sets.length) return null;
  vals.push(id);
  return queryOne(`UPDATE products SET ${sets.join(',')} WHERE id = $${i} RETURNING *`, vals);
}

export async function remove(id: string) {
  await query("UPDATE products SET status = 'archived' WHERE id = $1", [id]);
}

export async function upsertSpecs(productId: string, specs: Array<{key:string;value:string;group?:string;sort?:number}>) {
  await query('DELETE FROM product_specs WHERE product_id = $1', [productId]);
  for (let i = 0; i < specs.length; i++) {
    const s = specs[i];
    await query(
      `INSERT INTO product_specs (id, product_id, spec_key, spec_value, spec_group, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [require('uuid').v4(), productId, s.key, s.value, s.group ?? 'General', s.sort ?? i]
    );
  }
}

export async function addImage(productId: string, url: string, isPrimary = false) {
  const { rows: existing } = await query('SELECT COUNT(*) as c FROM product_images WHERE product_id = $1', [productId]);
  const sortOrder = parseInt((existing[0] as any).c);
  return queryOne(
    `INSERT INTO product_images (id, product_id, url, sort_order, is_primary)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [require('uuid').v4(), productId, url, sortOrder, isPrimary]
  );
}

export async function deleteImage(imageId: string) {
  await query('DELETE FROM product_images WHERE id = $1', [imageId]);
}