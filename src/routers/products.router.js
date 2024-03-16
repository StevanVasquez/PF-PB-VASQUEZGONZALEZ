import { Router } from 'express'
import productControl from '../controllers/productControl.js'
import { verifyRoles } from '../middlewares/auth.middlewares.js'

const router = Router();
router.get('/', verifyRoles(['admin', 'user', 'premium']), productControl.getProducts)
router.get('/:pid', verifyRoles(['user', 'admin', 'premium']), productControl.getProductByIdController)
router.post('/', verifyRoles(['admin','premium']), productControl.addProductController)
router.put('/:pid', verifyRoles(['admin', 'premium']), productControl.updateProductController)
router.delete('/:pid', verifyRoles(['admin', 'premium']), productControl.deleteProductController)
export default router;