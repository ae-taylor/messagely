"use strict";

const bcrypt = require("bcrypt")
const { BCRYPT_WORK_FACTOR } = require("../config");
const db = require("../db");
const { NotFoundError } = require('../expressError');

/** User of the site. */

class User {

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */
  static async register(username, password, first_name, last_name, phone) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const results = await db.query(
      `INSERT INTO users (username, 
                          password,
                          first_name, 
                          last_name,
                          phone, 
                          join_at, 
                          last_login_at)
        VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
        RETURNING username, password, first_name, last_name, phone`,
      [username, hashedPassword, first_name, last_name, phone]);

    const user = results.rows[0]
    return user;
  }

  /** Authenticate: is username/password valid? Returns boolean. */
  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT password
          FROM users
          WHERE username = $1`,
      [username]);

    const hashed = result.rows[0];
    return Boolean(hashed) && await bcrypt.compare(password, hashed.password) === true;
  }

  /** Update last_login_at for user */
  static async updateLoginTimestamp(username) {
    let result = await db.query(
      `UPDATE users
       SET last_login_at = current_timestamp
       WHERE username = $1
       RETURNING username`
      , [username]);

    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No such user: ${username}`);

    return user;
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */
  static async all() {
    console.log(`we made it to User.all()`)
    const result = await db.query(
      `SELECT username, first_name, last_name
       FROM users
       ORDER BY username`
    );

    const users = result.rows;
    console.log(users)
    return users;
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
      `SELECT username, 
              first_name, 
              last_name, 
              phone,
              join_at, 
              last_login_at
      FROM users
      WHERE username = $1`, [username]);
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No such user: ${username}`);

    return user;
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
              m.to_username,
              t.username AS to_username,
              t.first_name AS to_first_name,
              t.last_name AS to_last_name,
              t.phone AS to_phone,
              m.body, 
              m.sent_at, 
              m.read_at
       FROM messages AS m
                    JOIN users as f ON m.from_username = $1
                    JOIN users as t ON m.to_username = t.username
        GROUP BY m.id, t.username`
      ,
      [username]);

    let ms = result.rows;
    return ms.map(m => ({
      id: m.id,
      to_user: {
        username: m.to_username,
        first_name: m.to_first_name,
        last_name: m.to_last_name,
        phone: m.to_phone
      },
      body: m.body,
      sent_at: m.sent_at,
      read_at: m.read_at
    }));
  }


  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */
  static async messagesTo(username) {
    const result = await db.query(
      `SELECT m.id, 
              m.to_username,
              f.username AS from_username,
              f.first_name AS from_first_name,
              f.last_name AS from_last_name,
              f.phone AS from_phone,
              m.body, 
              m.sent_at, 
              m.read_at
       FROM messages AS m
                    JOIN users as t ON m.to_username = $1
                    JOIN users as f ON m.from_username = f.username
       GROUP BY m.id, f.username`
      ,
      [username]);

    let ms = result.rows;
    return ms.map(m => ({
      id: m.id,
      from_user: {
        username: m.from_username,
        first_name: m.from_first_name,
        last_name: m.from_last_name,
        phone: m.from_phone
      },
      body: m.body,
      sent_at: m.sent_at,
      read_at: m.read_at
    }));
  }
}


module.exports = User;
