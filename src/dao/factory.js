import config from '../config/config.js'
export let Product;
export let Cart;
export let User;
switch (config.persistence) {
    case 'MONGO':
        
        const { default: ProductDao } = await import('./productDao.js')
        const { default: CartDao } = await import('./cartDao.js')
        const { default: UserDao } = await import('./userDao.js')

        Product = ProductDao
        Cart = CartDao
        User = UserDao
        break;
    default:
        break;
}


