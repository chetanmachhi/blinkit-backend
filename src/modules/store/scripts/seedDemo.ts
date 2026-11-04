import mongoose, { Types } from "mongoose";
import {
  User,
  Store,
  Product,
  Order,
  Role,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  generateOrderNumber,
} from "../../../shared";
import config from "../config/env";

const firstNames = [
  "Aarav", "Diya", "Rohan", "Ananya", "Vikram", "Priya", "Kabir", "Sneha",
  "Aditya", "Neha", "Arjun", "Tanvi", "Siddharth", "Ishita", "Varun",
  "Meera", "Rahul", "Pooja", "Gaurav", "Simran", "Karan", "Kavya",
  "Nikhil", "Shreya", "Manish", "Divya", "Suresh", "Ritu", "Harish", "Swati",
];

const lastNames = [
  "Sharma", "Patel", "Verma", "Rao", "Singh", "Nair", "Mehta", "Iyer",
  "Reddy", "Gupta", "Kapoor", "Chopra", "Bose", "Joshi", "Bhat",
];

const seedDemo = async (): Promise<void> => {
  try {
    await mongoose.connect(config.MONGO_URI);
    console.log("[SeedDemo] Connected to MongoDB");

    let store = await Store.findById(config.DEFAULT_STORE_ID);
    if (!store) {
      store = await Store.findOne({ isActive: true });
    }

    if (!store) {
      console.error("[SeedDemo] No active store found. Seed backend first.");
      process.exit(1);
    }

    const products = await Product.find({
      storeId: store._id,
      isDeleted: false,
    });

    if (products.length === 0) {
      console.error("[SeedDemo] No products found. Seed backend first.");
      process.exit(1);
    }

    console.log("[SeedDemo] Cleaning up prior demo data...");
    await Order.deleteMany({ storeId: store._id, source: "demo" });
    await User.deleteMany({ email: { $regex: /^demo_cust_.*@blinkit\.demo$/ } });

    console.log("[SeedDemo] Creating 30 demo customers...");
    const customerDocs = [];
    for (let i = 0; i < 30; i++) {
      const fName = firstNames[i % firstNames.length];
      const lName = lastNames[i % lastNames.length];
      const phone = `91000${String(i).padStart(5, "0")}`;
      customerDocs.push({
        name: `${fName} ${lName}`,
        phone,
        email: `demo_cust_${i + 1}@blinkit.demo`,
        role: Role.CUSTOMER,
        isActive: true,
        isPhoneVerified: true,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 45) * 86400000),
      });
    }

    const createdCustomers = await User.insertMany(customerDocs);
    console.log(`[SeedDemo] Seeded ${createdCustomers.length} demo customers`);

    console.log("[SeedDemo] Generating 120 realistic historical orders over last 30 days...");
    const statusesDistribution: OrderStatus[] = [
      ...Array(75).fill(OrderStatus.DELIVERED),
      ...Array(15).fill(OrderStatus.CANCELLED),
      ...Array(10).fill(OrderStatus.PLACED),
      ...Array(8).fill(OrderStatus.ACCEPTED),
      ...Array(7).fill(OrderStatus.PREPARING),
      ...Array(5).fill(OrderStatus.OUT_FOR_DELIVERY),
    ];

    const orderDocs: any[] = [];
    const now = Date.now();

    for (let i = 0; i < 120; i++) {
      const targetStatus = statusesDistribution[i % statusesDistribution.length];
      const customer = createdCustomers[Math.floor(Math.random() * createdCustomers.length)];

      let daysAgo = 0;
      if (
        targetStatus === OrderStatus.DELIVERED ||
        targetStatus === OrderStatus.CANCELLED
      ) {
        daysAgo = Math.floor(Math.random() * 30);
      } else {
        daysAgo = 0;
      }

      const orderTime = new Date(
        now - daysAgo * 86400000 - Math.floor(Math.random() * 36000000)
      );

      const itemCount = Math.floor(Math.random() * 3) + 1;
      const shuffled = [...products].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, itemCount);

      const items = selected.map((p) => {
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
      const deliveryFee =
        itemTotal >= store.freeDeliveryAbove ? 0 : store.deliveryFee;
      const handlingFee = store.handlingFee;
      const grandTotal = itemTotal + deliveryFee + handlingFee;

      const isCod = Math.random() > 0.4;
      const paymentMethod = isCod ? PaymentMethod.COD : PaymentMethod.ONLINE;
      let paymentStatus = PaymentStatus.PENDING;
      if (targetStatus === OrderStatus.DELIVERED) {
        paymentStatus = PaymentStatus.PAID;
      } else if (targetStatus === OrderStatus.CANCELLED && !isCod) {
        paymentStatus = PaymentStatus.REFUNDED;
      }

      const statusHistory = [
        {
          status: OrderStatus.PLACED,
          at: orderTime,
          by: null,
          note: "Order placed by customer",
        },
      ];

      let acceptedAt: Date | undefined;
      let deliveredAt: Date | undefined;
      let cancelledAt: Date | undefined;
      let prepMinutes = 15;

      if (targetStatus !== OrderStatus.PLACED) {
        if (targetStatus === OrderStatus.CANCELLED && Math.random() > 0.5) {
          cancelledAt = new Date(orderTime.getTime() + 3 * 60000);
          statusHistory.push({
            status: OrderStatus.CANCELLED,
            at: cancelledAt,
            by: null,
            note: "Customer cancelled",
          });
        } else {
          acceptedAt = new Date(orderTime.getTime() + 2 * 60000);
          statusHistory.push({
            status: OrderStatus.ACCEPTED,
            at: acceptedAt,
            by: null,
            note: "Store accepted",
          });

          if (
            targetStatus === OrderStatus.PREPARING ||
            targetStatus === OrderStatus.OUT_FOR_DELIVERY ||
            targetStatus === OrderStatus.DELIVERED
          ) {
            statusHistory.push({
              status: OrderStatus.PREPARING,
              at: new Date(acceptedAt.getTime() + 5 * 60000),
              by: null,
              note: "Packing items",
            });
          }

          if (
            targetStatus === OrderStatus.OUT_FOR_DELIVERY ||
            targetStatus === OrderStatus.DELIVERED
          ) {
            statusHistory.push({
              status: OrderStatus.OUT_FOR_DELIVERY,
              at: new Date(acceptedAt.getTime() + 12 * 60000),
              by: null,
              note: "Out for delivery with rider",
            });
          }

          if (targetStatus === OrderStatus.DELIVERED) {
            deliveredAt = new Date(acceptedAt.getTime() + 22 * 60000);
            statusHistory.push({
              status: OrderStatus.DELIVERED,
              at: deliveredAt,
              by: null,
              note: "Delivered to doorstep",
            });
          } else if (targetStatus === OrderStatus.CANCELLED) {
            cancelledAt = new Date(acceptedAt.getTime() + 10 * 60000);
            statusHistory.push({
              status: OrderStatus.CANCELLED,
              at: cancelledAt,
              by: null,
              note: "Items out of stock",
            });
          }
        }
      }

      orderDocs.push({
        orderNumber: generateOrderNumber(),
        userId: customer._id,
        storeId: store._id,
        customer: {
          name: customer.name,
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
        status: targetStatus,
        statusHistory,
        paymentMethod,
        paymentStatus,
        deliveryAddress: {
          label: "Home",
          addressLine: `Apartment ${100 + i}, Subhanpura, Vadodara`,
          landmark: "Near Genda Circle",
          coordinates: {
            lat: store.location.coordinates[1] + (Math.random() - 0.5) * 0.03,
            lng: store.location.coordinates[0] + (Math.random() - 0.5) * 0.03,
          },
        },
        source: "demo",
        idempotencyKey: `demo-key-${i}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        acceptedAt,
        prepMinutes,
        deliveredAt,
        cancelledAt,
        cancelReason:
          targetStatus === OrderStatus.CANCELLED ? "Out of stock / customer changed mind" : undefined,
        cancelledBy:
          targetStatus === OrderStatus.CANCELLED ? (Math.random() > 0.5 ? "store" : "customer") : undefined,
        createdAt: orderTime,
        updatedAt: deliveredAt || cancelledAt || orderTime,
      });
    }

    await Order.insertMany(orderDocs);
    console.log(`[SeedDemo] Successfully seeded ${orderDocs.length} realistic orders.`);
    console.log("[SeedDemo] Historical charts, revenue KPIs, and live orders now populated.");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("[SeedDemo] Failed:", error);
    process.exit(1);
  }
};

seedDemo();
