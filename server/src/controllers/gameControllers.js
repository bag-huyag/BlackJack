const jwt = require("jsonwebtoken");
const axios = require("axios");
const config = require("../config");
const { genRandomString } = require("../utils/generators");

async function getGames(req, res, next) {
  const token = req.token; // from the middleware
  const data = jwt.decode(token, { json: true });
  const userId = data?.userId;

  // const games = db.prepare("SELECT * FROM games").all();

  var response = await axios.get(`http://sql.lavro.ru/call.php`, {
    params: {
      db: config.dbName,
      pname: "getAllGames",
    },
    timeout: 30000,
  });

  var games = [];

  for (var i = 0; i < response.data.RESULTS[0].id.length; i++) {
    games.push({
      id: response.data.RESULTS[0].id[i],
      code: response.data.RESULTS[0].code[i],
      bet: response.data.RESULTS[0].bet[i],
      turnTime: response.data.RESULTS[0].turnTime[i],
      creatorId: response.data.RESULTS[0].creatorId[i],
      playersCount: response.data.RESULTS[0].playersCount[i],
      state: response.data.RESULTS[0].state[i],
      previousTurns: response.data.RESULTS[0].previousTurns[i],
      currentTurnId: response.data.RESULTS[0].currentTurnId[i],
      winnerId: response.data.RESULTS[0].winnerId[i],
    });
  }

  return res.send(games);

  // Since we are not using the user's id to get their games, we can comment out the following code, FOR NOW
  // if (!data || !userId) {
  //     return res.status(401).send({
  //         message: 'Invalid token!'
  //     });
  // }

  // // these steps make sure the user is valid and only gets their own games

  // const getUserStmt = db.prepare('SELECT * FROM users WHERE id = ?');
  // const user = getUserStmt.get(userId);

  // if (!user) {
  //     return res.status(401).send({
  //         message: 'Invalid token!'
  //     });
  // }

  // const getPlayersStmt = db.prepare('SELECT * FROM players WHERE userId = ?');
  // const players = getPlayersStmt.all(userId);

  // if (!players || players.length === 0) {
  //     return res.status(401).send({
  //         message: 'User has not joined any games!'
  //     });
  // }

  // let games = [];

  // for (const player of players) {
  //     const getGameStmt = db.prepare('SELECT * FROM games WHERE id = ?');
  //     const game = getGameStmt.get(player.gameId);
  //     games.push(game);
  // }

  // return res.send(games);
}

async function getAGame(req, res, next) {
  const gameCode = req.params.code || req.body.code || req.query.code;
  if (!gameCode) {
    return res.status(400).send({
      message: "gameCode is a required field!",
    });
  }

  let data = {
    game: {
      players: [],
    },
  };

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
      message: "Game not found!",
    });
  }

  data.game = {
    id: response.data.RESULTS[0].id[0],
    code: response.data.RESULTS[0].code[0],
    bet: response.data.RESULTS[0].bet[0],
    turnTime: response.data.RESULTS[0].turnTime[0],
    creatorId: response.data.RESULTS[0].creatorId[0],
    playersCount: response.data.RESULTS[0].playersCount[0],
    state: response.data.RESULTS[0].state[0],
    previousTurns: response.data.RESULTS[0].previousTurns[0],
    currentTurnId: response.data.RESULTS[0].currentTurnId[0],
    winnerId: response.data.RESULTS[0].winnerId[0],
    players: [],
  };

  response = await axios.get(`http://sql.lavro.ru/call.php`, {
    params: {
      db: config.dbName,
      pname: "getPlayerByGameId",
      p1: data.game.id,
    },
    timeout: 30000,
  });

  if (
    !response.data.RESULTS[0].id ||
    response.data.RESULTS[0].id.length === 0
  ) {
    return res.status(404).send({
      message: "No players in the game!",
    });
  }

  var players = [];

  for (var i = 0; i < response.data.RESULTS[0].id.length; i++) {
    players.push({
      id: response.data.RESULTS[0].id[i],
      bet: response.data.RESULTS[0].balance[i],
      gameId: response.data.RESULTS[0].gameId[i],
      userId: response.data.RESULTS[0].userId[i],
      name: response.data.RESULTS[0].name[i],
      ready: response.data.RESULTS[0].ready[i],
      state: response.data.RESULTS[0].state[i],
      outcome: response.data.RESULTS[0].outcome[i],
      score: response.data.RESULTS[0].score[i],
      stay: response.data.RESULTS[0].stay[i],
      cards: []
    });
  }

  for (var player of players) {
    response = await axios.get(`http://sql.lavro.ru/call.php`, {
      params: {
        db: config.dbName,
        pname: "getCardsByPlayerIdAndGameCode",
        p1: player.id,
        p2: gameCode,
      },
      timeout: 30000,
    });

    var cards = [];

    for (let i = 0; i < response.data.RESULTS[0].cardId.length; i++) {
      cards.push({
        id: response.data.RESULTS[0].cardId[i],
        name: response.data.RESULTS[0].card_name[i],
        value: response.data.RESULTS[0].card_value[i],
        suit: response.data.RESULTS[0].card_suit[i],
      });
    }

    player.cards = cards;
    data.game.players.push(player);
  }

  // get the player who is has the id of creatorId of the game
  const creator = data.game.players.find(
    (player) => player.id === data.game.creatorId
  );
  if (creator) {
    // make the creator come first in the array
    data.game.players = data.game.players.filter(
      (player) => player.id !== data.game.creatorId
    );
    data.game.players.unshift(creator);
  }

  function findWinner() {
    let nonBustedPlayers = data.game.players.filter(
      (player) => player.outcome !== "BUSTED"
    );
    const nonStayedPlayers = data.game.players.filter(
      (player) => player.stay === 0
    );

    // if there is only one player who is not busted, then they are the winner
    if (nonBustedPlayers.length === 1 && data.game.players.length > 1) {
      return nonBustedPlayers[0];
    }

    // if all players have STAYED, then the Non-Busted player with the highest score wins
    if (nonStayedPlayers.length === 0) {
      return nonBustedPlayers.reduce((prev, current) =>
        prev.score > current.score ? prev : current
      );
    }
    return null;
  }

  const winner = findWinner();
  // We only update the game winner if there is a winner and the winner is not the current winner
  if (winner && data.game.winnerId !== winner.id) {
    response = await axios.get(`http://sql.lavro.ru/call.php`, {
      params: {
        db: config.dbName,
        pname: "updateGameWinner",
        p1: gameCode,
        p2: winner.id,
      },
      timeout: 30000,
    });

    data.game.winnerId = winner.id;

    data.game.players = data.game.players.map((player) => {
      if (player.id === winner.id) {
        return winner;
      }
      return player;
    });
  }

  return res.send(data);
}

async function createGame(req, res, next) {
  const { turnTime, bet } = req.body;
  if (!turnTime || !bet) {
    return res.status(400).send({
      message: "turnTime and bet are required!",
    });
  }

  const token = req.token; // from the middleware
  const data = jwt.decode(token, { json: true });
  const userId = data?.userId;

  const gameCode = genRandomString(config.gameCodeLength);

  var response = await axios.get(`http://sql.lavro.ru/call.php`, {
    params: {
      db: config.dbName,
      pname: "createGame",
      p1: gameCode,
      p2: userId,
      p3: turnTime,
      p4: bet,
    },
    timeout: 30000,
  });

  if (response.data.ERROR) {
    return res.status(404).send({
      message: response.data.ERROR,
    });
  }

  // only player is creater but not linked with game
  if (response.data.RESULTS.length === 1) {
    return res.status(500).send({
      message: "Error creating game!",
    });
  }

  // In any edge cases
  if (
    !response.data.RESULTS[1]["v_gameId"] ||
    response.data.RESULTS[1]["v_gameId"].length === 0 ||
    !response.data.RESULTS[1]["v_playerId"] ||
    response.data.RESULTS[1]["v_gameId"].length === 0
  ) {
    return res.status(500).send({
      message: "Error creating game!",
    });
  }

  return res.send({
    message: "Game created!",
    code: gameCode,
    playerId: response.data.RESULTS[1]["v_gameId"][0] || 1,
    gameId: response.data.RESULTS[1]["v_playerId"][0] || 1,
  });
}

async function joinGame(req, res, next) {
  const { gameCode, userId } = req.body;
  if (!gameCode || !userId) {
    return res.status(400).send({
      message: "gameCode and userId are required!",
    });
  }

  var response = await axios.get(`http://sql.lavro.ru/call.php`, {
    params: {
      db: config.dbName,
      pname: "joinGame",
      p1: gameCode,
      p2: userId,
    },
    timeout: 30000,
  });

  if (response.data.ERROR) {
    return res.status(404).send({
      message: response.data.ERROR,
    });
  }

  if (response.data.RESULTS) {
    return res.send({
      message: "Game joined successfully",
    });
  } else {
    return res.status(500).send({
      message: "Error joining game!",
    });
  }
}

async function createGamePlayerCard(req, res, next) {
  const { playerId, cardId, gameCode } = req.body;
  if (!playerId || !cardId || !gameCode) {
    return res.status(400).send({
      message: "playerId, cardId and gameCode are required fields!",
    });
  }

  var response = await axios.get("http://sql.lavro.ru/call.php", {
    params: {
      db: config.dbName,
      pname: "createGamePlayerCard",
      p1: cardId,
      p2: playerId,
      p3: gameCode,
    },
    timeout: 30000,
  });

  if (response.data.ERROR) {
    return res.status(404).send({
      message: response.data.ERROR,
    });
  }

  if (response.data.RESULTS) {
    return res.send({
      message: "Card created successfully",
    });
  } else {
    return res.status(500).send({
      message: "Error creating cards!",
    });
  }
}

async function changePlayerTurn(req, res, next) {
  const { gameCode, currentPlayerId } = req.body;
  if (!gameCode || currentPlayerId === undefined || currentPlayerId === null) {
    return res.status(400).send({
      message: "currentPlayerId, nextPlayers and gameCode are required fields!",
    });
  }

  var response = await axios.get("http://sql.lavro.ru/call.php", {
    params: {
      db: config.dbName,
      pname: "getGameAndCheckPlayers",
      p1: gameCode,
      p2: currentPlayerId,
    },
    timeout: 30000,
  });

  if (response.data.ERROR) {
    return res.status(404).send({
      message: response.data.ERROR,
    });
  }

  if (
    !response.data.RESULTS[0].game_id ||
    response.data.RESULTS[0].game_id.length === 0
  ) {
    return res.status(404).send({
      message: "Game or its players found!",
    });
  }

  var game = {
    id: response.data.RESULTS[0].game_id[0],
    code: response.data.RESULTS[0].game_code[0],
    bet: response.data.RESULTS[0].game_bet[0],
    turnTime: response.data.RESULTS[0].game_turnTime[0],
    creatorId: response.data.RESULTS[0].game_creatorId[0],
    playersCount: response.data.RESULTS[0].game_playersCount[0],
    state: response.data.RESULTS[0].game_state[0],
    previousTurns: response.data.RESULTS[0].game_previousTurns[0],
    currentTurnId: response.data.RESULTS[0].game_currentTurnId[0],
    winnerId: response.data.RESULTS[0].game_winnerId[0],
    players: []
  };

  for (let i = 0; i < response.data.RESULTS[0].player_id.length; i++) {
    game.players.push({
      id: response.data.RESULTS[0].player_id[i],
      bet: response.data.RESULTS[0].player_bet[i],
      gameId: response.data.RESULTS[0].player_gameId[i],
      userId: response.data.RESULTS[0].player_userId[i],
      name: response.data.RESULTS[0].player_name[i],
      ready: response.data.RESULTS[0].player_ready[i],
      state: response.data.RESULTS[0].player_state[i],
      outcome: response.data.RESULTS[0].player_outcome[i],
      score: response.data.RESULTS[0].player_score[i],
      stay: response.data.RESULTS[0].player_stay[i],
    });
  }

  // Thank you professor, for thsi *awesome* website, that wasted my 2 hours solving 
  // this bug that occurred because your beautiful sql website conveniently converted the 
  // string of previous turns into a number / array of numbers, and then returned it
  // I had to convert it back to a string, and then split it, and then join it, and then
  // convert it back to a string, and then update it in the database. Thank you so much.

  if (game.previousTurns === null || game.previousTurns === undefined) {
    game.previousTurns = "";
  }

  if (typeof game.previousTurns === "number") {
    game.previousTurns = game.previousTurns.toString();
  }

  if (Array.isArray(game.previousTurns)) {
    game.previousTurns = game.previousTurns.join(",");
  }

  var previousTurns = game.previousTurns
    .split(",")
    .filter((turn) => turn !== "")
    .map((turn) => turn.toString());
  
  const ineligiblePlayers = game.players.filter(
    (player) => player.outcome === "BUSTED" || player.stay === 1
  ).length;
  if (previousTurns.length >= game.playersCount - 1 - ineligiblePlayers){
    previousTurns = [];
  } else {
    previousTurns.push(currentPlayerId);
  }

  previousTurns = previousTurns.join(",");

  for (var i = 0; i < game.players.length; i++) {
    let player = game.players[i];

    if (player.score > 21 || player.score === 21) {
      var outcome = player.score > 21 ? "BUSTED" : "WINNER";
      await axios.get(`http://sql.lavro.ru/call.php`, {
        params: {
          db: config.dbName,
          pname: "updatePlayerOutcome",
          p1: player.id,
          p2: outcome
        },
        timeout: 30000,
      });
    }
    game.players[i].outcome = outcome;
  }

  var nextPlayer = {};
  const nextPlayers = game.players.filter((player) => player.id != currentPlayerId);

  for (var i = 0; i < nextPlayers.length; i++) {
    let player = nextPlayers[i];

    if (player.id === currentPlayerId) {
      continue;
    }
    if (player.outcome === "BUSTED") {
      continue;
    }
    if (player.stay === 1) {
      continue;
    }
    if (
      previousTurns.includes(player.id.toString()) &&
      game.playersCount !== 2
    ) {
      continue;
    }
    nextPlayer = player;
    break;
  }

  var nextPlayerId = (!nextPlayer || nextPlayer === undefined) ? currentPlayerId : nextPlayer.id;

  await axios.get(`http://sql.lavro.ru/call.php`, {
    params: {
      db: config.dbName,
      pname: "setGameTurns",
      p1: gameCode,
      p2: previousTurns,
      p3: nextPlayerId
    },
    timeout: 30000,
  });

  return res.send({
    message: "Player turn skipped!",
  });
}

async function restartGame(req, res, next) {
  const { playerId, gameCode } = req.body;
  if (!playerId || !gameCode) {
    return res.status(400).send({
      message: "playerId and gameCode are required fields!",
    });
  }

  var response = await axios.get(`http://sql.lavro.ru/call.php`, {
    params: {
      db: config.dbName,
      pname: "restartGame",
      p1: gameCode,
      p2: playerId,
    },
    timeout: 30000,
  });

  if (response.data.ERROR) {
    return res.status(404).send({
      message: response.data.ERROR,
    });
  }

  if (response.data.RESULTS) {
    return res.send({
      message: "Game restarted for the player!",
    });
  } else {
    return res.status(500).send({
      message: "Error restarting game!",
    });
  }
}

module.exports.getGames = getGames;
module.exports.getAGame = getAGame;
module.exports.createGame = createGame;
module.exports.createGamePlayerCard = createGamePlayerCard;
module.exports.joinGame = joinGame;
module.exports.changePlayerTurn = changePlayerTurn;
module.exports.restartGame = restartGame;
