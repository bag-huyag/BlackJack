const express = require('express');
const { getCards } = require("../controllers/cardControllers");

const router =  express.Router();

router.get('/', getCards);

module.exports = router;