import { Router } from "express";
import { privateRoutes, publicRoutes } from "../middlewares/auth.middlewares.js";
import viewControl from "../controllers/viewControl.js";
import logger from "../utils/logger.js"

const router = Router()
router.get('/', privateRoutes, (req, res) => {
    res.render('sessions/welcome')
});
router.get('/login', privateRoutes, (req, res) => {
    res.render('sessions/login')
});
router.get('/register', privateRoutes, async (req, res) => {
    res.render('sessions/register')
});
router.get('/current', publicRoutes, viewControl.getSessionUser)
router.get('/session/error', (req, res) => res.render('pageError'))
router.get('/session/errorRegister', (req, res) => {
    res.render('pageError', {
        error: 'No se pudo registrar al usuario, intente nuevamente o verifique que el usuario ya no esté creado'
    })
});
router.get('/session/errorLogin', (req, res) => {
    res.render('pageError', {
        error: 'Verifique que los datos del usuario sean correctos'
    })
});
router.get('/session/registerAccepted', (req, res) => {
    logger.info(`Usuario ${req.user.email} se ha registrado con éxito en la web`)
    res.render('sessions/registerAccepted')
});
router.get('/loggerTest', (req, res) => {
    logger.fatal('Test de logger Fatal')
    logger.error('Test de logger Error')
    logger.warning('Test de logger Warning')
    logger.info('Test de logger Info')
    logger.http('Test de logger Http')
    logger.debug('Test de logger Debug')
    res.send('Los test se ejecutaron correctamente')
});
router.get('/forget_password', (req, res) => {
    res.render('sessions/forget_password')
});
router.get('/reset_password/:token', (req, res) => {
    res.redirect(`/session/verify_token/${req.params.token}`)
});
export default router;