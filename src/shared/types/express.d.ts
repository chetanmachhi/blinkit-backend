import { StoreRole } from "../constants/enums";

/**
 * Single Express Request augmentation for every module (customer, store, delivery).
 * Kept in shared/ so that two modules never declare conflicting shapes.
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        storeRole?: StoreRole;
      };
      storeId?: string;
    }
  }
}

export {};
