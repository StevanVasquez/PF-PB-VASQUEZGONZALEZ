import { Router } from 'express'
import cartControl from '../controllers/cartControl.js'
import { verifyRoles } from '../middlewares/auth.middlewares.js'

const router = Router();
router.get('/:cid', cartControl.getProductsFromCartController)
router.get('/:cid/purchase', cartControl.purchaseCartController)
router.delete('/:cid', cartControl.deleteFromCartController)
router.put('/:cid', cartControl.updateCartController)
router.post('/', cartControl.createCartController)
router.post('/:cid/product/:pid', verifyRoles(['user','premium']), cartControl.addProductToCartController)
router.delete('/:cid/product/:pid', cartControl.deleteProductFromCartController)
router.put('/:cid/product/:pid', cartControl.updateProductFromCartController)
export default router;