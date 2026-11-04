import { Category, ICategory, Product, AppError } from "../../../shared";

export const getCategoriesList = async (asTree: boolean = false): Promise<any> => {
  const categories = await Category.find({ isDeleted: false }).sort({ sortOrder: 1, name: 1 });
  if (!asTree) {
    return categories;
  }

  const map = new Map<string, any>();
  const roots: any[] = [];

  categories.forEach((cat) => {
    map.set(cat._id.toString(), {
      ...cat.toObject(),
      children: [],
    });
  });

  categories.forEach((cat) => {
    const node = map.get(cat._id.toString());
    if (cat.parentId && map.has(cat.parentId.toString())) {
      map.get(cat.parentId.toString()).children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
};

export const createCategory = async (data: {
  name: string;
  slug: string;
  imageUrl?: string;
  parentId?: string | null;
  sortOrder?: number;
}): Promise<ICategory> => {
  const existing = await Category.findOne({ slug: data.slug });
  if (existing) {
    throw new AppError("A category with this slug already exists", 409);
  }

  return Category.create({
    name: data.name,
    slug: data.slug,
    imageUrl: data.imageUrl || "",
    parentId: data.parentId || null,
    sortOrder: data.sortOrder ?? 0,
    isActive: true,
    isDeleted: false,
  });
};

export const updateCategory = async (
  categoryId: string,
  data: any
): Promise<ICategory> => {
  if (data.slug) {
    const existing = await Category.findOne({
      slug: data.slug,
      _id: { $ne: categoryId },
    });
    if (existing) {
      throw new AppError("Category slug already taken", 409);
    }
  }

  const category = await Category.findOneAndUpdate(
    { _id: categoryId, isDeleted: false },
    { $set: data },
    { new: true, runValidators: true }
  );

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  return category;
};

export const softDeleteCategory = async (categoryId: string): Promise<void> => {
  const activeProductsCount = await Product.countDocuments({
    categoryId,
    isDeleted: false,
  });

  if (activeProductsCount > 0) {
    throw new AppError(
      `Cannot delete category. There are ${activeProductsCount} active products linked to it.`,
      409
    );
  }

  const category = await Category.findOneAndUpdate(
    { _id: categoryId, isDeleted: false },
    { $set: { isDeleted: true, isActive: false } },
    { new: true }
  );

  if (!category) {
    throw new AppError("Category not found", 404);
  }
};

export const reorderCategories = async (
  items: { id: string; sortOrder: number }[]
): Promise<void> => {
  const updates = items.map((item) =>
    Category.updateOne({ _id: item.id }, { $set: { sortOrder: item.sortOrder } })
  );
  await Promise.all(updates);
};
