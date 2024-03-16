import { productModel } from "./models/product.model.js";

export default class ProductDao {
    constructor() {
        this.model = productModel
    }
    getAll = async () => {
        try {
            const result = await this.model.find().lean()
            return {
                statusCode: 200,
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
    getById = async (pid) => {
        try {
            const result = await this.model.findOne({ _id: pid }).lean()
            if (!result || result === null) return {
                statusCode: 404,
                response: { status: 'error', error: 'Product does not exist' }
            }
            return {
                statusCode: 200,
                response: { status: 'success', payload: result }
            }
        } catch (error) {
            return {
                statusCode: 500,
                response: { status: 'error', error: `El producto ${pid} no existe o ID inválida.` }
            }
        }
    }
    create = async (product) => {
        try {
            let result = await this.model.create(product)
            if (!result) return {
                statusCode: 400,
                response: { status: 'error', error: 'The product could not be added' }
            }
            return {
                statusCode: 201,
                response: { status: 'success', payload: result }
            }
        } catch (err) {
            return {
                statusCode: 500,
                response: { status: 'error', error: 'err.message' }
            }
        }
    }
    update = async (pid, productToUpdate) => {
        try {
            if (!productToUpdate.title || !productToUpdate.description || !productToUpdate.price || !productToUpdate.code || !productToUpdate.category || !productToUpdate.thumbnail) {
                return {
                    statusCode: 400,
                    response: { status: 'error', error: 'Incomplete values' }
                }
            }
            let result = await this.model.updateOne({ _id: pid }, productToUpdate)
            if (!result) {
                return {
                    statusCode: 400,
                    response: { status: 'error', error: 'The product could not be updated' }
                }
            }
            return {
                statusCode: 200,
                response: { status: 'success', payload: result }
            }
        } catch (err) {
            return {
                statusCode: 500,
                response: { status: 'error', error: err.message }
            }
        }
    }
    delete = async (pid) => {
        try {
            let result = await this.model.deleteOne({ _id: pid }).lean()
            if (!result) return {
                statusCode: 400,
                response: { status: 'error', error: 'The product could not be deleted' }
            }
            return {
                statusCode: 200,
                response: { status: 'success', payload: result }
            }
        } catch (err) {
            return {
                statusCode: 500,
                response: { status: 'error', error: err.message }
            }
        }
    }
}