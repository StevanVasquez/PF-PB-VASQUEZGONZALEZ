import { Router } from "express";
import passport from "passport";
import nodemailer from 'nodemailer'
import logger from '../utils/logger.js'
import { validatePassword } from "../utils/utils.js";
import UserModel from '../dao/models/user.model.js'
import UserPasswordModel from '../dao/models/user_password.model.js'
import { generateRandomString, createHash } from '../utils/utils.js'
import config from "../config/config.js";

const router = Router()
router.post('/register', passport.authenticate('register', {
    failureRedirect: '/session/errorRegister',
    successRedirect: '/session/registerAccepted'
}), async (req, res) => {
});
router.post('/login', passport.authenticate('login', { failureRedirect: '/session/errorLogin' }), async (req, res) => {
    try {
        if (!req.user) {
            console.log(req.user)
            res.status(400).send({ status: 'error', error: error.message })
        }
        if (req.user.email == 'adminCoder@coder.com') {
            req.session.user = {
                email: req.user.email,
                role: req.user.role,
                first_name: req.user.first_name
            }
        } else {
            req.session.user = {
                first_name: req.user.first_name,
                last_name: req.user.last_name,
                email: req.user.email,
                age: req.user.age,
                role: req.user.role,
                cart: req.user.cart
            }
        }
        await UserModel.findOneAndUpdate({ email: req.session.user.email }, { last_login: Date.now() })
        logger.info(`Usuario ${req.user.email} ha ingresado con éxito en la web`)
        res.redirect('/products')
    }
    catch (error) {
        logger.error(error.message)
    }
});
router.get('/logout', async (req, res) => {
    try {
        await UserModel.findOneAndUpdate({ email: req.session.user.email }, { last_login: Date.now() })
    } catch (error) {
        res.status(500).render('pageError', {
            error: error.message
        })
    }
    req.session.destroy(err => {
        if (err) {
            logger.error(err)
            res.status(500).render('pageError')
        } else {
            res.redirect('/')
        }
    })
});
router.get('/gitCallback', passport.authenticate('github', { failureRedirect: '/session/errorLogin' }), async (req, res) => {
    req.session.user = req.user
    logger.info(`Usuario ${req.user.email} ha ingresado con éxito en la web`)
    res.redirect('/')
});
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }), (req, res) => {
});
router.post('/forget_password', async (req, res) => {
    const email = req.body.email
    const user = await UserModel.findOne({ email })
    if (!email) return res.status(400).render('pageError', {
        error: 'No ha ingresado un email valido'
    })
    if (!user) return res.status(404).render('pageError', {
        error: 'No existe un usuario con el mail ingresado'
    })
    const token = generateRandomString(16)
    await UserPasswordModel.create({ email, token })
    const mailConfig = {
        service: 'gmail',
        auth: { user: config.nodemailer_user, pass: config.nodemailer_pass }
    }
    let url;
    if (config.environment === 'production') {
        url = `http://${req.hostname}/reset_password/${token}`
    } else {
        url = `http://${req.hostname}:${config.port}/reset_password/${token}`
    }
    let transporter = nodemailer.createTransport(mailConfig)
    let message = {
        from: config.nodemailer_user,
        to: email,
        subject: '[ ELECTROKEVIN ] Mensaje de aviso!!!!',
        html: `<h1>[ IMPORTANTE! ] ELECTROKEVIN | Tienda de Tecnologia Virtual</h1>
        <hr />
        Has pedido un reinicio de contraseña. Lo puedes hacer desde el siguiente link: <a href="${url}"
        >Presione aquí para reiniciar la contraseña</a>
        <hr />
        Saludos,<br><strong>Equipo de ELECTROKEVIN Colombia.</strong>`
    }
    try {
        await transporter.sendMail(message)
        res.status(200).render('pageAuth', { message: `Mensaje enviado correctamente a ${email} para reiniciar su contraseña` })
    } catch (err) {
        res.status(500).json({ status: 'error', error: err.message })
    }
})
router.get('/verify_token/:token', async (req, res) => {
    try {
        const userPass = await UserPasswordModel.findOne({ token: req.params.token })
        const user = userPass.email
        if (!userPass) return res.redirect('sessions/forget_password')
        res.render('sessions/reset_password', { user })
    } catch (err) {
        return res.render('sessions/forget_password')
    }
})
router.post('/reset_password/:user', async (req, res) => {
    try {
        const user = await UserModel.findOne({ email: req.params.user })
        let filter = await UserPasswordModel.findOne({ email: user.email })
        if (!filter) return res.status(404).render('pageError', {
            error: 'El token ya fue utilizado o expiró, intente restablecer su contraseña nuevamente!'
        })
        if (req.body.newPassword === req.body.confirmPassword) {
            if (validatePassword(user, req.body.newPassword)) return res.status(400).render('pageError', {
                error: 'La contraseña no puede ser la misma que ya está utlizando!'
            })
            await UserModel.findByIdAndUpdate(user._id, { password: createHash(req.body.newPassword) })
            res.status(200).render('pageAuth', { message: 'Se ha creado una nueva contraseña' })
            await UserPasswordModel.deleteOne({ email: req.params.user })
        } else res.status(400).render('pageError', {
            error: 'Las contraseñas ingresadas no coinciden'
        })
    } catch (err) {
        res.status(500).json({ status: 'error', error: err.message })
    }
})
export default router;