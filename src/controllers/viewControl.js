import { CartService, ProductService, UserService } from '../services/index.js'
import UserDTO from "../dto/userDTO.js"
import logger from '../utils/logger.js'
import dotenv from 'dotenv'
import config from '../config/config.js'
dotenv.config()
const getProductsViewController = async (req, res) => {
    if (!req.user) return res.status(401).render('sessions/welcome')
    if (!req.session.user) return res.status(401).render('sessions/welcome')
    const { limit = 8, page = 1 } = req.query
    const pageFilters = {}
    if (req.query.category) pageFilters.category = req.query.category
    if (req.query.stock) pageFilters.stock = req.query.stock
    const paginateOpt = { lean: true, limit, page }
    if (req.query.sort === 'asc') paginateOpt.sort = { price: 1 }
    if (req.query.sort === 'des') paginateOpt.sort = { price: -1 }
    const result = await ProductService.dao.model.paginate(pageFilters, paginateOpt)
    if (!result) {
        return res.render("pageError", {
            error: 'La pagina que está buscando no existe!'
        })
    }
    let previousLink;
    if (req.query.page) {
        const modifiedUrl = req.originalUrl.replace(`page=${req.query.page}`, `page=${result.prevPage}`)
        if (req.hostname == 'localhost') {
            previousLink = `http://${req.hostname}:${config.port}${modifiedUrl}`
        } else {
            previousLink = `http://${req.hostname}${modifiedUrl}`
        }
    } else {
        if (req.hostname == 'localhost') {
            previousLink = `http://${req.hostname}:${config.port}${req.originalUrl}?page=${result.prevPage}`
        } else {
            previousLink = `http://${req.hostname}${req.originalUrl}?page=${result.prevPage}`
        }
    }
    let nextLink;
    if (req.query.page) {
        const modifiedUrl = req.originalUrl.replace(`page=${req.query.page}`, `page=${result.nextPage}`)
        if (req.hostname == 'localhost') {
            nextLink = `http://${req.hostname}:${config.port}${modifiedUrl}`
        } else {
            nextLink = `http://${req.hostname}${modifiedUrl}`
        }
    } else {
        if (req.hostname == 'localhost') {
            nextLink = `http://${req.hostname}:${config.port}${req.originalUrl}?page=${result.nextPage}`
        } else {
            nextLink = `http://${req.hostname}${req.originalUrl}?page=${result.nextPage}`
        }
    }
    const totalPages = []
    let link;
    for (let index = 1; index <= result.totalPages; index++) {
        if (!req.query.page) {
            if (req.hostname == 'localhost') {
                link = `http://${req.hostname}:${config.port}${req.originalUrl}?page=${index}`
            } else {
                link = `http://${req.hostname}${req.originalUrl}?page=${index}`
            }
        } else if (req.query.page > result.totalPages) {
            if (req.hostname == 'localhost') {
                link = `http://${req.hostname}:${config.port}${req.originalUrl}&page=${index}`
            } else {
                link = `http://${req.hostname}${req.originalUrl}&page=${index}`
            }
        }
        else {
            const modifiedUrl = req.originalUrl.replace(`page=${req.query.page}`, `page=${index}`)
            if (req.hostname == 'localhost') {
                link = `http://${req.hostname}:${config.port}${modifiedUrl}`
            } else {
                link = `http://${req.hostname}${modifiedUrl}`
            }
        }
        totalPages.push({ page: index, link })
    }
    const user = req.session.user
    let userID
    if (req.user.email === 'adminCoder@coder.com') {
        userID = 'AdminCoder'
    } else {
        userID = req.user._id.toString();
    }
    const cartTotal = await CartService.getAll(user.cart)
    return res.render("home",
        {
            user,
            userID,
            cartTotal: req.user.email === 'adminCoder@coder.com' ? 0 : cartTotal.response.payload.products.length,
            products: result.docs,
            paginateInfo: {
                totalPages,
                prevPage: result.prevPage,
                nextPage: result.nextPage,
                page: result.page,
                hasPrevPage: result.hasPrevPage,
                hasNextPage: result.hasNextPage,
                previousLink: result.hasPrevPage ? previousLink : null,
                nextLink: result.hasNextPage ? nextLink : null
            }
        }
    )
}
const getProductByIdViewController = async (req, res) => {
    const pid = req.params.pid
    const user = req.session.user
    let userID
    if (req.user.email === 'adminCoder@coder.com') {
        userID = 'AdminCoder'
    } else {
        userID = req.user._id.toString()
    }
    const product = await ProductService.getById(pid)
    if (product.statusCode === 500 || product.statusCode === 404) {
        logger.error(`El usuario ${req.user.email} quiso ver el detalle del producto ${pid} y este no existe`)
        return res.status(404).render("pageError", {
            error: 'No pudimos encontrar el producto con este ID!!'
        })
    }
    const cartTotal = await CartService.getAll(user.cart)
    res.status(200).render("productDetail", {
        product: product.response.payload,
        user,
        cartTotal: req.user.email === 'adminCoder@coder.com' ? 0 : cartTotal.response.payload.products.length,
        userID,
        premium: user.role === 'premium' || user.role === 'admin' ? true : false
    })
}
const getProductsFromCartViewController = async (req, res) => {
    const cid = req.params.cid
    const cartProducts = await CartService.getAll(cid)
    const user = req.session.user
    let userID
    if (req.user.email === 'adminCoder@coder.com') {
        userID = 'AdminCoder'
    } else {
        userID = req.user._id.toString()
    }
    if (cartProducts.statusCode === 500) {
        logger.error(`El usuario ${req.user.email} quiso acceder al carrito ${cid} y obtuvo un error`)
        return res.status(cartProducts.statusCode).render("pageError", {
            error: 'No pudimos encontrar el carrito con este ID!!'
        })
    }
    let amount = 0
    cartProducts.response.payload.products.map(prd => amount += (prd.product.price * prd.quantity))
    let finalPrice = amount * 1.2
    const cartTotal = await CartService.getAll(user.cart)
    let stripePublishableKey = config.stripePublishableKey
    res.status(cartProducts.statusCode).render("cart", {
        user,
        userID,
        stripePublishableKey,
        cartTotal: req.user.email === 'adminCoder@coder.com' ? 0 : cartTotal.response.payload.products.length,
        cartProducts: cartProducts.response.payload.products,
        cartId: cartProducts.response.payload._id,
        subTotal: Math.round(amount),
        ship: Math.round(amount * 0.2),
        amount: Math.round(finalPrice)
    })
}
const getSessionUser = async (req, res) => {
    const user = req.session.user
    let userID
    if (req.user.email === 'adminCoder@coder.com') {
        userID = 'AdminCoder'
    } else {
        userID = req.user._id.toString()
    }
    if (user.email === 'adminCoder@coder.com') {
        user.role = 'admin'
    }
    const userDTO = new UserDTO(user)
    const cartTotal = await CartService.getAll(user.cart)
    res.render('sessions/profile', {
        user,
        cartTotal: req.user.email === 'adminCoder@coder.com' ? 0 : cartTotal.response.payload.products.length,
        userID,
        userDTO,
        premium: user.role === 'premium' || user.role === 'admin' ? true : false
    })
}
const getUsers = async (req, res) => {
    const result = await UserService.getAll()
    let sessionRole = result.response.payload.find(prd => prd.email === req.session.user.email)
    if (!sessionRole) {
        sessionRole = 'admin'
    }
    req.session.user.role = sessionRole.role
    res.status(200).render('users', {
        users: result.response.payload,
        userLog: req.session.user.email,
        user: req.session.user
    })
}
export default { getProductsViewController, getProductByIdViewController, getProductsFromCartViewController, getSessionUser, getUsers }
