"use strict";

const bcrypt = require("bcrypt")
const { BCRYPT_WORK_FACTOR } = require("../config");
const db = require("../db");

/** User of the site. */

class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */
  static async register({ username, password, first_name, last_name, phone }) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR)
    const results = await db.query(
      `INSERT INTO users (username, password,
                          first_name, last_name,
                          phone)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING username, password, first_name, last_name, phone`, 
        [username, hashedPassword, first_name, last_name, phone]);

    return results.rows[0];
  }

  /** Authenticate: is username/password valid? Returns boolean. */
  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT password
          FROM users
          WHERE username = $1`,
          [username]);
      const user = result.rows[0]
    return user && await bcrypt.compare(password, user.password) === true
  }

  /** Update last_login_at for user */
  static async updateLoginTimestamp(username) {
    await db.query(
      `UPDATE users
       SET last_login_at = current_timestamp
       WHERE username = $1`
      , [username]);

    const user = result.rows[0];
    if (!user) throw new NotFoundError(`No such user: ${username}`);

    return user;
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */
  static async all() {
    const result = db.query(
      `SELECT username, first_name, last_name
       FROM users`
    );
    const users = result.rows;
    return result.json({ users })
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const result = await db.query(
      `SELECT username, first_name, last_name, phone,
              join_at, last_login_at
      FROM users
      WHERE username = $1`, [username]);
    const user = result.rows[0];
    return result.json({ user })
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */
  static async messagesFrom(username) {
    const result = await db.query(
      `SELECT m.id, 
              m.to_user,
              t.first_name,
              t.last_name,
              t.phone,
              m.body, 
              m.sent_at, 
              m.read_at
       FROM messages AS m
                    JOIN users as f ON m.from_username = $1
                    JOIN users as t ON m.to_username = t.username`
                    , 
                    [username]);
      
      return result.rows;
    }


  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */
  static async messagesTo(username) {
  }
}


module.exports = User;
