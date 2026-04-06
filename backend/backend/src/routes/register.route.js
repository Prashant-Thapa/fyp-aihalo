const express = require("express");
const { registerUser } = require("../controller/register.controller");

const router = express.Router();

router.post("/register", registerUser);

module.exports = router;
