import messageModel from './dao/models/message.model.js'
import logger from './utils/logger.js'
import { ProductService } from './services/index.js'

export default (io) => {
    io.on('connection', async socket => {
        logger.info(`Nuevo cliente conectado: ${socket.id}`)
        const productsList = await ProductService.getAll()
        const result = productsList.response.payload
        socket.emit('products', result)
        socket.on('add', async product => {
            await ProductService.create(product)
            const productsList = await ProductService.getAll()
            const result = productsList.response.payload
            io.emit('products', result)
        });
        socket.on('delete', async id => {
            await ProductService.delete(id)
            const productsList = await ProductService.getAll()
            const result = productsList.response.payload
            io.emit('products', result)
        });
        socket.broadcast.emit('alert')
        let messages = await messageModel.find().lean().exec()
        socket.emit("logs", messages)
        socket.on("message", async data => {
            await messageModel.create(data)
            let messages = await messageModel.find().lean().exec()
            io.emit("logs", messages)
        });
    })
}