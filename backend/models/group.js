// group.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const groupSchema = new Schema({
  title: {
    type: String,
  },
  members: [
    {
      type: String,
    },
  ],
  items: [
    {
      type: String,
    },
  ],
  totalSpendings: {
    type: Number,
    default: 0,
  },
  memberOwes: {
    // type: Map,
    // of: Map,
    // default: new Map().set("", new Map().set("", 0)),
    type: Schema.Types.Mixed,
    default: {},
  },
});

const Group = mongoose.model("Group", groupSchema);

module.exports = Group;
