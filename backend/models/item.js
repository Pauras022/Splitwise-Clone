// item.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const itemSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  paidBy: {
    type: String,
  },
  owe: {
    // type: Map,
    // of: Number,
    // required: true,
    // default: new Map().set("", 0),
    type: Schema.Types.Mixed,
    required: true,
    default: {},
  },
  expense: {
    type: Number,
    required: true,
  },
  groupId: {
    type: String,
  },
  category: {
    type: Number,
    required: true,
  },
});

const Item = mongoose.model("Item", itemSchema);

module.exports = Item;
