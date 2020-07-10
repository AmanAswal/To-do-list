// jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(express.static("public"));

// mongoose part
mongoose.connect("mongodb+srv://admin-aman:imamanxd11@todolist1.tlxzo.mongodb.net/todolistDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});


// make Schema
const itemsSchema = {
    name: String
};

// make a collection "Item"
const Item = mongoose.model("Item", itemsSchema);

// making default 3 items 
const item1 = new Item({
    name: "Welcome to your todo-list!"
});

const item2 = new Item({
    name: "Hit the + button to add a new item."
});

const item3 = new Item({
    name: "<-- Hit this to delete an item."
});

// Constructing array of default items
const defaultItems = [item1, item2, item3];

// Constructing schema for dynamic lists
const listSchema = {
    name: String,
    items: [itemsSchema]
};
// making mongoose model
const List = mongoose.model("List", listSchema);



app.get("/", (req, res) => {

    Item.find({}, function (err, foundItems) {
        // only add default items if there is no item in the todo list 
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully saved default items to DB.");
                }
            });
            // redirect to home page
            res.redirect("/");
        } else {
            // send the added item and render it to list.ejs 
            res.render("list", {
                listTitle: "Today", // title of todo list
                newListItems: foundItems // sending the added item as newListItems
            });
        }
    });
});



app.post("/", (req, res) => {
    // only save the item name
    const itemName = req.body.newItem;
    
    // for custom route pages list
    const listName = req.body.list;
    // making a new item document in mongodb (just like making default items above)
    const item = new Item({
        name: itemName
    });

    if(listName == "Today"){
        // save the added item
        item.save();
        // redirect to home page to see the changes
        res.redirect("/");
    } else {
        List.findOne({name: listName}, function(err, foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });
    }

});


// delete a item
app.post("/delete", function (req, res) {
    // this stores the value of req.body when checkbox is checked off turning its value = on    
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    // check if the list Name is our Home default page
    if(listName == "Today"){
         // remove the item of checkedItemId = _id returned by the list.ejs
        Item.findByIdAndRemove(checkedItemId, function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log("Item successfully removed.");
            res.redirect("/");
        }
    });
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
            if(!err){
                res.redirect("/" + listName);
            }
        });
    }
   

});

// dynamic express routers
app.get('/:customListName', function (req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, function(err, foundList){
        if(!err){
            if(!foundList){
                // create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });

                list.save();
                res.redirect("/" + customListName); 
            } else {
                res.render("list", {
                    listTitle: foundList.name, // title of todo list
                    newListItems: foundList.items // sending the added item as newListItems
                });
            }
        }
    });  
  });


  let port = process.env.PORT;
  if (port == null || port == "") {
    port = 4000;
  }
  


app.listen(port, () => {
    console.log("Server started successfully.");

});