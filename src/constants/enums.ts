export enum Role {
  CUSTOMER = "customer",
  ADMIN = "admin",
}

export enum OrderStatus {
  PLACED = "placed",
  ACCEPTED = "accepted",
  PREPARING = "preparing",
  OUT_FOR_DELIVERY = "out_for_delivery",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
}

export enum PaymentMethod {
  COD = "cod",
  ONLINE = "online",
}

export enum PaymentStatus {
  PENDING = "pending",
  PAID = "paid",
  FAILED = "failed",
  REFUNDED = "refunded",
}

export enum CouponType {
  PERCENT = "percent",
  FLAT = "flat",
}

export enum AddressLabel {
  HOME = "home",
  WORK = "work",
  OTHER = "other",
}

export enum ProductSort {
  PRICE_ASC = "price_asc",
  PRICE_DESC = "price_desc",
  NEWEST = "newest",
  DISCOUNT = "discount",
}
