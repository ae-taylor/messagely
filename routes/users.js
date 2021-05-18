"use strict";

const Router = require("express").Router;
const router = new Router();
const {ensureLoggedIn, ensureCorrectUser} = require("../middleware/auth")
const User = require("../models/user")


/** GET / - get list of users.
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/
router.get("/", ensureLoggedIn, async function (req, res, next) {
  console.log(`we made it to /users`)
  const users = await User.all();
  console.log(`we made it back to route, users is `, users)
  return res.json(users);
})


/** GET /:username/to - get messages to user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get("/:username/to", ensureCorrectUser, async function (req, res, next) {

  const username = req.params.username;
  const messagesTo = await User.messagesTo(username)
  return res.json(messagesTo);
});


/** GET /:username/from - get messages from user
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
 router.get("/:username/from", ensureCorrectUser, async function (req, res, next) {
  const username = req.params.username;
  const messagesFrom = await User.messagesFrom(username)
  return res.json(messagesFrom);
});


/** GET /:username - get detail of users.
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/
router.get("/:username", ensureCorrectUser, async function (req, res, next) {
  const username = req.params.username;
  const user = await User.get(username);
  return res.json(user);
});

module.exports = router;