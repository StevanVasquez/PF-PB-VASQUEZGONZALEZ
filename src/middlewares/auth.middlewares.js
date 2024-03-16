import EErros from "../services/errors/enums.js"
import logger from "../utils/logger.js"
import { generateErrorInfoThree } from '../services/errors/description.js';
import CustomError from "../services/errors/custom_error.js";

export const publicRoutes = (req, res, next) => {
    if (!req.session.user) return res.redirect('/')
    next()
}
export const privateRoutes = (req, res, next) => {
    if (req.session.user) return res.redirect('/products')
    next()
}
export const verifyRoles = (acceptedRoles) => {
    return (req, res, next) => {
        if (acceptedRoles.includes('public')) return next()
        if (!req.session.user) {
            const error = CustomError.createError({
                name: "Error de authenticación",
                cause: generateErrorInfoThree('Credenciales no validas.'),
                message: "Verifique que usted esta logueado en la página",
                code: EErros.AUTHENTICATION
            })
            return res.status(401).json({ status: 'error', error: error })
        }
        let userRole
        if (req.session.user.email === 'adminCoder@coder.com') {
            userRole = 'admin'
            req.session.user.cart = ''
        } else {
            userRole = req.session.user.role
        }
        if (acceptedRoles.includes(userRole)) {
            next();
        } else {
            logger.warning(`El usuario ${req.user.email} quiso ingresar a una página que no tiene permisos.`)
            return res.status(403).render('pageError', {
                error: `El usuario ${req.user.email} no tiene permisos para ingresar a la página.`
            });
        }
    }
}