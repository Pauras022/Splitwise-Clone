// routes/groups.js
const express = require("express");
const Group = require("../models/group");
const User = require("../models/user");
const Item = require("../models/item");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const groups = await Group.find();
    res.status(200).json(groups);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    res.status(200).json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const group = new Group({ title: req.body.title });
    group.members.push(req.body.user);
    const result = await group.save();
    const user = await User.findById(req.body.userId);
    user.groups.push(result._id.toString());
    await user.save();
    res.status(201).json({ id: result._id.toString() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/items", async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const item = new Item({
      title: req.body.title,
      owe: {},
      groupId: req.params.id,
      paidBy: req.body.paid_by.toString(),
      category: req.body.category,
      expense: req.body.expense,
    });
    const paid_by = req.body.paid_by;
    const splitType = req.body.split_type;
    const members = group.members;
    const numMembers = members.length;
    let totalAmount = req.body.expense;

    switch (splitType) {
      case "paid_equally":
        const amountPerMember = totalAmount / numMembers;
        for (const member of members) {
          if (member != req.body.paid_by.toString()) {
            item.owe[member] = amountPerMember;
          }
        }
        item.owe[req.body.paid_by.toString()] = -totalAmount + amountPerMember;
        break;

      case "manually":
        const manuallySplit = req.body.manually_split;
        const total = Object.values(manuallySplit).reduce((a, b) => a + b, 0);
        if (total != totalAmount)
          return res.status(400).json({
            message:
              "Total amount must be equal to the sum of manually split amounts",
          });
        for (const userId in manuallySplit) {
          if (manuallySplit.hasOwnProperty(userId) && userId != paid_by) {
            const owe = manuallySplit[userId];
            item.owe[userId] = owe;
          }
        }
        item.owe[req.body.paid_by.toString()] =
          -totalAmount + manuallySplit[paid_by];
        break;

      case "by_percentage":
        const percentSplit = req.body.percent_split;
        const totalPercentage = Object.values(percentSplit).reduce(
          (a, b) => a + b,
          0
        );
        if (totalPercentage != 100)
          return res
            .status(400)
            .json({ message: "Percentage split must add up to 100" });
        for (let userId in percentSplit) {
          if (
            percentSplit.hasOwnProperty(userId) &&
            userId != req.body.paid_by.toString()
          ) {
            const percentage = percentSplit[userId] / totalPercentage;
            item.owe[userId] = totalAmount * percentage;
            console.log(item.owe[userId] + "\n");
          }
        }
        const paidByPercentage =
          percentSplit[req.body.paid_by] / totalPercentage;
        item.owe[req.body.paid_by] =
          -totalAmount + totalAmount * paidByPercentage;
        break;

      default:
        return res.status(400).json({ message: "Invalid split type" });
    }

    const resultItem = await item.save();
    group.items.push(resultItem._id.toString());
    group.totalSpendings += req.body.expense;
    const { memberOwes } = group;
    const { owe, paidBy } = item;
    //console.log(owe[paidBy]);
    members.forEach((userId) => {
      // Update the amount owed for each member in the group based on the item
      members.forEach((otherMemberId) => {
        if (
          userId != paidBy &&
          userId !== otherMemberId &&
          otherMemberId == paidBy
        ) {
          //console.log(owe[userId]);
          if (memberOwes[userId] === undefined) {
            memberOwes[userId] = {};
            memberOwes[userId][otherMemberId] = owe[userId];
          } else {
            if (memberOwes[userId][otherMemberId] != undefined) {
              memberOwes[userId][otherMemberId] += owe[userId];
            } else {
              memberOwes[userId][otherMemberId] = owe[userId];
            }
          }
          if (memberOwes[otherMemberId] === undefined) {
            memberOwes[otherMemberId] = {};
            memberOwes[otherMemberId][userId] = owe[userId];
          } else {
            if (memberOwes[otherMemberId][userId] != undefined) {
              memberOwes[otherMemberId][userId] -= owe[userId];
            } else {
              memberOwes[otherMemberId][userId] = -owe[userId];
            }
          }
        }
      });
    });
    //console.log(memberOwes);
    group.memberOwes = memberOwes;
    console.log(group.memberOwes);
    await group.save();
    //find all users in the group
    const users = group.members;
    //add item id to each of the members
    const updatedUsers = await User.find({ _id: { $in: users } });
    updatedUsers.forEach(async (user) => {
      user.items.push(resultItem._id.toString());
      await user.save();
      //console.log(`Updated user: ${user.name}`);
    });

    const paidbyuser = await User.findById(req.body.paid_by);
    paidbyuser.totalSpendings += totalAmount;
    await paidbyuser.save();

    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Add a member to a group
router.post("/:groupId/members", async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const { memberId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    // Check if the member is already in the group
    const memberExists = group.members.includes(memberId);
    if (memberExists) {
      return res
        .status(400)
        .json({ message: "Member already exists in the group" });
    }

    // Add the member to the group
    group.members.push(memberId);
    resultgroup = await group.save();
    const member = await User.findById(memberId);
    member.groups.push(resultgroup._id.toString());
    await member.save();

    res.status(200).json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/:id/settle-up", async (req, res) => {
  try {
    const groupId = req.params.id;
    const { payerId, receiverId, amount } = req.body;

    // Retrieve group from database
    const group = await Group.findById(groupId);

    // Update memberowes in the group
    group.memberOwes[payerId][receiverId] -= amount;
    group.memberOwes[receiverId][payerId] += amount;
    await group.save();

    const payer = await User.findById(payerId);
    const receiver = await User.findById(receiverId);
    payer.totalSpendings += amount;
    receiver.totalSpendings -= amount;

    await payer.save();
    await receiver.save();

    res.status(200).json({ message: "Debt settled successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error settling debt." });
  }
});

router.get("items/:id", async (req, res) => {
  try {
    const item = Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    return res.status(200).json(item);
  } catch {}
});
router.get("/:id/items", async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    const items = await Promise.all(
      group.items.map(async (itemId) => {
        const i = await Item.findById(itemId);
        return i;
      })
    );
    if (!items) {
      return res.status(404).json({ message: "Items not found" });
    }
    return res.status(200).json(items);
  } catch {}
});

module.exports = router;
