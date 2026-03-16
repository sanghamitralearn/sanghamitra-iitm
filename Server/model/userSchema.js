const mongoose = require('mongoose')
const bcrypt = require('bcryptjs') 
const jwt = require('jsonwebtoken')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    tokens: [
        {
            token: {
                type: String,
                required: true,
            }
        }
    ],
    loginHistory: [{ loginTimestamp: { type: Date, default: Date.now } }]
});

// we are hashing the password
userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 12);
    }
    next();
})  

// we are tracking the login record
userSchema.methods.updateLoginHistory = async function () {
    try {
        this.loginHistory.push({ loginTimestamp: Date.now() });
        await this.save();
    } catch (error) {
        console.log(error);
    }
}


// we are generating token
userSchema.methods.generateAuthToken = async function () {
    try {
        let token = jwt.sign({ _id: this._id }, process.env.SECRET_KEY);
        this.tokens = this.tokens.concat({ token: token });
        await this.save()
        return token;
    } catch (error) {
        console.log(error);
    }
}

const User = mongoose.model('USER', userSchema);

module.exports = User;
