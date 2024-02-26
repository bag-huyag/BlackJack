const express = require("express");
const { login, signup } = require("../controllers/userControllers");

const router = express.Router();

router.post("/login", login)
router.post("/signup", signup)

router.get("/", (req, res) => {
    res.send({
        message: "Hello World!",
    });
});

module.exports = router;