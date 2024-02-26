const express = require('express');
const { 
    getGames, 
    createGame, 
    getAGame, 
    createGamePlayerCard,
    joinGame,
    changePlayerTurn,
    restartGame
} = require("../controllers/gameControllers");
const verifyToken = require('../middlewares/tokenMiddleware');

const router =  express.Router();

router.get('/', verifyToken, getGames);
router.post('/', verifyToken, createGame);
router.post('/playerCards', verifyToken, createGamePlayerCard);
router.put('/changeTurn', verifyToken, changePlayerTurn);
router.post('/restart', verifyToken, restartGame);

// probably the most important route
router.get('/:code', verifyToken, getAGame);
router.post('/:code', verifyToken, joinGame);

module.exports = router;