import { Router } from 'express'
import UserModel from '../dao/models/user.model.js'
import userControl from '../controllers/userControl.js'
import { verifyRoles } from '../middlewares/auth.middlewares.js'
import logger from '../utils/logger.js'
import multer from 'multer'
import config from '../config/config.js'

const router = Router()
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const destination = `public/uploads`;
        cb(null, destination);
    },
    filename: (req, file, cb) => {
        const date = new Date();
        cb(null, `${file.originalname}`);
    },
});
const uploader = multer({ storage })
router.get('/premium/:uid', verifyRoles(['premium', 'user']), async (req, res) => {
    try {
        let user = await UserModel.findOne({ _id: req.params.uid })
        if (!user) return res.redirect('/')
        await UserModel.findOneAndUpdate({ _id: user._id }, { role: user.role === 'user' ? 'premium' : 'user' })
        user = await UserModel.findOne({ _id: req.params.uid })
        logger.info(`El usuario ${user.email} cambió su rol! Ahora es: ${user.role}`)
        req.session.user.role = user.role
        res.status(200).render('pageAuth', {
            message: 'Se actualizó el rol del usuario con éxito, para utilizarlo, cierre sesión e ingrese nuevamente!'
        })
    } catch (err) {
        res.status(500).json({ status: 'error', error: err.message })
    }
});
router.get('/', userControl.getUsers)
router.get('/:email', userControl.getOneUser)
router.get('/control/addProduct', verifyRoles(['premium', 'admin']), async (req, res) => {
    res.render('actions/addProduct', {
        user: req.session.user
    })
});
router.get('/control/updateProduct', verifyRoles(['premium', 'admin']), async (req, res) => {
    res.render('actions/updateProduct', {
        user: req.session.user
    })
});
router.put('/updateRol/:email/:rol', userControl.updateRol)
router.delete('/', userControl.deleteUsers)
router.delete('/deleteUser/:email', userControl.deleteOneUser)
export default router;