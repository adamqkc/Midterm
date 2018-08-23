"use strict";

require('dotenv').config();

const PORT        = process.env.PORT || 8080;
const ENV         = process.env.ENV || "development";
const express     = require("express");
const bodyParser  = require("body-parser");
const sass        = require("node-sass-middleware");
const app         = express();
const cookieParser= require("cookie-parser")

const knexConfig  = require("./knexfile");
const knex        = require("knex")(knexConfig[ENV]);
const morgan      = require('morgan');
const knexLogger  = require('knex-logger');

// Seperated Routes for each Resource
const usersRoutes = require("./routes/users");

// Load the logger first so all (static) HTTP requests are logged to STDOUT
// 'dev' = Concise output colored by response status for development use.
//         The :status token will be colored red for server error codes, yellow for client error codes, cyan for redirection codes, and uncolored for all other codes.
app.use(morgan('dev'));

// Log knex SQL queries to STDOUT as well
app.use(knexLogger(knex));

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/styles", sass({
  src: __dirname + "/styles",
  dest: __dirname + "/public/styles",
  debug: true,
  outputStyle: 'expanded'
}));
app.use(express.static("public"));
app.use(cookieParser());

// Mount all resource routes
app.use("/api/users", usersRoutes(knex));

/* ROUTES BELOW */

// Get the Todos page.
app.get("/", (req, res) => {
  if(!req.cookies.email){
    res.redirect("/login")
  } else {
    res.render("index");
  }
});

/* Route for when a user posts a new todo.
   Checks to see if string is empty.*/
app.post("/todos", (req, res) => {

  function idFinder(email){
    knex.select("id").from("users").where({email: `${email}`})
      .then((rows) => {
        return rows[0].id;
      }).then((id) => {
        knex('todos').insert(
          {name: req.body.todo,
          is_complete: false,
          user_id: id,
          category: "movie"
        }).asCallback(function(err, rows){
          if(err){
            console.log("error", err)
          } else {
            console.log("post added successfully")
            res.redirect("/");
          }
        });
      })
  }
  idFinder(req.cookies.email)

});

/* Route to update a todo.*/
app.put("/todos/todoId", (req, res) => {
  //SQL query to update entire todo record.
  knex('todos').where(`id = ${req.body.todoId}`)
    .update({
    id: req.body.todoId,
    name: req.body.name,
    is_complete: req.body.isComplete,
    user_id: req.session.email
  });

  res.redirect("/");
});

/* Deletes a todo item from the DB.
   Redirects the user to todos page */
app.delete("/todos/todoId", (req, res) => {
  knex('todos').where(`id: ${req.body.todoId}`).del();

  res.redirect("/");
});

/* GET route for login page. Redirects to URLS
   if the user is already logged in */
app.get("/login", (req, res) => {

  res.render("login");
})

/* Post route for Login. Lets anyone log in, no checks. */
/* THIS FUNCTION WORKS BUT IT IS VERY BAD PLZ REFACTOR */
app.post("/login", (req, res) => {
  let userEmail = req.body.email;

  function emailChecker (email){
    knex.select("email").from("users").where({email: `${email}`})
    .asCallback(function(err, rows){
      if(err){
        console.log("error", err);
        console.log("user not recognized");
        res.redirect("/register");
      } else if (!rows[0]) {
        console.log("user not recognized");
        res.redirect('/register');
      } else  {
        console.log("user recognized");
        res.cookie("email", userEmail);
        res.redirect('/');
      }
    })
  }
  emailChecker(userEmail);
})

/* Route that gets the register page 
   If user has a cookie, redirects to todos*/
app.get("/register", (req, res) => {
  // if (req.session.user_id){
  //   res.redirect("/")
  // }
  res.render("register")
})

/* Post route for when someone registers. 
   Front end will handle errors. If the 
   request makes it to here, add to DB. */
app.post("/register", (req, res) => {
  knex('users').insert(
    {email: req.body.email,
    password: req.body.password,
  }).asCallback(function(err, rows){
    if(err){
      console.log("error", err);
    } else {
      console.log("nice");
      res.redirect('/login');
    }
  })
})

app.get("/users", (req, res) => {
  if(!req.session.user_id){
    res.redirect("/login")
  }
  res.render("users")
})

app.put("/users", (req, res) => {

  knex('todos').where(`id = ${req.body.todoId}`)
    .update({
    password: req.body.password,
    avatar: req.body.isComplete,
    favourite_food: req.session.userId,
    description: req.body.description
  })

  res.redirect("/");
})

app.post("/logout", (req, res) => {
  res.clearCookie("email")
  res.redirect("/");
})

app.listen(PORT, () => {
  console.log("Example app listening on port " + PORT);
});
