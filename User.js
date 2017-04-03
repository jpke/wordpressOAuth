var mongoose = require('mongoose')

var UserSchema = new mongoose.Schema({
  WordpressId: {
    type: String
  },
  accessToken: {
    type: String
  }
})

var User = mongoose.model('User', UserSchema)
module.exports = User
