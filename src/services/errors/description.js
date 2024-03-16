export const generateErrorInfo = (product) => {
    return `
    Una o mas propiedades están incompletas o no son válidas.
    Lista de propiedades obligatorias:
        - title: Debe ser un String = (${product.title})
        - description: Debe ser un String = (${product.description})
        - price: Debe ser un número = (${product.price})
        - code: Debe ser un código único = (${product.code})
        - category: Debe ser un String = (${product.category})
        - stock: Debe ser un número = (${product.stock})
        - thumbnail: Debe ser un Array = (${product.thumbnail})
    `
}
export const generateErrorInfoTwo = (data) => {
    return `La respuesta del servidor fue: ${data}`
}
export const generateErrorInfoThree = (data) => {
    return `${data}`
}