export default class CustomError {
    static createError({ name, cause, message }) {
        const error = new Error()
        error.name = name
        error.message = message
        error.cause = cause
        return error
    }
}