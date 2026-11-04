import { StoreRole } from "../../../shared";

export enum Permission {
  ORDERS_READ = "orders:read",
  ORDERS_WRITE = "orders:write",
  PRODUCTS_READ = "products:read",
  PRODUCTS_WRITE = "products:write",
  PRODUCTS_STOCK = "products:stock",
  CATEGORIES_READ = "categories:read",
  CATEGORIES_WRITE = "categories:write",
  COUPONS_READ = "coupons:read",
  COUPONS_WRITE = "coupons:write",
  CUSTOMERS_READ = "customers:read",
  DASHBOARD_READ = "dashboard:read",
  REPORTS_READ = "reports:read",
  STORE_READ = "store:read",
  STORE_WRITE = "store:write",
  STORE_ACCEPTING = "store:accepting",
  STAFF_MANAGE = "staff:manage",
  DEMO_TOOLS = "demo:tools",
}

export const ROLE_PERMISSIONS: Record<StoreRole, Permission[]> = {
  [StoreRole.OWNER]: Object.values(Permission),
  [StoreRole.STAFF]: [
    Permission.ORDERS_READ,
    Permission.ORDERS_WRITE,
    Permission.PRODUCTS_READ,
    Permission.PRODUCTS_STOCK,
    Permission.CATEGORIES_READ,
    Permission.CUSTOMERS_READ,
    Permission.DASHBOARD_READ,
    Permission.REPORTS_READ,
    Permission.STORE_READ,
    Permission.STORE_ACCEPTING,
    Permission.DEMO_TOOLS,
  ],
};

export const hasPermission = (
  role: StoreRole | undefined,
  permission: Permission
): boolean => {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role];
  return Boolean(permissions && permissions.includes(permission));
};
