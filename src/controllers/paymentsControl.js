/* eslint-disable no-unused-vars */
import Stripe from 'stripe'
import dotenv from 'dotenv'
import config from '../config/config.js'
import { CartService, ProductService } from '../services/index.js'

dotenv.config()
const stripe = new Stripe(config.stripe_key)
const createSession = async (req, res) => {
    try {
        const cid = req.body.cid
        const resultCart = await CartService.getAll(cid)
        const purchaseCart = resultCart.response.payload
        let productsToTicket = []
        let amount = 0
        for (let index = 0; index < purchaseCart.products.length; index++) {
            let productToBuy = await ProductService.getById(purchaseCart.products[index].product)
            productToBuy = productToBuy.response.payload
            if (purchaseCart.products[index].quantity <= productToBuy.stock) {
                amount += (purchaseCart.products[index].quantity * productToBuy.price)
                productsToTicket.push({ description: productToBuy.description, title: productToBuy.title, price: productToBuy.price, quantity: purchaseCart.products[index].quantity })
            }
            if (purchaseCart.products[index].quantity > productToBuy.stock) {
                amount += (productToBuy.stock * productToBuy.price)
                productsToTicket.push({ description: productToBuy.description, title: productToBuy.title, price: productToBuy.price, quantity: productToBuy.stock })
            }
        }
        if (productsToTicket.length === 0) return res.status(400).json({ status: 'error', error: 'No hay productos en el carrito' })
        const lineItems = productsToTicket.map(prd => ({
            price_data: {
                product_data: {
                    name: prd.title,
                    description: prd.description
                },
                currency: 'usd',
                unit_amount: Math.round(parseInt(prd.price * 1.2) * 100)
            },
            quantity: prd.quantity
        }));
        const session = await stripe.checkout.sessions.create({
            line_items: lineItems,
            mode: 'payment',
            success_url: config.environment === 'production' ? `http://${req.hostname}:${config.port}/api/carts/${cid}/purchase` : `http://${req.hostname}/api/carts/${cid}/purchase`,
            cancel_url: config.environment === 'development' ? `http://${req.hostname}:${config.port}/api/payments/cancel` : `http://${req.hostname}/api/payments/cancel`
        })
        res.status(200).json({ sessionId: session.id });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message })
    }
}
const failedSession = async (req, res) => {
    res.render('payment/errorPay')
}
export default { createSession, failedSession }