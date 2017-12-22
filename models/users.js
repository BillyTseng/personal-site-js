var db = require("../db");

var userSchema = new db.Schema({
  email:        { type: String, required: true, unique: true },
  fullName:     { type: String, required: true },
  passwordHash: String,
  lastAccess:   { type: Date, default: Date.now },
  userDevices:  [ String ],
  randomStr:    String,
  verified:     { type: Boolean, default: false }
});

var User = db.model("User", userSchema);

module.exports = User;