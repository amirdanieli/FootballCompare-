const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

const UserSchema = new Schema({
    fName: {
        type: String,
        required: true,
    },
    lName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        unique: true,
        required: true,
        lowercase: true 
    },
    password: {
        type: String,
        required: true,
    }
});

UserSchema.statics.findAndValidate = async function (username, password) {
    const foundUser = await User.findOne({ email: username });
    if (!foundUser) {
        return false;
    }
    const passwordMatch = await bcrypt.compare(password , foundUser.password);
    return passwordMatch? foundUser : false;
}

UserSchema.pre('save', async function (next) {
    const emailExists = await User.findOne({ email: this.email });
    if (emailExists) {
        const err = new Error('Email already exists');
        return next(err);
    }


    if (!this.isModified('password')) return next();

    try {
        const hashedPassword = await bcrypt.hash(this.password, 10);
        this.password = hashedPassword;
        next();
    } catch (err) {
        return next(err);
    }
});

const User = mongoose.model('User', UserSchema);

module.exports = User;

