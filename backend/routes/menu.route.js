import express from "express";
import {
	createMenu,
	deactivateMenu,
	getMenuById,
	getMenus,
	reactivateMenu,
	updateMenu,
} from "../controllers/menu.controller.js";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/menus", getMenus);
router.get("/menus/:id", getMenuById);
router.post("/menus", authorizeRoles("admin"), createMenu);
router.patch("/menus/:id", authorizeRoles("admin"), updateMenu);
router.delete("/menus/:id", authorizeRoles("admin"), deactivateMenu);
router.patch("/menus/:id/reactivate", authorizeRoles("admin"), reactivateMenu);

export default router;
