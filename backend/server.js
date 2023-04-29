const express = require("express");
const mongoose = require("mongoose");
const usersRouter = require("./routes/users");
const groupsRouter = require("./routes/groups");

const app = express();

// middleware
app.use(express.json());

// routes
app.use("/users", usersRouter);
app.use("/groups", groupsRouter);

// database
// mongoose.connect("mongodb://localhost:27017", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });
// mongoose.connection.once("open", () => {
//   console.log("Connected to MongoDB");
// });

const uri =
  "mongodb+srv://pauras22:P7TvlnZpU0uuRXMQ@cluster0.v1nol.mongodb.net/splitwise?retryWrites=true&w=majority";

mongoose
  .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.log(err));

// start server
const port = 3000;
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
