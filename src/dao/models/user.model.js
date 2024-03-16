import mongoose from "mongoose";

const userCollection = 'users'
const userSchema = new mongoose.Schema({
    first_name: { type: String, required: true },
    last_name: { type: String, required: false },
    email: { type: String, unique: true, required: true },
    age: { type: Number, required: false },
    password: { type: String, required: false },
    cart: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "carts"
    },
    role: { type: String, enum: ['user', 'admin', 'premium'], default: 'user' },
    documents: [],
    last_login: { type: Date, default: Date.now }
})
mongoose.set("strictQuery", false)
const userModel = mongoose.model(userCollection, userSchema);
export default userModel;