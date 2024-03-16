import cartModel from "./models/cart.model.js"
import { productModel } from '../dao/models/product.model.js'

export default class CartDao {
    constructor() {
        this.model = cartModel
        this.modelProduct = productModel
    }
    getProductsFromCartId = async (cid) => {
        try {
            let cart = await this.model.findById(cid).populate('products.product').lean()
            if (!cart) {
                return {
                    statusCode: 404, response: {
                        status: 'error', error: 'Cart was not found'
                    }
                }
            } else {
                return {
                    statusCode: 200,
                    response: { status: 'success', payload: cart }
                }
            }
        } catch (error) {
            return {
                statusCode: 500,
                response: {
                    status: 'error', error: 'Cart was not found'
                }
            }
        }
    }
    getAll = async (cid) => {
        let result = await this.getProductsFromCartId(cid)
        return result
    }
    delete = async (cid) => {
        try {
            let cart = await this.model.findById(cid).lean()
            cart.products = []
            const result = await this.model.findByIdAndUpdate(cid, cart, { Document: 'after' }).lean()
            return {
                statusCode: 200,
                response: {
                    status: 'success', payload: result
                }
            }
        } catch (err) {
            return {
                statusCode: 500,
                response: {
                    status: 'error', error: `Cart ${cid} was not found`
                }
            }
        }
    }
    update = async (cid, data) => {
        try {
            let cart = await this.model.findById(cid).lean()
            if (cart === null) return {
                statusCode: 404,
                response: {
                    status: 'error', error: `Cart "${cid}" was not found`
                }
            }
            let products = data
            let newCart;
            if (!products) return {
                statusCode: 400,
                response: {
                    status: 'error', error: 'Products is required'
                }
            }
            newCart = products
            for (const prd of newCart) {
                if (!prd.hasOwnProperty('product') || !prd.hasOwnProperty('quantity')) return {
                    statusCode: 400,
                    response: {
                        status: 'error', error: 'The properties ID or Quantity are not valid'
                    }
                }
                if (prd.quantity === 0) return {
                    statusCode: 400,
                    response: {
                        status: 'error', error: 'Quantity cant be 0'
                    }
                }
                if (typeof prd.quantity !== 'number') return {
                    statusCode: 400,
                    response: {
                        status: 'error', error: 'Quantity must be a Number'
                    }
                }
                const prdToAdd = await this.modelProduct.findById(prd.product).lean()
                if (prdToAdd === null) return {
                    statusCode: 400,
                    response: {
                        status: 'error', error: `Product with ID: ${prd.product} was not found`
                    }
                }
            }
            cart.products = newCart
            await this.model.findByIdAndUpdate(cid, cart, { Document: 'after' })
            cart = await this.model.findById(cid).lean()
            return {
                statusCode: 200,
                response: {
                    status: 'success', payload: cart.products
                }
            }
        } catch (err) {
            return {
                statusCode: 500,
                response: {
                    status: 'error', payload: err
                }
            }
        }
    }
    create = async () => {
        try {
            const result = await this.model.create({})
            return {
                statusCode: 201,
                response: {
                    status: 'success', payload: result
                }
            }
        } catch (error) {
            return {
                statusCode: 500,
                response: {
                    status: 'error', error: error.message
                }
            }
        }
    }
    addProductToCart = async (cid, pid) => {
        try {
            let cart = await this.model.findById(cid).lean()
            if (cart === null) return {
                statusCode: 400,
                response: {
                    status: 'error', error: `El carrito "${cid}" no fue encontrado`
                }
            }
            let product = await this.modelProduct.findById(pid).lean()
            if (product === null) return {
                statusCode: 400,
                response: { status: 'error', error: `El producto "${pid}" no fue encontrado` }
            }
            if (product.stock === 0) return {
                statusCode: 400,
                response: { status: 'error', error: `El producto no tiene stock disponible` }
            }
            let quantity = 1
            product = { product, quantity }
            if (quantity === null) return {
                statusCode: 400,
                response: { status: 'error', error: 'Especifique la cantidad para agregar' }
            }
            let productIndex = cart.products.findIndex(prd => prd.product._id == pid)
            if (productIndex >= 0) {
                const newQuantity = cart.products[productIndex].quantity + quantity;
                if (newQuantity > product.product.stock) {
                    return {
                        statusCode: 400,
                        response: { status: 'error', error: 'No hay suficiente stock para agregar más unidades' }
                    }
                }
                cart.products[productIndex].quantity = newQuantity;
            } else {
                cart.products.push(product)
            }
            await this.model.findByIdAndUpdate(cid, cart, { Document: 'after' })
            cart = await this.model.findById(cid).lean()
            return {
                statusCode: 200,
                response: { status: 'success', payload: cart }
            }
        } catch (err) {
            return {
                statusCode: 500,
                response: { status: 'error', error: err.message }
            }
        }
    }
    deleteProductFromCart = async (cid, pid) => {
        try {
            let cart = await this.model.findById(cid).lean()
            if (cart === null) return {
                statusCode: 400,
                response: { status: 'error', error: `Cart "${cid}" was not found` }
            }
            let product = await this.modelProduct.findById(pid).lean()
            if (product === null) return {
                statusCode: 404,
                response: { status: 'error', error: `Product "${pid}" does not exist` }
            }
            let filter = cart.products.find((prd) => prd.product.toString() === pid)
            if (!filter) return {
                statusCode: 404,
                response: { status: 'error', error: `Product "${pid}" was not found in cart "${cid}"` }
            }
            cart.products = cart.products.filter(prd => prd.product.toString() !== pid)
            if (!cart.products) return {
                statusCode: 400,
                response: { status: 'error', error: `Product "${pid}" in cart ${cid} was not found` }
            }
            await this.model.findByIdAndUpdate(cid, cart, { Document: 'after' })
            cart = await this.model.findById(cid).lean()
            return {
                statusCode: 200,
                response: { status: 'success', payload: cart }
            }
        } catch (err) {
            return {
                statusCode: 500,
                response: { status: 'error', payload: err.message }
            }
        }
    }
    updateProductFromCart = async (cid, pid, data) => {
        try {
            let cart = await this.model.findById(cid).lean()
            if (cart === null || !cart) {
                return {
                    statusCode: 400,
                    response: { status: 'error', error: `Cart "${cid}" was not found` }
                }
            }
            let productTest = await this.modelProduct.findById(pid).lean()
            if (!productTest) return {
                statusCode: 400,
                response: { status: 'error', error: `Product with ID "${pid}" was not found` }
            }
            let productUpdate = cart.products.findIndex(prd => prd.product.toString() === pid)
            if (productUpdate < 0) return {
                statusCode: 400,
                response: { status: 'error', error: `Product "${pid}" in cart ${cid} was not found` }
            }
            let newQuantity = data
            if (newQuantity === 0) return {
                statusCode: 400,
                response: { status: 'error', error: 'Quantity value cant be 0' }
            }
            if (!newQuantity) return {
                statusCode: 400,
                response: { status: 'error', error: 'Quantity value is a required field' }
            }
            if (typeof newQuantity !== 'number') return {
                statusCode: 400,
                response: { status: 'error', error: 'Quantity must be a number' }
            }
            cart.products[productUpdate].quantity = newQuantity
            let result = await this.model.findByIdAndUpdate(cid, cart, { Document: 'after' }).lean()
            cart = await this.model.findById(cid).lean()
            if (!result) return {
                statusCode: 400,
                response: { status: 'error', error: 'Cart could not be updated' }
            }
            else return {
                statusCode: 200,
                response: { status: 'success', payload: cart }
            }
        } catch (err) {
            return {
                statusCode: 500,
                response: { status: 'error', payload: err }
            }
        }
    }
}