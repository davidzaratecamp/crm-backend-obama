const express = require("express");
const routes = express.Router();
const generalController = require("../controllers/general.Controller");


routes.get("/contadorventas/:tabla/:campo/:value1/:value2", generalController.contadorventas);

module.exports = routes;