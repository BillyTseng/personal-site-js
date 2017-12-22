var db = require("../db");

// Define the schema
var recordSchema = new db.Schema({
    deviceId:   String,
    longitude:  Number,
    latitude:   Number,
    uv:         Number,
    submitTime: { type: Date, default: Date.now }
});

// Creates a Record (plural) collection in the db using the record schema
var Record = db.model("Record", recordSchema);

module.exports = Record;
