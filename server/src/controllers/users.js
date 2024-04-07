const jwt = require("jsonwebtoken");
const axios = require("axios");
const config = require("../config");

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send({
      message: "Email and password required",
    });
  }
  var response = await axios.get(`http://sql.lavro.ru/call.php`, {
    params: {
      db: config.dbName,
      pname: "login",
      p1: email,
      p2: password,
    },
    timeout: 60000,
  });

  if (response.data.ERROR) {
    return res.status(401).send({
      message: "Invalid email or password",
    });
  }


  if (response.data.RESULTS[0].id) {
    return res.send({
      message: "Successfully logged in",
      token: response.data.RESULTS[0].token[0],
      id: response.data.RESULTS[0].id[0],
      username: response.data.RESULTS[0].username[0],
    });
  }
}

async function signup(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send({
      message: "Email and password required",
    });
  }

  var response = await axios.get(`http://sql.lavro.ru/call.php`, {
    params: {
      db: config.dbName,
      pname: "signup",
      p1: email,
      p2: password,
    },
    timeout: 60000,
  });

  if (response.data.ERROR) {
    return res.status(401).send({
      message: "User already exists",
    });
  }

  if (
    !response.data.RESULTS[0].id ||
    !response.data.RESULTS[0].id.length === 0
  ) {
    return res.status(500).send({
      message: "Error signing up",
    });
  }

  return res.status(201).send({
    message: "Successfully signed up",
    token: response.data.RESULTS[0].token[0],
    id: response.data.RESULTS[0].id[0],
    username: response.data.RESULTS[0].username[0],
  });
}

module.exports.login = login;
module.exports.signup = signup;
