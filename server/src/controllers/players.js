const axios = require("axios");
const config = require("../config");

async function deletePlayer(req, res, next) {
  const { gameCode } = req.query;
  if (!gameCode) {
    return res.status(400).send({
      message: "gameCode and balance required in the query!",
    });
  }

  var response = await axios.get(`http://sql.lavro.ru/call.php`, {
    params: {
      db: config.dbName,
      pname: "deletePlayer",
      p1: req.token,
      p2: gameCode
    },
    timeout: 30000,
  });

  if (response.data.ERROR) {
    return res.status(404).send({
      message: response.data.ERROR,
    });
  }

  res.send({
    message: "Player deleted successfully",
  });
}

async function updatePlayerStay(req, res, next) {
  let { gameCode, stay } = req.body || req.query;
  if (!gameCode || stay === undefined || stay === null) {
    return res.status(400).send({
      message: "gameCode and stay required in the body or query!",
    });
  }
  stay = stay === true ? 1 : 0; // sql booleans are 1 or 0, so typecast to 1 or 0

  var response = await axios.get(`http://sql.lavro.ru/call.php`, {
    params: {
      db: config.dbName,
      pname: "updatePlayerStayState",
      p1: req.token,
      p2: gameCode,
      p3: stay
    },
    timeout: 30000,
  });

  if (response.data.ERROR) {
    return res.status(404).send({
      message: response.data.ERROR,
    });
  }

  res.send({
    message: "Player stay updated successfully",
  });
}

module.exports.deletePlayer = deletePlayer;
module.exports.updatePlayerStay = updatePlayerStay;
