"use strict";

const Router = require("express").Router;
const router = new Router();
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const SECRET_KEY = require("../config");

/** POST /login: {username, password} => {token} */
router.post("/login", async function (req, res, next) {
    const { username, password } = req.body;
    const isAuthenticated = await User.authenticate(username, password);
    if (isAuthenticated === true) {
        const token = jwt.sign(username, SECRET_KEY.SECRET_KEY);
        User.updateLoginTimestamp(username)
        return res.json({ token });
    } else {
        return res.json({ message: "invalid credentials" })
    }
});


/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */
router.post("/register", async function (req, res, next) {
    const { username,
        password,
        first_name,
        last_name,
        phone } = req.body;
    const user = await User.register(username,
        password,
        first_name,
        last_name,
        phone)
    if (!user) {
        return res.json({ message: "registration failed" })
    }

    const isAuthenticated = await User.authenticate(username, password);
    console.log(`are we authenticated? `, isAuthenticated)
    if (isAuthenticated === true) {
        const token = jwt.sign({ username }, SECRET_KEY.SECRET_KEY);
        return res.json({ token })
    } else {
        return res.json({ message: "invalid credentials" })
    }
});

module.exports = router;