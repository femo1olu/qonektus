//Allows us to have a schema/model for data going into MongoDB.
const bcrypt = require("bcryptjs");
//const Schema = mongoose.Schema;
const bcryptSalt = process.env.BCRYPT_SALT;
const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: true
  },
  lastname: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password1: {
    type: String,
    required: true
  },
  password2: {
    type: String,
    required: true
  },
  areacode: {
    type: Number,
    required: true
  },
  exchangecode: {
    type: Number,
    required: true
  },
  lineid: {
    type: Number,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    required: true
  },
  interest1: {
    type: Array,
    required: true
  },
  interest2: {
    type: Array,
    required: true
  },
  paid_omoniyi: {
    type: String,
    required: true
  },
  paid_afolami: {
    type: String,
    required: true
  },
  paid_adeyemo: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  token: {
    type: String,
    require: true
  }
});

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password1")) {
    return next();
  }
  const hash = await bcrypt.hash(this.password1, Number(bcryptSalt));
  this.password1 = hash;
  this.password2 = hash;
  next();
});


const User = mongoose.model('User', UserSchema);

module.exports = User;
/*
//later added to ease interaction with Mongo DB
const users = [];

function createUser(user) {
   users.push(user);
}

function getUser(email) {
    const thisUser = users.find(user => user.email === email);
    return thisUser;
}

function updateUser(user) {
    const thisUserIndex = users.findIndex(local => local.email === user.email);
    users[thisUserIndex] = user;
}

module.exports = {
    createUser,
    getUser,
    updateUser
}
*/