const axios = require("axios");
const config = require("../config");

async function getCards(req, res, next) {
  var response = await axios.get(`http://sql.lavro.ru/call.php`, {
    params: {
      db: config.dbName,
      pname: "getCards",
    },
    timeout: 30000,
  });

  const ids = response.data.RESULTS[0].id;
  const names = response.data.RESULTS[0].name;
  const values = response.data.RESULTS[0].value;
  const suits = response.data.RESULTS[0].suit;

  // map the response to the format we want
  const cards = [];

  for (let i = 0; i < ids.length; i++) {
    const card = {
      id: ids[i],
      name: names[i],
      value: values[i],
      suit: suits[i],
    };
    cards.push(card);
  }

  return res.send(cards);
}

module.exports.getCards = getCards;
