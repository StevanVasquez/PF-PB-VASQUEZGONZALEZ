export default class ProductRepository {
    constructor(dao) {
        this.dao = dao
    }
    getAll = async () => await this.dao.getAll()
    getById = async (pid) => await this.dao.getById(pid)
    create = async (product) => await this.dao.create(product)
    update = async (pid, productToUpdate) => await this.dao.update(pid, productToUpdate)
    delete = async (pid) => await this.dao.delete(pid)
}