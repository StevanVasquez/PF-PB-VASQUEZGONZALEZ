import logger from '../utils/logger.js';
import EErros from '../services/errors/enums.js';

export default (error, req, res, next) => {
    switch (error.code) {
        case EErros.INVALID_TYPES_ERROR:
            logger.error(error)
            res.status(400).send({ status: 'error', error: error })
            break;
        case EErros.PRODUCT_CODE:
            logger.error(error)
            res.status(400).send({ status: 'error', error: error })
            break;
        case EErros.AUTHENTICATION:
            logger.error(error)
            res.status(401).send({ status: 'error', error: error })
            break;
        default:
            logger.warning(error)
            res.status(500).send({ status: 'error', error: error })
            break;
    }
}