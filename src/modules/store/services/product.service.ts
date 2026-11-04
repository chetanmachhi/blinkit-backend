import { Types } from "mongoose";
import {
  Product,
  IProduct,
  Category,
  AppError,
  ProductSort,
  adjustStock,
  parsePagination,
  buildPaginationResponse,
} from "../../../shared";

export const getProductsPaginated = async (
  storeId: string,
  query: any
): Promise<any> => {
  const { page, limit, skip } = parsePagination(query);

  const filter: any = { storeId };

  if (query.includeDeleted !== "true") {
    filter.isDeleted = false;
  }

  if (query.isAvailable !== undefined) {
    filter.isAvailable = query.isAvailable === "true";
  }

  if (query.categoryId) {
    filter.categoryId = query.categoryId;
  }

  if (query.brand) {
    filter.brand = { $regex: query.brand, $options: "i" };
  }

  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) {
      filter.price.$gte = parseInt(query.minPrice, 10);
    }
    if (query.maxPrice) {
      filter.price.$lte = parseInt(query.maxPrice, 10);
    }
  }

  if (query.lowStock === "true") {
    filter.$expr = { $lte: ["$stock", "$lowStockThreshold"] };
  }

  if (query.q) {
    const q = query.q.trim();
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { brand: { $regex: q, $options: "i" } },
      { sku: { $regex: q, $options: "i" } },
      { barcode: { $regex: q, $options: "i" } },
      { tags: { $in: [new RegExp(q, "i")] } },
    ];
  }

  let sortObj: any = { createdAt: -1 };
  if (query.sort) {
    switch (query.sort) {
      case ProductSort.PRICE_ASC:
        sortObj = { price: 1 };
        break;
      case ProductSort.PRICE_DESC:
        sortObj = { price: -1 };
        break;
      case ProductSort.NEWEST:
        sortObj = { createdAt: -1 };
        break;
      case ProductSort.DISCOUNT:
        sortObj = { discountPercent: -1 };
        break;
    }
  }

  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate("categoryId", "name slug")
      .sort(sortObj)
      .skip(skip)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  return {
    items,
    pagination: buildPaginationResponse(total, page, limit),
  };
};

export const getProductById = async (
  storeId: string,
  productId: string
): Promise<IProduct> => {
  const product = await Product.findOne({ _id: productId, storeId }).populate(
    "categoryId",
    "name slug"
  );
  if (!product) {
    throw new AppError("Product not found", 404);
  }
  return product;
};

export const createNewProduct = async (
  storeId: string,
  data: any
): Promise<IProduct> => {
  if (data.price > data.mrp) {
    throw new AppError("Price cannot exceed MRP", 400);
  }

  const category = await Category.findOne({
    _id: data.categoryId,
    isDeleted: false,
  });
  if (!category) {
    throw new AppError("Category not found", 400);
  }

  return Product.create({
    ...data,
    storeId,
    isAvailable: true,
    isDeleted: false,
  });
};

export const updateProductDetails = async (
  storeId: string,
  productId: string,
  data: any
): Promise<IProduct> => {
  const product = await Product.findOne({ _id: productId, storeId });
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const nextMrp = data.mrp !== undefined ? data.mrp : product.mrp;
  const nextPrice = data.price !== undefined ? data.price : product.price;

  if (nextPrice > nextMrp) {
    throw new AppError("Price cannot exceed MRP", 400);
  }

  if (data.categoryId) {
    const category = await Category.findOne({
      _id: data.categoryId,
      isDeleted: false,
    });
    if (!category) {
      throw new AppError("Category not found", 400);
    }
  }

  const updated = await Product.findOneAndUpdate(
    { _id: productId, storeId },
    { $set: data },
    { new: true, runValidators: true }
  ).populate("categoryId", "name slug");

  return updated!;
};

export const quickUpdateProduct = async (
  storeId: string,
  productId: string,
  data: {
    price?: number;
    mrp?: number;
    stock?: number;
    isAvailable?: boolean;
  }
): Promise<IProduct> => {
  const product = await Product.findOne({ _id: productId, storeId });
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const nextMrp = data.mrp !== undefined ? data.mrp : product.mrp;
  const nextPrice = data.price !== undefined ? data.price : product.price;

  if (nextPrice > nextMrp) {
    throw new AppError("Price cannot exceed MRP", 400);
  }

  if (data.stock !== undefined && data.stock < 0) {
    throw new AppError("Stock cannot be negative", 400);
  }

  const updated = await Product.findOneAndUpdate(
    { _id: productId, storeId },
    { $set: data },
    { new: true, runValidators: true }
  );

  return updated!;
};

export const updateProductStockOnly = async (
  storeId: string,
  productId: string,
  data: { stock?: number; delta?: number }
): Promise<IProduct> => {
  return adjustStock(productId, storeId, data);
};

export const softDeleteProduct = async (
  storeId: string,
  productId: string
): Promise<void> => {
  const result = await Product.findOneAndUpdate(
    { _id: productId, storeId, isDeleted: false },
    { $set: { isDeleted: true, isAvailable: false } }
  );
  if (!result) {
    throw new AppError("Product not found or already deleted", 404);
  }
};

export const restoreSoftDeletedProduct = async (
  storeId: string,
  productId: string
): Promise<IProduct> => {
  const result = await Product.findOneAndUpdate(
    { _id: productId, storeId, isDeleted: true },
    { $set: { isDeleted: false, isAvailable: true } },
    { new: true }
  );
  if (!result) {
    throw new AppError("Product not found or not deleted", 404);
  }
  return result;
};

export const getLowStockProductsList = async (storeId: string): Promise<IProduct[]> => {
  return Product.find({
    storeId,
    isDeleted: false,
    $expr: { $lte: ["$stock", "$lowStockThreshold"] },
  })
    .populate("categoryId", "name slug")
    .sort({ stock: 1 });
};

export const exportProductsList = async (storeId: string): Promise<any[]> => {
  const products = await Product.find({ storeId, isDeleted: false })
    .populate("categoryId", "name slug")
    .sort({ name: 1 });

  return products.map((p) => {
    const cat = p.categoryId as any;
    return {
      id: p._id.toString(),
      name: p.name,
      category: cat?.name || "",
      categorySlug: cat?.slug || "",
      brand: p.brand,
      unit: p.unit,
      mrpRupees: (p.mrp / 100).toFixed(2),
      priceRupees: (p.price / 100).toFixed(2),
      mrpPaise: p.mrp,
      pricePaise: p.price,
      stock: p.stock,
      sku: p.sku || "",
      barcode: p.barcode || "",
      isAvailable: p.isAvailable,
      imageUrl: p.imageUrl,
    };
  });
};

export interface BulkImportRowInput {
  name: string;
  categorySlug: string;
  brand?: string;
  unit: string;
  mrp: number;
  price: number;
  stock: number;
  imageUrl?: string;
  description?: string;
}

export interface BulkImportRowResult {
  row: number;
  name: string;
  status: "created" | "updated" | "error";
  message: string;
}

export const processBulkImport = async (
  storeId: string,
  dryRun: boolean,
  rows: BulkImportRowInput[]
): Promise<{
  dryRun: boolean;
  totalRows: number;
  createdCount: number;
  updatedCount: number;
  errorCount: number;
  results: BulkImportRowResult[];
}> => {
  const categories = await Category.find({ isDeleted: false });
  const categoryMap = new Map<string, Types.ObjectId>();
  categories.forEach((c) => categoryMap.set(c.slug.toLowerCase(), c._id));

  const results: BulkImportRowResult[] = [];
  let createdCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  for (let idx = 0; idx < rows.length; idx++) {
    const rowNum = idx + 1;
    const r = rows[idx];

    try {
      if (!r.name || !r.unit || !r.mrp || !r.price || r.stock === undefined) {
        throw new Error("Missing mandatory fields: name, unit, mrp, price, stock");
      }

      if (r.price > r.mrp) {
        throw new Error("Price cannot be greater than MRP");
      }

      const catId = categoryMap.get(r.categorySlug?.toLowerCase());
      if (!catId) {
        throw new Error(`Category slug "${r.categorySlug}" does not exist`);
      }

      const existing = await Product.findOne({
        storeId,
        name: r.name.trim(),
        unit: r.unit.trim(),
      });

      if (existing) {
        if (!dryRun) {
          existing.categoryId = catId;
          existing.mrp = r.mrp;
          existing.price = r.price;
          existing.stock = r.stock;
          if (r.brand) existing.brand = r.brand;
          if (r.imageUrl) existing.imageUrl = r.imageUrl;
          if (r.description) existing.description = r.description;
          existing.isDeleted = false;
          existing.isAvailable = true;
          await existing.save();
        }
        updatedCount++;
        results.push({
          row: rowNum,
          name: r.name,
          status: "updated",
          message: "Matched existing product; updated values",
        });
      } else {
        if (!dryRun) {
          await Product.create({
            storeId,
            name: r.name.trim(),
            unit: r.unit.trim(),
            categoryId: catId,
            brand: r.brand || "",
            mrp: r.mrp,
            price: r.price,
            stock: r.stock,
            imageUrl: r.imageUrl || "",
            description: r.description || "",
            isAvailable: true,
            isDeleted: false,
          });
        }
        createdCount++;
        results.push({
          row: rowNum,
          name: r.name,
          status: "created",
          message: "New product created successfully",
        });
      }
    } catch (err: any) {
      errorCount++;
      results.push({
        row: rowNum,
        name: r.name || "Unknown",
        status: "error",
        message: err.message || "Failed to process row",
      });
    }
  }

  return {
    dryRun,
    totalRows: rows.length,
    createdCount,
    updatedCount,
    errorCount,
    results,
  };
};
