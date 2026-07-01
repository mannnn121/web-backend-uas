import {
	createMenuService,
	deactivateMenuService,
	getMenuByIdService,
	getMenusService,
	reactivateMenuService,
	updateMenuService,
} from "../services/menu.service.js";

export const getMenus = async (req, res) => {
	try {
		const result = await getMenusService();
		res.status(200).json(result);
	} catch (err) {
		res.status(err.statusCode || 500).json({ error: err.message });
	}
};

export const getMenuById = async (req, res) => {
	try {
		const result = await getMenuByIdService(req.params.id);
		res.status(200).json(result);
	} catch (err) {
		res.status(err.statusCode || 500).json({ error: err.message });
	}
};

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

export const updateMenu = async (req, res) => {
	try {
		const result = await updateMenuService(req.params.id, req.body);
		res.status(200).json(result);
	} catch (err) {
		res.status(err.statusCode || 500).json({ error: err.message });
	}
};

export const deactivateMenu = async (req, res) => {
	try {
		const result = await deactivateMenuService(req.params.id);
		res.status(200).json(result);
	} catch (err) {
		res.status(err.statusCode || 500).json({ error: err.message });
	}
};

export const reactivateMenu = async (req, res) => {
  try {
    const result = await reactivateMenuService(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
};