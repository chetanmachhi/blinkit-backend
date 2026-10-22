import mongoose from "mongoose";
import config from "../config/env";
import { Store } from "../models/store.model";
import { User } from "../models/user.model";
import { Category } from "../models/category.model";
import { Product } from "../models/product.model";
import { Coupon } from "../models/coupon.model";
import { Role, CouponType } from "../constants/enums";
import { hashPassword } from "../utils/hash.util";

const seed = async (): Promise<void> => {
  try {
    await mongoose.connect(config.MONGO_URI);
    console.log("[Seed] Connected to MongoDB");

    let store = await Store.findOne({ phone: "9876543210" });
    if (!store) {
      store = await Store.create({
        _id: new mongoose.Types.ObjectId("6ad8eebdfce460c6fde26605"),
        name: "Blinkit Dark Store - Indiranagar",
        phone: "9876543210",
        address: "100 Feet Road, Indiranagar, Bengaluru, Karnataka 560038",
        isActive: true,
        location: {
          type: "Point",
          coordinates: [77.6412, 12.9716],
        },
        deliveryRadiusKm: 50,
        minOrderAmount: 9900,
        deliveryFee: 2500,
        freeDeliveryAbove: 19900,
        handlingFee: 400,
        avgPrepMinutes: 10,
        opensAt: "00:00",
        closesAt: "23:59",
        timezone: "Asia/Kolkata",
      });
      console.log(`[Seed] Created Store with ID: ${store._id}`);
    } else {
      store.deliveryRadiusKm = 50;
      store.opensAt = "00:00";
      store.closesAt = "23:59";
      await store.save();
      console.log(`[Seed] Store exists with ID: ${store._id}`);
    }

    const adminEmail = config.ADMIN_BOOTSTRAP_EMAIL;
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      const passwordHash = await hashPassword(config.ADMIN_BOOTSTRAP_PASSWORD);
      admin = await User.create({
        name: "System Admin",
        phone: "9999999999",
        email: adminEmail,
        passwordHash,
        role: Role.ADMIN,
        storeIds: [store._id],
        isActive: true,
        isPhoneVerified: true,
      });
      console.log(`[Seed] Created Admin: ${admin.email}`);
    } else {
      console.log(`[Seed] Admin exists: ${admin.email}`);
    }

    const categoriesData = [
      {
        name: "Dairy, Bread & Eggs",
        slug: "dairy-and-breakfast",
        imageUrl: "https://images.unsplash.com/photo-1528732263440-4dd1a18a4cc2?w=500&q=80",
        sortOrder: 1,
      },
      {
        name: "Fresh Fruits & Veggies",
        slug: "fresh-produce",
        imageUrl: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500&q=80",
        sortOrder: 2,
      },
      {
        name: "Snacks & Munchies",
        slug: "snacks-and-munchies",
        imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&q=80",
        sortOrder: 3,
      },
      {
        name: "Cold Drinks & Juices",
        slug: "cold-drinks-and-juices",
        imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&q=80",
        sortOrder: 4,
      },
      {
        name: "Instant & Packaged",
        slug: "instant-and-packaged",
        imageUrl: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=500&q=80",
        sortOrder: 5,
      },
      {
        name: "Tea, Coffee & Drinks",
        slug: "tea-coffee-drinks",
        imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&q=80",
        sortOrder: 6,
      },
      {
        name: "Chocolates & Sweets",
        slug: "chocolates-and-sweets",
        imageUrl: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=500&q=80",
        sortOrder: 7,
      },
      {
        name: "Cleaning Essentials",
        slug: "cleaning-essentials",
        imageUrl: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&q=80",
        sortOrder: 8,
      },
    ];

    const categoryMap = new Map<string, mongoose.Types.ObjectId>();
    for (const cat of categoriesData) {
      const updatedCat = await Category.findOneAndUpdate(
        { slug: cat.slug },
        { $set: cat },
        { upsert: true, new: true }
      );
      categoryMap.set(cat.slug, updatedCat._id);
    }
    console.log("[Seed] Categories seeded & updated");

    const dairyId = categoryMap.get("dairy-and-breakfast")!;
    const produceId = categoryMap.get("fresh-produce")!;
    const snacksId = categoryMap.get("snacks-and-munchies")!;
    const drinksId = categoryMap.get("cold-drinks-and-juices")!;
    const instantId = categoryMap.get("instant-and-packaged")!;
    const teaId = categoryMap.get("tea-coffee-drinks")!;
    const sweetsId = categoryMap.get("chocolates-and-sweets")!;
    const cleaningId = categoryMap.get("cleaning-essentials")!;

    const productsData = [
      {
        storeId: store._id,
        categoryId: dairyId,
        name: "Amul Taaza Fresh Toned Milk",
        description: "Fresh pasteurized toned milk rich in calcium and essential vitamins",
        brand: "Amul",
        unit: "500 ml",
        mrp: 3500,
        price: 3300,
        stock: 80,
        maxPerOrder: 6,
        imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&q=80",
        images: ["https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&q=80"],
        tags: ["milk", "dairy", "amul", "fresh"],
      },
      {
        storeId: store._id,
        categoryId: dairyId,
        name: "Amul Butter Pasteurised",
        description: "Delicious creamy pasteurized butter made from pure milk",
        brand: "Amul",
        unit: "100 g",
        mrp: 5800,
        price: 5600,
        stock: 65,
        maxPerOrder: 4,
        imageUrl: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500&q=80",
        images: ["https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500&q=80"],
        tags: ["butter", "dairy", "breakfast"],
      },
      {
        storeId: store._id,
        categoryId: dairyId,
        name: "Farm Fresh White Eggs",
        description: "Healthy and farm-fresh protein-rich table eggs",
        brand: "Eggoz",
        unit: "6 pcs",
        mrp: 6500,
        price: 5400,
        stock: 50,
        maxPerOrder: 4,
        imageUrl: "https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=500&q=80",
        images: ["https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=500&q=80"],
        tags: ["eggs", "protein", "breakfast"],
      },
      {
        storeId: store._id,
        categoryId: dairyId,
        name: "100% Whole Wheat Bread",
        description: "Healthy freshly baked brown bread prepared with whole wheat flour",
        brand: "Britannia",
        unit: "400 g",
        mrp: 5000,
        price: 4500,
        stock: 40,
        maxPerOrder: 3,
        imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80",
        images: ["https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80"],
        tags: ["bread", "wheat", "breakfast"],
      },
      {
        storeId: store._id,
        categoryId: dairyId,
        name: "Fresh Malai Paneer",
        description: "Soft, succulent cottage cheese made from fresh buffalo milk",
        brand: "Amul",
        unit: "200 g",
        mrp: 9500,
        price: 8800,
        stock: 45,
        maxPerOrder: 4,
        imageUrl: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&q=80",
        images: ["https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&q=80"],
        tags: ["paneer", "dairy", "cheese"],
      },

      {
        storeId: store._id,
        categoryId: produceId,
        name: "Fresh Hybrid Red Tomatoes",
        description: "Handpicked juicy, firm, ripe red tomatoes from local farms",
        brand: "Fresh Farms",
        unit: "1 kg",
        mrp: 4500,
        price: 3200,
        stock: 90,
        maxPerOrder: 5,
        imageUrl: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&q=80",
        images: ["https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&q=80"],
        tags: ["tomato", "vegetables", "fresh"],
      },
      {
        storeId: store._id,
        categoryId: produceId,
        name: "Golden Baby Potatoes",
        description: "Cleaned and sorted golden potatoes ideal for daily cooking",
        brand: "Fresh Farms",
        unit: "1 kg",
        mrp: 4500,
        price: 3600,
        stock: 120,
        maxPerOrder: 5,
        imageUrl: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&q=80",
        images: ["https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&q=80"],
        tags: ["potato", "vegetables", "fresh"],
      },
      {
        storeId: store._id,
        categoryId: produceId,
        name: "Fresh Red Onions",
        description: "Crisp and flavorful red onions essential for all curries",
        brand: "Fresh Farms",
        unit: "1 kg",
        mrp: 5000,
        price: 4200,
        stock: 110,
        maxPerOrder: 5,
        imageUrl: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=500&q=80",
        images: ["https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=500&q=80"],
        tags: ["onion", "vegetables", "fresh"],
      },
      {
        storeId: store._id,
        categoryId: produceId,
        name: "Robusta Ripe Bananas",
        description: "Sweet and naturally ripened energy-rich bananas",
        brand: "Fresh Farms",
        unit: "1 kg (6 pcs)",
        mrp: 6000,
        price: 4800,
        stock: 70,
        maxPerOrder: 4,
        imageUrl: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&q=80",
        images: ["https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&q=80"],
        tags: ["banana", "fruits", "fresh"],
      },
      {
        storeId: store._id,
        categoryId: produceId,
        name: "Shimla Royal Apples",
        description: "Crunchy sweet apples hand-picked from Himachal orchards",
        brand: "Fresh Farms",
        unit: "4 pcs",
        mrp: 16000,
        price: 13900,
        stock: 45,
        maxPerOrder: 4,
        imageUrl: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&q=80",
        images: ["https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&q=80"],
        tags: ["apple", "fruits", "shimla"],
      },

      {
        storeId: store._id,
        categoryId: snacksId,
        name: "Lay's Classic Salted Chips",
        description: "Crispy thinly sliced golden salted potato chips",
        brand: "Lay's",
        unit: "50 g",
        mrp: 2000,
        price: 2000,
        stock: 150,
        maxPerOrder: 10,
        imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&q=80",
        images: ["https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&q=80"],
        tags: ["chips", "snacks", "lays"],
      },
      {
        storeId: store._id,
        categoryId: snacksId,
        name: "Doritos Sweet Chilli Nachos",
        description: "Crunchy triangular corn tortilla chips with sweet chili tang",
        brand: "Doritos",
        unit: "82 g",
        mrp: 5000,
        price: 4500,
        stock: 80,
        maxPerOrder: 6,
        imageUrl: "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=500&q=80",
        images: ["https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=500&q=80"],
        tags: ["nachos", "chips", "snacks"],
      },
      {
        storeId: store._id,
        categoryId: snacksId,
        name: "Haldiram's Bhujia Sev",
        description: "Traditional spicy crispy fried gram flour snack",
        brand: "Haldiram's",
        unit: "200 g",
        mrp: 6000,
        price: 5500,
        stock: 90,
        maxPerOrder: 6,
        imageUrl: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=500&q=80",
        images: ["https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=500&q=80"],
        tags: ["bhujia", "namkeen", "haldirams"],
      },

      {
        storeId: store._id,
        categoryId: drinksId,
        name: "Raw Pressery Tender Coconut Water",
        description: "100% natural refreshing tender coconut water with electrolytes",
        brand: "Raw Pressery",
        unit: "200 ml",
        mrp: 6000,
        price: 5000,
        stock: 80,
        maxPerOrder: 8,
        imageUrl: "https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=500&q=80",
        images: ["https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=500&q=80"],
        tags: ["coconut", "juice", "beverage"],
      },
      {
        storeId: store._id,
        categoryId: drinksId,
        name: "Coca-Cola Original Taste",
        description: "The world's favorite refreshing sparkling soft drink",
        brand: "Coca-Cola",
        unit: "750 ml",
        mrp: 4500,
        price: 4000,
        stock: 100,
        maxPerOrder: 6,
        imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80",
        images: ["https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80"],
        tags: ["coke", "soda", "cold drink"],
      },
      {
        storeId: store._id,
        categoryId: drinksId,
        name: "Real Fruit Power Mixed Fruit",
        description: "Refreshing natural mixed fruit juice rich in Vitamin C",
        brand: "Real",
        unit: "1 L",
        mrp: 13000,
        price: 11500,
        stock: 60,
        maxPerOrder: 4,
        imageUrl: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&q=80",
        images: ["https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&q=80"],
        tags: ["juice", "fruit", "real"],
      },

      {
        storeId: store._id,
        categoryId: instantId,
        name: "Maggi 2-Minute Masala Noodles",
        description: "Classic favorite instant masala noodles pack of 4",
        brand: "Maggi",
        unit: "280 g",
        mrp: 6000,
        price: 5600,
        stock: 140,
        maxPerOrder: 6,
        imageUrl: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=500&q=80",
        images: ["https://images.unsplash.com/photo-1612927601601-6638404737ce?w=500&q=80"],
        tags: ["maggi", "noodles", "instant"],
      },
      {
        storeId: store._id,
        categoryId: instantId,
        name: "Kellogg's Corn Flakes Original",
        description: "Crispy toasted corn flakes enriched with essential iron and vitamins",
        brand: "Kellogg's",
        unit: "475 g",
        mrp: 22000,
        price: 19500,
        stock: 50,
        maxPerOrder: 3,
        imageUrl: "https://images.unsplash.com/photo-1521483451569-e33803c0330c?w=500&q=80",
        images: ["https://images.unsplash.com/photo-1521483451569-e33803c0330c?w=500&q=80"],
        tags: ["cereal", "cornflakes", "breakfast"],
      },

      {
        storeId: store._id,
        categoryId: teaId,
        name: "Tata Tea Premium Leaf",
        description: "Choti aur badi patti blend delivering unmatched taste and strength",
        brand: "Tata Tea",
        unit: "500 g",
        mrp: 31000,
        price: 27500,
        stock: 75,
        maxPerOrder: 4,
        imageUrl: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=500&q=80",
        images: ["https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=500&q=80"],
        tags: ["tea", "chai", "tata"],
      },
      {
        storeId: store._id,
        categoryId: teaId,
        name: "Nescafe Classic Instant Coffee",
        description: "100% pure coffee beans roasted to perfection for rich aroma",
        brand: "Nescafe",
        unit: "50 g",
        mrp: 19500,
        price: 18000,
        stock: 65,
        maxPerOrder: 4,
        imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&q=80",
        images: ["https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&q=80"],
        tags: ["coffee", "nescafe", "instant"],
      },

      {
        storeId: store._id,
        categoryId: sweetsId,
        name: "Cadbury Dairy Milk Silk",
        description: "Creamy, smooth chocolate bar that melts luxuriously in mouth",
        brand: "Cadbury",
        unit: "60 g",
        mrp: 8500,
        price: 7800,
        stock: 120,
        maxPerOrder: 8,
        imageUrl: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=500&q=80",
        images: ["https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=500&q=80"],
        tags: ["chocolate", "silk", "cadbury"],
      },

      {
        storeId: store._id,
        categoryId: cleaningId,
        name: "Vim Lemon Dishwash Gel",
        description: "Concentrated gel powered with lemon fragrance for spotlessly clean utensils",
        brand: "Vim",
        unit: "500 ml",
        mrp: 12500,
        price: 11000,
        stock: 70,
        maxPerOrder: 4,
        imageUrl: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&q=80",
        images: ["https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&q=80"],
        tags: ["dishwash", "cleaning", "vim"],
      },
    ];

    for (const prod of productsData) {
      await Product.findOneAndUpdate(
        { storeId: prod.storeId, name: prod.name },
        { $set: { ...prod, isAvailable: true, isDeleted: false } },
        { upsert: true, new: true }
      );
    }
    console.log(`[Seed] ${productsData.length} Products seeded & updated with HD images`);

    const now = new Date();
    const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

    const couponsData = [
      {
        code: "WELCOME50",
        description: "Flat ₹50 off on orders above ₹199",
        type: CouponType.FLAT,
        value: 5000,
        minOrderAmount: 19900,
        validFrom: now,
        validTo: oneYearLater,
        perUserLimit: 1,
        storeId: null,
      },
      {
        code: "BLINKIT20",
        description: "20% off up to ₹100 on orders above ₹299",
        type: CouponType.PERCENT,
        value: 2000,
        maxDiscount: 10000,
        minOrderAmount: 29900,
        validFrom: now,
        validTo: oneYearLater,
        perUserLimit: 3,
        storeId: null,
      },
      {
        code: "FRESH15",
        description: "15% off up to ₹75 on fresh produce",
        type: CouponType.PERCENT,
        value: 1500,
        maxDiscount: 7500,
        minOrderAmount: 14900,
        validFrom: now,
        validTo: oneYearLater,
        perUserLimit: 2,
        storeId: null,
      },
    ];

    for (const c of couponsData) {
      await Coupon.findOneAndUpdate(
        { code: c.code },
        { $set: c },
        { upsert: true, new: true }
      );
    }
    console.log("[Seed] Coupons seeded");

    console.log("==================================================");
    console.log(`[Seed Complete] Set DEFAULT_STORE_ID=${store._id} in your .env`);
    console.log("==================================================");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("[Seed Failed]", error);
    process.exit(1);
  }
};

seed();
