import { Router } from "express";
import viewControl from "../controllers/viewControl.js";
import { publicRoutes } from "../middlewares/auth.middlewares.js"
import { verifyRoles } from "../middlewares/auth.middlewares.js";

const router = Router();
router.get('/', publicRoutes, verifyRoles(['user', 'admin', 'premium']), viewControl.getProductsViewController)
router.get('/:cid', publicRoutes, verifyRoles(['user', 'premium']), viewControl.getProductsFromCartViewController)
router.get('/product/:pid', publicRoutes, verifyRoles(['user', 'admin', 'premium']), viewControl.getProductByIdViewController)
router.get('/real/realtimeproducts', publicRoutes, verifyRoles(['user', 'admin', 'premium']), (req, res) => {
    res.render("realTimeProducts")
});
router.get('/control/data', publicRoutes, verifyRoles(['admin']), viewControl.getUsers)
export default router;