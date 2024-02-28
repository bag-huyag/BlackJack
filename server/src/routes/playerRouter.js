const express = require('express');
const { 
    getPlayer, 
    getPlayerCards, 
    deletePlayer,
    updatePlayerState,
    updatePlayerStay,
    updatePlayerScore
} = require("../controllers/playerControllers");
const verifyToken = require('../middlewares/tokenMiddleware');

const router =  express.Router();

router.get('/', verifyToken, getPlayer);
router.get('/cards', verifyToken, getPlayerCards);
router.delete('/', verifyToken, deletePlayer);
router.put('/ready', verifyToken, updatePlayerState)
router.put('/stay', verifyToken, updatePlayerStay)

module.exports = router;
