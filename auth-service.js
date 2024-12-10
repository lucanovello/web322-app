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
      reject(err); // reject the promise with the provided error
    });
    db.once("open", () => {
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
          let newUser = new User(userData);
          newUser
            .save()
            .then(() => {
              resolve();
            })
            .catch((err) => {
              if (err.code === 11000) {
                reject("User Name already taken");
              } else {
                reject("There was an error creating the user: " + err);
              }
            });
        })
        .catch((err) => {
          reject("There was an error encrypting the password: " + err);
        });
    }
  });
};

module.exports.checkUser = function (userData) {
  return new Promise((resolve, reject) => {
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

// module.exports.registerUser = function (userData) {
//   return new Promise((resolve, reject) => {
//     if (userData.password !== userData.password2) {
//       reject("Passwords do not match");
//     } else {
//       let newUser = new User(userData);
//       newUser.save((err) => {
//         if (err) {
//           if (err.code === 11000) {
//             reject("User Name already taken");
//           } else {
//             reject("There was an error creating the user: " + err);
//           }
//         } else {
//           resolve();
//         }
//       });
//     }
//   });
// };

// module.exports.checkUser = function (userData) {
//   return new Promise((resolve, reject) => {
//     User.find({ userName: userData.userName })
//       .exec()
//       .then((users) => {
//         if (users.length == 0) {
//           reject("Unable to find user: " + userData.userName);
//         } else {
//           if (users[0].password !== userData.password) {
//             reject("Incorrect password for user: " + userData.userName);
//           } else {
//             users[0].loginHistory.push({
//               dateTime: new Date().toString(),
//               userAgent: userData.userAgent,
//             });
//             User.update(
//               { userName: users[0].userName },
//               { $set: { loginHistory: users[0].loginHistory } }
//             )
//               .exec()
//               .then(() => {
//                 resolve(users[0]);
//               })
//               .catch((err) => {
//                 reject("There was an error verifying the user: " + err);
//               });
//           }
//         }
//       })
//       .catch((err) => {
//         reject("Unable to find user: " + userData.userName);
//       });
//   });
// };
