const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const VALUES = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];
const SUITES = ["♠", "♥", "♦", "♣"];

function genRandomString(length) {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return result;
}

function deckGenerator() {
  let deck = [];
  for (let i = 0; i < VALUES.length; i++) {
    for (let j = 0; j < SUITES.length; j++) {
      deck.push({
        value: VALUES[i],
        suit: SUITES[j],
      });
    }
  }
  return deck;
}

function generateRandomCard(deck) {
  return {
    value: VALUES[Math.floor(Math.random() * VALUES.length)],
    suit: SUITES[Math.floor(Math.random() * SUITES.length)],
  }
}

module.exports.genRandomString = genRandomString;
module.exports.deckGenerator = deckGenerator;
module.exports.generateRandomCard = generateRandomCard;
