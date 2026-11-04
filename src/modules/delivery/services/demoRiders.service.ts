import { User, Role, hashPassword } from "../../../shared";

export const DEMO_RIDERS = [
  { name: "Ravi Kumar", phone: "9000000001", vehicleNumber: "GJ06 AB 1234" },
  { name: "Imran Shaikh", phone: "9000000002", vehicleNumber: "GJ06 CD 5678" },
];

/**
 * Idempotent: creates demo riders that do not exist yet and never touches
 * existing accounts (so a changed password is not reset on reboot).
 */
export const ensureDemoRiders = async (password: string): Promise<number> => {
  let created = 0;
  for (const rider of DEMO_RIDERS) {
    const existing = await User.findOne({ phone: rider.phone });
    if (existing) {
      if (existing.role !== Role.RIDER) {
        console.warn(
          `[Delivery] Demo rider phone ${rider.phone} belongs to a "${existing.role}" account, skipped`
        );
      }
      continue;
    }
    await User.create({
      ...rider,
      role: Role.RIDER,
      passwordHash: await hashPassword(password, 10),
      isActive: true,
      isPhoneVerified: true,
      isOnline: true,
    });
    created++;
  }
  return created;
};
