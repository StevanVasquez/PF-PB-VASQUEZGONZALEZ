import { Router } from 'express'
import { verifyRoles, publicRoutes } from '../middlewares/auth.middlewares.js'

const router = Router();
router.get('/', publicRoutes, verifyRoles(['user']), (req, res) => {
    res.render('chat', { user: req.session.user.email })
})
export default router;