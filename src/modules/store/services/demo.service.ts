import { Types } from "mongoose";
import {
  Order,
  Product,
  User,
  Store,
  Role,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  AppError,
  generateOrderNumber,
  reserveStock,
  restoreStock,
} from "../../../shared";

export const generateDemoOrders = async (
  storeId: string,
  count: number = 1
): Promise<any[]> => {
  const store = await Store.findById(storeId);
  if (!store) {
    throw new AppError("Store not found", 404);
  }

  const customers = await User.find({ role: Role.CUSTOMER, isActive: true }).limit(20);
  if (customers.length === 0) {
    throw new AppError("No customer accounts available for demo orders. Run seed first.", 400);
  }

  const availableProducts = await Product.find({
    storeId,
    stock: { $gt: 5 },
    isAvailable: true,
    isDeleted: false,
  }).limit(30);

  if (availableProducts.length === 0) {
    throw new AppError("No in-stock products available to place demo orders.", 400);
  }

  const createdOrders: any[] = [];

  for (let i = 0; i < count; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];

    const itemCount = Math.min(
      Math.floor(Math.random() * 3) + 1,
      availableProducts.length
    );
    const shuffled = [...availableProducts].sort(() => 0.5 - Math.random());
    const selectedProducts = shuffled.slice(0, itemCount);

    const items = selectedProducts.map((p) => {
      const quantity = Math.floor(Math.random() * 2) + 1;
      return {
        productId: p._id,
        name: p.name,
        imageUrl: p.imageUrl,
        unit: p.unit,
        mrp: p.mrp,
        price: p.price,
        quantity,
        lineTotal: p.price * quantity,
      };
    });

    const itemTotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const deliveryFee = itemTotal >= store.freeDeliveryAbove ? 0 : store.deliveryFee;
    const handlingFee = store.handlingFee;
    const grandTotal = itemTotal + deliveryFee + handlingFee;

    const stockItems = items.map((i) => ({
      productId: i.productId.toString(),
      quantity: i.quantity,
      storeId,
    }));

    await reserveStock(stockItems);

    const now = new Date();
    const etaMinutes = store.avgPrepMinutes + 15;
    const estimatedDeliveryAt = new Date(now.getTime() + etaMinutes * 60 * 1000);

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      userId: customer._id,
      storeId: store._id,
      customer: {
        name: customer.name || "Demo Customer",
        phone: customer.phone,
      },
      items,
      bill: {
        itemTotal,
        discount: 0,
        deliveryFee,
        handlingFee,
        grandTotal,
      },
      totalAmount: grandTotal,
      status: OrderStatus.PLACED,
      statusHistory: [
        {
          status: OrderStatus.PLACED,
          at: now,
          by: null,
          note: "Demo order created",
        },
      ],
      paymentMethod: Math.random() > 0.5 ? PaymentMethod.COD : PaymentMethod.ONLINE,
      paymentStatus: PaymentStatus.PENDING,
      deliveryAddress: {
        label: "Home",
        addressLine: "Flat 402, Sunshine Apartments, Demo Colony",
        landmark: "Near City Park",
        coordinates: {
          lat: store.location.coordinates[1] + (Math.random() - 0.5) * 0.02,
          lng: store.location.coordinates[0] + (Math.random() - 0.5) * 0.02,
        },
      },
      source: "demo",
      estimatedDeliveryAt,
    });

    createdOrders.push(order);
  }

  return createdOrders;
};

export const resetAllDemoOrders = async (storeId: string): Promise<{ deletedCount: number }> => {
  const demoOrders = await Order.find({ storeId, source: "demo" });

  for (const order of demoOrders) {
    if (order.status !== OrderStatus.CANCELLED) {
      const stockItems = order.items.map((i) => ({
        productId: i.productId.toString(),
        quantity: i.quantity,
        storeId: order.storeId.toString(),
      }));
      await restoreStock(stockItems);
    }
  }

  const result = await Order.deleteMany({ storeId, source: "demo" });
  return { deletedCount: result.deletedCount || 0 };
};
