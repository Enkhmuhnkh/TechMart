import { Request, Response, NextFunction } from 'express';
import * as productsService from './products.service';
import { cloudinary } from '../../config/cloudinary';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await productsService.listProducts({
      search: req.query.q as string,
      category: req.query.category as string,
      brand: req.query.brand as string,
      minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      sortBy: req.query.sortBy as string,
      sortDir: req.query.sortDir as 'asc' | 'desc',
      inStock: req.query.inStock === 'true',
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
    });
    res.json({ success: true, data: (result as any).data ?? [], meta: (result as any).meta });
  } catch (err) { next(err); }
}

export async function getBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productsService.getProductBySlug(req.params.slug);
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
}

export async function compare(req: Request, res: Response, next: NextFunction) {
  try {
    const ids = String(req.query.ids || '').split(',').filter(Boolean);
    const products = await productsService.compareProducts(ids);
    res.json({ success: true, data: products });
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productsService.createProduct(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productsService.updateProduct(req.params.id, req.body);
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await productsService.deleteProduct(req.params.id);
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
}

export async function updateSpecs(req: Request, res: Response, next: NextFunction) {
  try {
    await productsService.updateSpecs(req.params.id, req.body.specs);
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
}

async function uploadToCloudinary(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'techmart', resource_type: 'image', transformation: [{ width: 900, crop: 'limit', quality: 'auto:good' }] },
      (err, result) => { if (err || !result) reject(err); else resolve(result.secure_url); }
    );
    stream.end(buffer);
  });
}

export async function uploadImage(req: Request, res: Response, next: NextFunction) {
  try {
    const files = (req.files as Express.Multer.File[]) || (req.file ? [req.file] : []);
    if (!files.length) throw new Error('No file uploaded');

    const urls: string[] = [];
    for (const file of files) {
      urls.push(await uploadToCloudinary(file.buffer));
    }

    if (urls.length === 1) {
      const image = await productsService.addImage(req.params.id, urls[0], req.body.isPrimary === 'true');
      return res.json({ success: true, data: image });
    }
    const images = await productsService.addImages(req.params.id, urls);
    res.json({ success: true, data: images });
  } catch (err) { next(err); }
}

export async function deleteImage(req: Request, res: Response, next: NextFunction) {
  try {
    await productsService.deleteImage(req.params.imageId);
    res.json({ success: true, data: null });
  } catch (err) { next(err); }
}

export async function getColors(req: Request, res: Response, next: NextFunction) {
  try {
    const colors = await productsService.getColors(req.params.id);
    res.json({ success: true, data: colors });
  } catch (err) { next(err); }
}

export async function updateColors(req: Request, res: Response, next: NextFunction) {
  try {
    const colors = await productsService.updateColors(req.params.id, req.body.colors || []);
    res.json({ success: true, data: colors });
  } catch (err) { next(err); }
}
