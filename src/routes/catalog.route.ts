import { Router } from "express";
import { getCatalogHome } from "../controllers/catalog.controller";
import { storeContext } from "../middlewares/storeContext.middleware";

const router = Router();

router.get("/home", storeContext, getCatalogHome);

export default router;
