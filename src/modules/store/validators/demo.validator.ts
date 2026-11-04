import { z } from "zod";

export const createDemoOrdersSchema = z
  .object({
    count: z.number().int().min(1).max(10).default(1),
  })
  .strict();
