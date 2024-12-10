const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
let Schema = mongoose.Schema;

let userSchema = new Schema({
  userName: {
    type: String,
    unique: true,
  },
  password: String,
  email: String,
  loginHistory: [{ dateTime: Date, userAgent: String }],
});

let User; // to be defined on new connection (see initialize)

module.exports.initialize = function () {
  return new Promise(function (resolve, reject) {
    let db = mongoose.createConnection(process.env.MONGO_DB_CONN_STRING);
    db.on("error", (err) => {
      console.error("Database connection error:", err);
      reject(err); // reject the promise with the provided error
    });
    db.once("open", () => {
      console.log("Database connection successful!");
      User = db.model("users", userSchema);
      resolve();
    });
  });
};

module.exports.registerUser = function (userData) {
  return new Promise((resolve, reject) => {
    if (userData.password !== userData.password2) {
      reject("Passwords do not match");
    } else {
      bcrypt
        .hash(userData.password, 10)
        .then((hash) => {
          userData.password = hash;
          try {
            let newUser = new User(userData); // This is where the error likely occurs
            newUser
              .save()
              .then(() => resolve())
              .catch((err) => reject(err));
          } catch (err) {
            console.error("Error creating User model:", err);
            reject(err);
          }
        })
        .catch((err) => {
          reject("There was an error encrypting the password: " + err);
        });
    }
  });
};

module.exports.checkUser = function (userData) {
  return new Promise((resolve, reject) => {
    if (!User) {
      console.error(userData);
      reject("User model is not initialized.");
      return;
    }
    User.find({ userName: userData.userName })
      .exec()
      .then((users) => {
        if (users.length == 0) {
          reject("Unable to find user: " + userData.userName);
        } else {
          bcrypt
            .compare(userData.password, users[0].password)
            .then((result) => {
              if (result === false) {
                reject("Incorrect password for user: " + userData.userName);
              } else {
                users[0].loginHistory.push({
                  dateTime: new Date().toString(),
                  userAgent: userData.userAgent,
                });
                User.updateOne(
                  { userName: users[0].userName },
                  { $set: { loginHistory: users[0].loginHistory } }
                )
                  .exec()
                  .then(() => {
                    resolve(users[0]);
                  })
                  .catch((err) => {
                    reject("There was an error verifying the user: " + err);
                  });
              }
            })
            .catch((err) => {
              reject("There was an error comparing the passwords: " + err);
            });
        }
      })
      .catch((err) => {
        reject("There was an error finding the user: " + err);
      });
  });
};
