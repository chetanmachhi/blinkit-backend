import { Cart } from "../models/cart.model";
import { Product } from "../models/product.model";
import { Store } from "../models/store.model";
import { computeBill } from "./pricing.service";
import { AppError } from "../utils/AppError";

interface CartLineView {
  productId: string;
  name: string;
  imageUrl: string;
  unit: string;
  mrp: number;
  price: number;
  quantity: number;
  lineTotal: number;
  maxPerOrder: number;
  stock: number;
  isAvailable: boolean;
  flag?: "unavailable" | "out_of_stock" | "quantity_reduced";
}

interface CartView {
  _id: string;
  storeId: string;
  items: CartLineView[];
  couponCode?: string;
  bill: {
    itemTotal: number;
    discount: number;
    deliveryFee: number;
    handlingFee: number;
    grandTotal: number;
  };
  itemCount: number;
}

export const getCartView = async (
  userId: string,
  storeId: string
): Promise<CartView> => {
  let cart = await Cart.findOne({ userId, storeId });
  if (!cart) {
    cart = await Cart.create({ userId, storeId, items: [] });
  }

  const store = await Store.findById(storeId);
  if (!store) {
    throw new AppError("Store not found", 404);
  }

  const productIds = cart.items.map((i) => i.productId);
  const products = await Product.find({
    _id: { $in: productIds },
    storeId,
  });

  const productMap = new Map(
    products.map((p) => [p._id.toString(), p])
  );

  const lines: CartLineView[] = [];
  let hasChanges = false;

  for (const item of cart.items) {
    const product = productMap.get(item.productId.toString());

    if (!product || product.isDeleted || !product.isAvailable) {
      lines.push({
        productId: item.productId.toString(),
        name: product?.name || "Unknown",
        imageUrl: product?.imageUrl || "",
        unit: product?.unit || "",
        mrp: product?.mrp || 0,
        price: product?.price || 0,
        quantity: item.quantity,
        lineTotal: 0,
        maxPerOrder: product?.maxPerOrder || 0,
        stock: 0,
        isAvailable: false,
        flag: "unavailable",
      });
      continue;
    }

    if (product.stock === 0) {
      lines.push({
        productId: product._id.toString(),
        name: product.name,
        imageUrl: product.imageUrl,
        unit: product.unit,
        mrp: product.mrp,
        price: product.price,
        quantity: item.quantity,
        lineTotal: 0,
        maxPerOrder: product.maxPerOrder,
        stock: 0,
        isAvailable: true,
        flag: "out_of_stock",
      });
      continue;
    }

    let qty = item.quantity;
    let flag: CartLineView["flag"];

    const maxAllowed = Math.min(product.stock, product.maxPerOrder);
    if (qty > maxAllowed) {
      qty = maxAllowed;
      flag = "quantity_reduced";
      hasChanges = true;

      const cartItem = cart.items.find(
        (ci) => ci.productId.toString() === product._id.toString()
      );
      if (cartItem) {
        cartItem.quantity = qty;
      }
    }

    lines.push({
      productId: product._id.toString(),
      name: product.name,
      imageUrl: product.imageUrl,
      unit: product.unit,
      mrp: product.mrp,
      price: product.price,
      quantity: qty,
      lineTotal: product.price * qty,
      maxPerOrder: product.maxPerOrder,
      stock: product.stock,
      isAvailable: true,
      flag,
    });
  }

  if (hasChanges) {
    await cart.save();
  }

  const validItems = lines.filter(
    (l) => !l.flag || l.flag === "quantity_reduced"
  );

  let bill = {
    itemTotal: 0,
    discount: 0,
    deliveryFee: 0,
    handlingFee: 0,
    grandTotal: 0,
  };

  if (validItems.length > 0) {
    try {
      bill = await computeBill(
        validItems.map((l) => ({
          price: l.price,
          quantity: l.quantity,
        })),
        store,
        cart.couponCode,
        userId
      );
    } catch {
      let itemTotal = 0;
      for (const l of validItems) {
        itemTotal += l.price * l.quantity;
      }
      const deliveryFee =
        itemTotal >= store.freeDeliveryAbove ? 0 : store.deliveryFee;
      bill = {
        itemTotal,
        discount: 0,
        deliveryFee,
        handlingFee: store.handlingFee,
        grandTotal: itemTotal + deliveryFee + store.handlingFee,
      };
    }
  }

  return {
    _id: cart._id.toString(),
    storeId,
    items: lines,
    couponCode: cart.couponCode,
    bill,
    itemCount: validItems.reduce((sum, l) => sum + l.quantity, 0),
  };
};
