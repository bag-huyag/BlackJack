const express = require('express');
const { 
    deletePlayer,
    updatePlayerStay,
} = require("../controllers/players");
const verifyToken = require('../middlewares/token');

const router =  express.Router();

router.delete('/', verifyToken, deletePlayer);
router.put('/stay', verifyToken, updatePlayerStay)

module.exports = router;
