//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const serverless = require("serverless-http");

const app = express();
// const database = module.exports = () => {
//   const connectionParams = {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   }
//   try {
//     mongoose.connect('mongodb+srv://Jeeya:jeeya28@cluster0.ae9il1u.mongodb.net/?retryWrites=true&w=majority');
//     console.log("Connect Successfully");
//   }
//   catch (err) {
//     console.log(err);
//   }
// }

// database();
const router = express.Router();
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(
  "mongodb+srv://Jeeya:jeeya28@cluster0.ae9il1u.mongodb.net/todoListDB",
  { useNewUrlParser: true, useUnifiedTopology: true }
);

const itemsSchema = {
  name: String,
};

router.get("/", (req, res) => {
  res.json({
    mission: "Accomplished",
  });
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!!",
});

const item2 = new Item({
  name: "Hit the + button to add a new item.",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item.",
});

const defaultItems = [item1, item2, item3]; // default items

const ListSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", ListSchema);

app.get("/", async function (req, res) {
  try {
    const foundItems = await Item.find({}).exec();

    if (foundItems.length === 0) {
      await Item.insertMany(defaultItems);
      console.log("Successfully saved default items.");
      res.redirect("/"); // Redirect to the root route after inserting default items
    } else {
      res.render("../views/list", {
        listTitle: "Today",
        newListItems: foundItems,
      });
    }
  } catch (err) {
    console.log(err);
  }
});

app.get("/:customListName", async function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  try {
    const foundList = await List.findOne({ name: customListName }).exec();

    if (!foundList) {
      const list = new List({
        name: customListName,
        items: defaultItems,
      });

      list.save();
      res.redirect("/" + customListName);
    } else {
      res.render("list", {
        listTitle: foundList.name,
        newListItems: foundList.items,
      });
    }
  } catch (err) {
    console.log(err); // Render a generic error page if there was an error
    res.render("error");
  }
});

app.post("/", async function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    await item.save();
    res.redirect("/");
  } else {
    try {
      const foundList = await List.findOne({ name: listName });
      foundList.items.push(item);
      await foundList.save();
      res.redirect("/" + listName);
    } catch (err) {
      console.log(err);
      res.redirect("/");
    }
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId)
      .then((removedItem) => {
        console.log("Successfully deleted checked item");
        res.redirect("/");
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    )
      .then((foundList) => {
        return res.redirect("/" + listName);
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});

app.use("/.netlify/functions/app", router);
module.exports.handler = serverless(app);
