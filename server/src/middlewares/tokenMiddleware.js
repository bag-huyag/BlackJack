const axios = require("axios");
const config = require("../config");

async function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(403).send({ message: "No token provided in headers!" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  var response = await axios.get(`http://sql.lavro.ru/call.php`, {
    params: {
      db: config.dbName,
      pname: "getUserByToken",
      p1: token,
    },
    timeout: 30000,
  });

  if (
    !response.data.RESULTS[0].id ||
    !response.data.RESULTS[0].id.length === 0
  ) {
    return res.status(404).send({
      message: "Invalid token!",
    });
  }

  req.token = token;

  next();
}

module.exports = verifyToken;