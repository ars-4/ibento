const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    ip_address: String,
    role: String,
    timestamp: Date
})
const User = mongoose.model('User', userSchema);

const tokenSchema = new mongoose.Schema({
    key: String,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    timestamp: Date
})
const Token = mongoose.model('Token', tokenSchema);

const companySchema = new mongoose.Schema({
    name: String,
    address: String,
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    employees: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    timestamp: Date
})
const Company = mongoose.model('Company', companySchema);

const eventSchema = new mongoose.Schema({
    name: String,
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    },
    attendees: [String],
    event_type: String,
    timestamp: Date
})
const Event = mongoose.model('Event', eventSchema);

const EventDateSchema = new mongoose.Schema({
    date: {
        day: Number,
        month: Number,
        year: Number
    },
    time: {
        hour: Number,
        minute: Number
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event'
    },
    guests: Number,
    price: Number,
    status: String,
    notes: String,
    timestamp: Date
})
const EventDate = mongoose.model('EventDate', EventDateSchema);

const LogSchema = new mongoose.Schema({
    message: String,
    timestamp: Date
})
const Log = mongoose.model('Log', LogSchema);

module.exports = {
    User,
    Token,
    Company,
    Event,
    EventDate,
    Log
}