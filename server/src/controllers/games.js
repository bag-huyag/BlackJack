const jwt = require("jsonwebtoken");
const axios = require("axios");
const config = require("../config");
const { genRandomString } = require("../utils/generators");

async function getGames(req, res, next) {
  const token = req.token; // from the middleware
  const data = jwt.decode(token, { json: true });
  // const userId = data?.userId;

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
      turnTime: response.data.RESULTS[0].turn_time[i],
      playersLimit: response.data.RESULTS[0].players_limit[i]
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

}

async function getAGame(req, res, next) {
  const gameCode = req.params.code || req.body.code || req.query.code;
  if (!gameCode) {
    return res.status(400).send({
      message: "gameCode is a required field!",
    });
  }

  let game = {
    players: [],
    currentPlayer: null,
    timeRemanining: 0,
  };

  try {
    var response = await axios.get(`http://sql.lavro.ru/call.php`, {
      params: {
        db: config.dbName,
        pname: "getGameData",
        p1: gameCode,
      },
      timeout: 30000,
    });
  } catch {
    return res.status(500).send({
      message: "Error getting game!",
    });
  }


  if (response.data.ERROR) {
    return res.status(404).send({
      message: response.data.ERROR,
    });
  }

  if (
    !response.data.RESULTS[0].id ||
    response.data.RESULTS[0].id.length === 0
  ) {
    return res.status(404).send({
      message: "Game not found!",
    });
  }

  game = {
    id: response.data.RESULTS[0].id[0],
    code: response.data.RESULTS[0].code[0],
    bet: response.data.RESULTS[0].bet[0],
    turnTime: response.data.RESULTS[0].turn_time[0],
    playersLimit: response.data.RESULTS[0].players_limit[0],
    players: [],
  }

  const playerData = response.data.RESULTS[1];
  for (var i = 0; i < playerData.id.length; i++) {
    game.players.push({
      id: playerData.id[i],
      sequenceNumber: playerData.sequence_number[i],
      userId: playerData.user_id[i],
      gameId: playerData.game_id[i],
      stay: playerData.stay[i],
      username: playerData.username[i],
      cards: []
    });
  }

  const cardsData = response.data.RESULTS[2];
  for (var i = 0; i < cardsData.player_id.length; i++) {
    for (let j = 0; j < game.players.length; j++) {
      if (game.players[j].id === cardsData.player_id[i]) {
        if (!game.players[j].cards) {
          game.players[j].cards = [];
        }
        game.players[j].cards.push({
          value: cardsData.value[i],
          suite: cardsData.suit[i],
        });
      }
    }
  }


  const currentPlayerData = response.data.RESULTS[3];
  if (currentPlayerData.current_player_id.length > 0) {
    game.currentPlayer = {
      id: currentPlayerData.current_player_id[0],
      sequenceNumber: currentPlayerData.sequence_number[0],
      startTime: currentPlayerData.start_time[0],
      playerId: currentPlayerData.player_id[0],
      userId: currentPlayerData.user_id[0],
      username: playerData.username[0],
    }
  }

  return res.send(game);
}

async function joinGame(req, res, next) {
  const { gameCode, userId } = req.body || req.params.code || req.query.code;
  if (!gameCode || userId === undefined || userId === null) {
    return res.status(400).send({
      message: "gameCode, userID is a required field!",
    });
  }

  if (!userId) {
    return res.status(401).send({
      message: "Invalid token!",
    });
  }

  var response = await axios.get(`http://sql.lavro.ru/call.php`, {
    params: {
      db: config.dbName,
      pname: "joinGame",
      p1: gameCode,
      p2: req.token,
    },
    timeout: 30000,
  });

  if (response.data.ERROR) {
    return res.status(404).send({
      message: response.data.ERROR,
    });
  }

  console.log(JSON.stringify(response.data));

  if (
    !response.data.RESULTS[0]["v_player_id"] ||
    response.data.RESULTS[0]["v_player_id"].length === 0
  ) {
    return res.status(500).send({
      message: "Error joining game!",
    });
  }

  return res.send({
    message: "Game joined!",
    playerId: response.data.RESULTS[0]["v_player_id"][0] || 1,
  });

}

async function createGame(req, res, next) {
  const { turnTime, bet, playersLimit } = req.body;
  if (!turnTime || !bet || !playersLimit) {
    return res.status(400).send({
      message: "turnTime, bet and playersLimit are required!",
    });
  }

  const gameCode = genRandomString(config.gameCodeLength);

  var response = await axios.get(`http://sql.lavro.ru/call.php`, {
    params: {
      db: config.dbName,
      pname: "createGame",
      p1: gameCode,
      p2: req.token,
      p3: turnTime,
      p4: bet,
      p5: playersLimit,
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
    !response.data.RESULTS[1]["v_game_id"] ||
    response.data.RESULTS[1]["v_game_id"].length === 0 ||
    !response.data.RESULTS[1]["v_player_id"] ||
    response.data.RESULTS[1]["v_player_id"].length === 0
  ) {
    return res.status(500).send({
      message: "Error creating game!",
    });
  }

  return res.send({
    message: "Game created!",
    code: gameCode,
    playerId: response.data.RESULTS[1]["v_game_id"][0] || 1,
    gameId: response.data.RESULTS[1]["v_player_id"][0] || 1,
  });
}

async function addGamePlayerCard(req, res, next) {
  const { gameCode } = req.body;
  if (!gameCode || !req.token ) {
    return res.status(400).send({
      message: "playerId and gameCode are required!",
    });
  }

  var response = await axios.get(`http://sql.lavro.ru/call.php`, {
    params: {
      db: config.dbName,
      pname: "addRandomGamePlayerCard",
      p1: gameCode,
      p2: req.token
    },
    timeout: 30000,
  });

  if (response.data.ERROR) {
    return res.status(404).send({
      message: response.data.ERROR,
    });
  }

  return res.send({
    message: "Card added!",
  });

}

async function changePlayerTurn(req, res, next) {
  const { gameCode} = req.body;
  if (!gameCode) {
    return res.status(400).send({
      message: "gameCode is required!",
    });
  }
  
  var response = await axios.get(`http://sql.lavro.ru/call.php`, {
    params: {
      db: config.dbName,
      pname: "changePlayerTurn",
      p1: gameCode,
      p2: req.token,
    },
    timeout: 30000,
  });

  if (response.data.ERROR) {
    return res.status(404).send({
      message: response.data.ERROR,
    });
  }

  return res.send({
    message: "Player turn changed!",
  });
}

module.exports.getGames = getGames;
module.exports.createGame = createGame;
module.exports.getAGame = getAGame;
module.exports.joinGame = joinGame;
module.exports.addGamePlayerCard = addGamePlayerCard;
module.exports.changePlayerTurn = changePlayerTurn;
