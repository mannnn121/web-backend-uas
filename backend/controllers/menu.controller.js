import {
	createMenuService,
	deactivateMenuService,
	getMenuByIdService,
	getMenusService,
	reactivateMenuService,
	updateMenuService,
} from "../services/menu.service.js";

/**
 * @openapi
 * /menus:
 *   get:
 *     tags: [Menus]
 *     summary: Get all active menus
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active menus
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Menu'
 */
export const getMenus = async (req, res) => {
	try {
		const result = await getMenusService();
		res.status(200).json(result);
	} catch (err) {
		res.status(err.statusCode || 500).json({ error: err.message });
	}
};

/**
 * @openapi
 * /menus/{id}:
 *   get:
 *     tags: [Menus]
 *     summary: Get menu by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Menu data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Menu'
 *       404:
 *         description: Menu not found
 */
export const getMenuById = async (req, res) => {
	try {
		const result = await getMenuByIdService(req.params.id);
		res.status(200).json(result);
	} catch (err) {
		res.status(err.statusCode || 500).json({ error: err.message });
	}
};

/**
 * @openapi
 * /menus:
 *   post:
 *     tags: [Menus]
 *     summary: Create a new menu (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MenuInput'
 *     responses:
 *       201:
 *         description: Menu created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Menu'
 *       409:
 *         description: Menu with this name already exists
 */
export const createMenu = async (req, res) => {
	try {
		const result = await createMenuService(req.body);
		res.status(201).json(result);
	} catch (err) {
    if (err.statusCode === 409) {
      return res.status(409).json({
        error: err.message,
        existingMenuId: err.existingMenuId,
        existingMenu: err.existingMenuData,
      });
		}
		res.status(err.statusCode || 500).json({ error: err.message });
	}
};

/**
 * @openapi
 * /menus/{id}:
 *   patch:
 *     tags: [Menus]
 *     summary: Update a menu (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MenuInput'
 *     responses:
 *       200:
 *         description: Menu updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Menu'
 *       404:
 *         description: Menu not found
 */
export const updateMenu = async (req, res) => {
	try {
		const result = await updateMenuService(req.params.id, req.body);
		res.status(200).json(result);
	} catch (err) {
		res.status(err.statusCode || 500).json({ error: err.message });
	}
};

/**
 * @openapi
 * /menus/{id}:
 *   delete:
 *     tags: [Menus]
 *     summary: Deactivate a menu (soft delete, admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Menu deactivated
 *       404:
 *         description: Menu not found
 */
export const deactivateMenu = async (req, res) => {
	try {
		const result = await deactivateMenuService(req.params.id);
		res.status(200).json(result);
	} catch (err) {
		res.status(err.statusCode || 500).json({ error: err.message });
	}
};

/**
 * @openapi
 * /menus/{id}/reactivate:
 *   patch:
 *     tags: [Menus]
 *     summary: Reactivate a deactivated menu (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Menu reactivated
 *       404:
 *         description: Menu not found
 */
export const reactivateMenu = async (req, res) => {
  try {
    const result = await reactivateMenuService(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};