import { ProductService, UserService } from '../services/index.js'
import CustomError from '../services/errors/custom_error.js'
import EErros from '../services/errors/enums.js'
import { generateErrorInfo, generateErrorInfoTwo } from '../services/errors/description.js'
import nodemailer from 'nodemailer'
import config from '../config/config.js';
import logger from '../utils/logger.js'

const getProducts = async (req, res) => {
    const { limit = 10, page = 1 } = req.query
    const pageFilters = {}
    if (req.query.category) pageFilters.category = req.query.category
    if (req.query.stock) pageFilters.stock = req.query.stock
    const paginateOpt = { lean: true, limit, page }
    if (req.query.sort === 'asc') paginateOpt.sort = { price: 1 }
    if (req.query.sort === 'des') paginateOpt.sort = { price: -1 }
    const result = await ProductService.dao.model.paginate(pageFilters, paginateOpt)
    if (!result) return {
        statusCode: 500,
        response: {
            status: 'error',
            error: result,
        }
    }
    let previousLink;
    if (req.query.page) {
        const modifiedUrl = req.originalUrl.replace(`page=${req.query.page}`, `page=${result.prevPage}`)
        previousLink = `http://${req.hostname}:8080${modifiedUrl}`
    } else {
        previousLink = `http://${req.hostname}:8080${req.originalUrl}&page=${result.prevPage}`
    }
    let nextLink;
    if (req.query.page) {
        const modifiedUrl = req.originalUrl.replace(`page=${req.query.page}`, `page=${result.nextPage}`)
        nextLink = `http://${req.hostname}:8080${modifiedUrl}`
    } else {
        nextLink = `http://${req.hostname}:8080${req.originalUrl}&page=${result.nextPage}`
    }
    return res.send({
        statusCode: 200,
        response: {
            status: 'success',
            payload: result.docs,
            totalPages: result.totalPages,
            prevPage: result.prevPage,
            nextPage: result.nextPage,
            page: result.page,
            hasPrevPage: result.hasPrevPage,
            hasNextPage: result.hasNextPage,
            previousLink: result.hasPrevPage ? previousLink : null,
            nextLink: result.hasNextPage ? nextLink : null
        }
    })
}
const getProductByIdController = async (req, res) => {
    const pid = req.params.pid
    const result = await ProductService.getById(pid)
    if (result.statusCode === 500 || result.statusCode === 400) {
        try {
            CustomError.createError({
                name: "Error en busqueda de producto",
                cause: generateErrorInfoTwo(result.response.payload),
                message: "No se pudo obtener el producto por su ID",
                code: EErros.DATABASES_ERROR
            })
            logger.error('Error al buscar un producto por su ID')
        } catch (err) {
            logger.error(err)
        }
        res.status(result.statusCode).send(result.response.error)
    }
    res.send(result.response.payload)
}
const addProductController = async (req, res) => {
    let { title, description, price, code, category, stock, thumbnail } = req.body
    const product = { title, description, price, code, category, stock, thumbnail }
    if (!title || !description || !price || !code || !category || !stock || !thumbnail) {
        const error = CustomError.createError({
            name: "ERROR EN LA CREACIÓN DEL PRODUCTO",
            cause: generateErrorInfo(product),
            message: "El producto no se pudo crear debido a que faltan propiedades.",
            code: EErros.INVALID_TYPES_ERROR
        })
        logger.error(`El producto ${code} no se pudo crear debido a que faltan propiedades.`)
        return res.status(400).render('pageError', {
            error: error.message
        })
    } else {
        if (req.session.user) {
            product.owner = req.session.user.email
        }
        const products = await ProductService.getAll()
        const exists = products.response.payload.find(prd => prd.code === product.code)
        if (exists) return res.status(400).json({ status: 'error', error: 'El producto con este codigo ya existe!' })
        const result = await ProductService.create(product)
        if (result.statusCode === 500) {
            const error = CustomError.createError({
                name: "ERROR EN LA CREACIÓN DEL PRODUCTO",
                cause: generateErrorInfo(product),
                message: `El producto no se pudo crear debido a que el codigo "${code}" ya existe`,
                code: EErros.PRODUCT_CODE
            })
            logger.error(error.message)
            return res.status(result.statusCode).render('pageError', {
                error: error.message
            })
        }
        logger.info(`El producto ${product.code} fue creado con éxito por el usuario ${req.session.user.email}`)
        res.status(result.statusCode).json({ status: 'success', payload: result })
    }
}
const updateProductController = async (req, res) => {
    const pid = req.params.pid
    if (!pid) return res.status(400).json({ status: 'error', error: 'ID solicitado no disponible' })
    if (req.session.user === 'premium') {
        const product = await ProductService.getById(pid)
        if (product.response.payload.owner !== req.session.user.email) return res.status(403).json({ status: 'error', payload: 'No autorizado para editar producto' })
    }
    const productToUpdate = req.body
    const products = await ProductService.getAll()
    const exists = products.response.payload.find(prd => prd.code === productToUpdate.code)
    if (exists && exists._id !== pid) return res.status(400).json({ status: 'error', error: 'Ya existe un producto con este codigo!' });
    const result = await ProductService.update(pid, productToUpdate)
    if (result.statusCode === 500) {
        return res.status(result.statusCode).send(result.response.error)
    }
    res.status(result.statusCode).send(result)
}
const deleteProductController = async (req, res) => {
    const mailConfig = {
        service: 'gmail',
        auth: { user: config.nodemailer_user, pass: config.nodemailer_pass }
    }
    const transporter = nodemailer.createTransport(mailConfig)
    const pid = req.params.pid
    const product = await ProductService.getById(pid)
    if (product.statusCode === 404 || product.statusCode === 500) return res.json({ status: 'error', error: product.response.error })
    if (req.session.user.role === 'premium') {
        if (product.response.payload.owner !== req.session.user.email) return res.status(403).json({ status: 'error', error: 'No autorizado, solo el dueño del producto puede borrarlo!' })
    }
    if (req.session.user.role === 'user') return res.status(403).json({ status: 'error', error: 'No autorizado, solo admin o premium puede utilizar esta funcion' })
    const result = await ProductService.delete(pid)
    if (result.statusCode === 500 || result.statusCode === 400) {
        return res.status(result.statusCode).json({ status: 'error', error: 'No se pudo borrar el producto' })
    }
    const user = await UserService.getOne(product.response.payload.owner)
    if (user.response.status !== 'error' && user.response.payload.role === 'premium') {
        let message = {
            from: config.nodemailer_user,
            to: product.response.payload.owner,
            subject: '[ ELECTROKEVIN ] Mensaje de aviso!!!!',
            html: `<h1>[ IMPORTANTE! ] ELECTROKEVIN | Tienda de Tecnologia Virtual</h1>
            <hr />
            <p> Nos contactamos con usted para informarle que el siguiente producto fue eliminado del sistema.: <br>
            <h3>${product.response.payload._id}</h3>
            <h4>${product.response.payload.title}</h4></p>
            <p> En caso de cualquier duda, contactese con un administrador! </p>
            <br>
            <hr />
            <br>
            <br>
            Saludos,<br><strong>Equipo de ELECTROKEVIN Colombia.</strong>`
        }
        await transporter.sendMail(message)
    }
    res.status(result.statusCode).json({ status: 'success', payload: result })
}
export default { getProducts, getProductByIdController, addProductController, updateProductController, deleteProductController }