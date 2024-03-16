import mongoose from "mongoose";
import mongoosePaginate from 'mongoose-paginate-v2'

const productCollection = 'products'
const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    code: { type: String, unique: true, required: true },
    stock: { type: Number, required: true },
    category: { type: String, required: true },
    thumbnail: { type: [String], default: [] },
    owner: {
        type: String, required: true, default: 'admin', ref: "users"
    }
})
productSchema.plugin(mongoosePaginate);
export const productModel = mongoose.model(productCollection, productSchema);
