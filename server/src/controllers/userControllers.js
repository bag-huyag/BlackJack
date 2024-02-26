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
    timeout: 30000,
  });

  if (response.data.RESULTS[0].error) {
    return res.status(401).send({
      message: "Invalid email or password",
    });
  }

  if (response.data.RESULTS[0].id) {
    return res.send({
      message: "Successfully logged in",
      token: response.data.RESULTS[0].sessionToken[0],
    });
  }
}

async function signup(req, res) {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).send({
      message: "Email, password, and name required",
    });
  }

  var response = await axios.get(`http://sql.lavro.ru/call.php`, {
    params: {
      db: config.dbName,
      pname: "signup",
      p1: email,
      p2: password,
      p3: name,
    },
    timeout: 30000,
  });

  if (response.data.RESULTS[0].error) {
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

  const id = response.data.RESULTS[0].id[0];
  const sessionToken = jwt.sign(
    {
      userId: id,
      username: name,
      email: email,
    },
    process.env.JWT_SECRET
  );

  try {
    response = await axios.get(`http://sql.lavro.ru/call.php`, {
      params: {
        db: config.dbName,
        pname: "updateToken",
        p1: id,
        p2: sessionToken,
      },
      timeout: 30000,
    });

    if (
      !response.data.RESULTS[0].id ||
      !response.data.RESULTS[0].id.length === 0
    ) {
      return res.status(500).send({
        message: "Error updating token",
      });
    }

    return res.status(201).send({
      message: "Successfully signed up",
      token: sessionToken,
    });
  } catch {
    return res.status(500).send({
      message: "Error updating token",
    });
  }
}

module.exports.login = login;
module.exports.signup = signup;
