// routes/users.js
const express = require("express");
const User = require("../models/user");
const Item = require("../models/item");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id/name", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({ name: users.name });
  } catch {}
});

router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const user = new User({ name: req.body.name });
    const result = await user.save();
    res.status(201).json({ id: result._id.toString() });
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

router.get("/:id/friends", async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const friends = user.friends;

    res.json(friends);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// Add a friend
router.post("/:id/friends", async (req, res) => {
  try {
    const { friendId } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the friend is already in the user's friends list
    const friendExists = user.friends.includes(friendId);
    if (friendExists) {
      return res
        .status(400)
        .json({ message: "Friend already exists in the user's friends list" });
    }

    // Add the friend to the user's friends list
    user.friends.push(friendId);
    await user.save();

    const friend = await User.findById(friendId);
    friend.friends.push(user._id.toString());
    friend.save();

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Remove a friend
router.delete("/:id/friends", async (req, res) => {
  try {
    const { friendId } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the friend is in the user's friends list
    const friendExists = user.friends.includes(friendId);
    if (!friendExists) {
      return res
        .status(400)
        .json({ message: "Friend does not exist in the user's friends list" });
    }

    // Remove the friend from the user's friends list
    user.friends.pull(friendId);
    await user.save();

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/:id/items", async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    const expenseIds = user.items;
    const Expenses = await Item.find({ _id: { $in: expenseIds } });
    //console.log(Expenses);
    res.status(200).json(Expenses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
