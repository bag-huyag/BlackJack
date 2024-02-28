const axios = require("axios");
const config = require("../config");

async function getPlayer(req, res, next) {
  const { userId, gameCode } = req.query;
  if (!userId || !gameCode) {
    return res.status(400).send({
      message: "userId & gameCode required in the query!",
    });
  }

  var response = await axios.get(`http://sql.lavro.ru/call.php`, {
    params: {
      db: config.dbName,
      pname: "getGameByGameCode",
      p1: gameCode,
    },
    timeout: 30000,
  });

  if (
    !response.data.RESULTS[0].id ||
    response.data.RESULTS[0].id.length === 0
  ) {
    return res.status(404).send({
      message: "Game not found",
    });
  }

  const gameId = response.data.RESULTS[0].id[0];
  response = await axios.get(`http://sql.lavro.ru/call.php`, {
    params: {
      db: config.dbName,
      pname: "getPlayerByUserIdAndGameId",
      p1: userId,
      p2: gameId,
    },
    timeout: 30000,
  });

  if (
    !response.data.RESULTS[0].id ||
    !response.data.RESULTS[0].id.length === 0
  ) {
    return res.status(404).send({
      message: "Player not found",
    });
  }

  const player = {
    id: response.data.RESULTS[0].id[0],
    bet: response.data.RESULTS[0].balance[0],
    gameId: response.data.RESULTS[0].gameId[0],
    userId: response.data.RESULTS[0].userId[0],
    name: response.data.RESULTS[0].name[0],
    ready: response.data.RESULTS[0].ready[0],
    state: response.data.RESULTS[0].state[0],
    outcome: response.data.RESULTS[0].outcome[0],
    score: response.data.RESULTS[0].score[0],
    stay: response.data.RESULTS[0].stay[0],
    hands: [],
  };

  const playerId = response.data.RESULTS[0].id[0];
  response = await axios.get(`http://sql.lavro.ru/call.php`, {
    params: {
      db: config.dbName,
      pname: "getCardsByPlayerId",
      p1: playerId,
    },
    timeout: 30000,
  });

  if (response.data.RESULTS[0].id && response.data.RESULTS[0].id.length > 0) {
    for (let i = 0; i < response.data.RESULTS[0].id.length; i++) {
      player.hands.push({
        id: response.data.RESULTS[0].id[i],
        cardId: response.data.RESULTS[0].cardId[i],
        playerId: response.data.RESULTS[0].playerId[i],
        gameCode: response.data.RESULTS[0].gameCode[i],
      });
    }
  }

  return res.send({
    ...player,
  });
}

async function getPlayerCards(req, res, next) {
  const { playerId, gameCode } = req.query;
  if (!playerId || !gameCode) {
    return res.status(400).send({
      message: "playerId and gameCode required in the query!",
    });
  }

  response = await axios.get(`http://sql.lavro.ru/call.php`, {
    params: {
      db: config.dbName,
      pname: "getCardsByPlayerIdAndGameCode",
      p1: playerId,
      p2: gameCode,
    },
    timeout: 30000,
  });

  if (response.data.RESULTS[0].id.length === 0) {
    return res.json({
      message: "Player has 0 cards",
      cards: [],
    });
  }

  let cards = [];
  for (let i = 0; i < response.data.RESULTS[0].cardId.length; i++) {
    cards.push({
      id: response.data.RESULTS[0].cardId[i],
      name: response.data.RESULTS[0].card_name[i],
      value: response.data.RESULTS[0].card_value[i],
      suit: response.data.RESULTS[0].card_suit[i],
    });
  }

  return res.send({
    message: "Successfully retrieved player hands",
    cards: cards,
  });
}

async function deletePlayer(req, res, next) {
  const { playerId, gameCode } = req.query;
  if (!playerId || !gameCode) {
    return res.status(400).send({
      message: "playerId and gameCode required in the query!",
    });
  }

  var response = await axios.get(`http://sql.lavro.ru/call.php`, {
    params: {
      db: config.dbName,
      pname: "deletePlayer",
      p1: playerId,
      p2: gameCode,
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

async function updatePlayerState(req, res, next) {
  let { playerId, gameCode, ready } = req.body || req.query;
  if (!playerId || !gameCode || ready === undefined || ready === null) {
    return res.status(400).send({
      message: "playerId, gameCode and ready required in the body or query!",
    });
  }

  var response = await axios.get(`http://sql.lavro.ru/call.php`, {
    params: {
      db: config.dbName,
      pname: "updatePlayerReadyState",
      p1: playerId,
      p2: gameCode,
      p3: ready,
    },
    timeout: 30000,
  });

  if (response.data.ERROR) {
    return res.status(404).send({
      message: response.data.ERROR,
    });
  }

  res.send({
    message: "Player state updated successfully",
  });
}

async function updatePlayerStay(req, res, next) {
  let { playerId, gameCode, stay } = req.body || req.query;
  if (!playerId || !gameCode || stay === undefined || stay === null) {
    return res.status(400).send({
      message: "playerId, gameCode and stay required in the body or query!",
    });
  }

  var response = await axios.get(`http://sql.lavro.ru/call.php`, {
    params: {
      db: config.dbName,
      pname: "updatePlayerStayState",
      p1: playerId,
      p2: gameCode,
      p3: stay,
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

async function updatePlayerScore(req, res, next) {
  let { playerId, score } = req.body || req.query;
  if (!playerId || score === undefined) {
    return res.status(400).send({
      message: "playerId and score required in the body or query!",
    });
  }

  var response = await axios.get(`http://sql.lavro.ru/call.php`, {
    params: {
      db: config.dbName,
      pname: "updatePlayerScore",
      p1: playerId,
      p2: score,
    },
    timeout: 30000,
  });

  if (response.data.ERROR) {
    return res.status(404).send({
      message: response.data.ERROR,
    });
  }

  res.send({
    message: "Player score updated successfully",
  });
}

module.exports.getPlayer = getPlayer;
module.exports.getPlayerCards = getPlayerCards;
module.exports.deletePlayer = deletePlayer;
module.exports.updatePlayerState = updatePlayerState;
module.exports.updatePlayerStay = updatePlayerStay;
