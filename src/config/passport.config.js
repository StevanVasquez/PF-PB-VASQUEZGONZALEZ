import passport from "passport";
import local from 'passport-local'
import UserModel from "../dao/models/user.model.js";
import cartModel from '../dao/models/cart.model.js'
import GitHubStrategy from 'passport-github2'
import { createHash, validatePassword } from "../utils/utils.js";
import config from '../config/config.js'

const localStrategy = local.Strategy
const initializePassport = () => {
    passport.use('register', new localStrategy({
        passReqToCallback: true,
        usernameField: 'email'
    }, async (req, username, password, done) => {
        const { first_name, last_name, email, age } = req.body
        try {
            const user = await UserModel.findOne({ email: username })
            if (user) {
                return done(null, false)
            }
            const newCart = await cartModel.create({})
            const newUser = { first_name, last_name, email, age, cart: newCart._id, password: createHash(password) }
            const result = await UserModel.create(newUser)
            return done(null, result)
        } catch (err) {
            return done(err.message)
        }
    }));
    passport.use('login', new localStrategy({
        usernameField: 'email',
    }, async (username, password, done) => {
        try {
            if (username == config.admin_email && password == config.admin_password) {
                const userAdmin = {
                    email: username,
                    role: 'admin',
                    password: password,
                    first_name: 'Admin',
                }
                return done(null, userAdmin)
            }
            const user = await UserModel.findOne({ email: username })
            if (!user) {
                return done(null, false)
            }
            if (!validatePassword(user, password)) return done(null, false)
            return done(null, user)
        } catch (err) {
            return done(err.message)
        }
    }));
    passport.use('github', new GitHubStrategy({
        clientID: config.clientIDGit,
        clientSecret: config.clientSecretGit,
        callbackUrl: config.callbackUrlGit,
        scope: ['user:email']
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const user = await UserModel.findOne({ email: profile._json.email })
            if (user) return done(null, user)
            const newCart = await cartModel.create({})
            const newUser = await UserModel.create({
                first_name: profile._json.name,
                last_name: '',
                email: profile.emails[0].value,
                password: '',
                cart: newCart._id
            })
            return done(null, newUser)
        } catch (err) {
            return done('Error login with Github')
        }
    }));
    passport.serializeUser((user, done) => {
        if (user.role == 'admin') {
            done(null, user)
        } else {
            done(null, user)
        }
    });
    passport.deserializeUser(async (user, done) => {
        if (user.role == 'admin') {
            done(null, user)
        } else {
            const userFinal = await UserModel.findById(user._id)
            done(null, userFinal)
        }
    })
}
export default initializePassport;