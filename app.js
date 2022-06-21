//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

//create a db
//mongoose.connect("mongodb://localhost:27017/todolistDB");
mongoose.connect("mongodb+srv://admin-amira:test-123@cluster0.ft751.mongodb.net/todolistDB")
//create schema
const itemsSchema = {
  name: {
    type: String,
    required: [true, "Can't add empty item"]
  }
};

//create model
const Item = mongoose.model("item", itemsSchema);

//creating three default docs
const firstItem = new Item({
  name: "Welcome to your todoList!"
});
const secondItem = new Item({
  name: "Hit the + button to add a new item."
});
const thirdItem = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [firstItem, secondItem, thirdItem];

//creating a new schema for custom lists
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
})

//creating the model for lists
const List = mongoose.model("list", listSchema);


app.get("/", function(req, res) {
  //const day = date.getDate();
  Item.find({}, function(err, allItems) {
    if (err) {
      console.log(err);
    } else {
      if (allItems.length === 0) {
        Item.insertMany(defaultItems, function(err) {
          if (err) {
            console.log(err);
          } else {
            console.log("successfully saved default items to DB");
          }
        });
        res.redirect("/");
      } else {
        res.render("list", {
          listTitle: "Today",
          newListItems: allItems
        });
      }

    }
  });


});

app.post("/", function(req, res) {
  const itemName = req.body.newItem;
  listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, function(err, foundList) {
      if (!err) {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName)
      } else {
        console.log(err);
      }

    });
  }

});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listTitle = req.body.listTitle;
  if (listTitle === "Today") {
    Item.findByIdAndRemove(req.body.checkbox, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log('deleted successfully');
        setTimeout(() => {
          res.redirect("/")
        }, 500);
      }
    });
  } else {
    List.findOneAndUpdate({
      name: listTitle
    }, {
      $pull: {
        items: {
          _id: checkedItemId
        }
      }
    }, function(err, foundList) {
      if (!err) {
        res.redirect("/" + listTitle);
      }
    });
  }

})


app.get("/:customListName", function(req, res) {
  //this lodash method capitalizes the first letter and makes the rest in lower case
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        //Create a new list
        const newList = new List({
          name: customListName,
          items: defaultItems
        });
        newList.save();
        res.redirect("/" + customListName);
      } else {
        //Show an existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        })
      }
    }
  })

})

app.get("/about", function(req, res) {
  res.render("about");
});

let port = process.env.PORT;
if(port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started successfully");
});
