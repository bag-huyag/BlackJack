import { IGame, IPlayer, IPlayerCards } from "../../types";
import Card from "../Card";

interface PlayAreaProps {
  game: IGame;
  mainPlayer: IPlayer | undefined;
}

const PlayArea = ({game, mainPlayer}: PlayAreaProps) => {


  function findWinner() {
    if (game.players.length === 1){
      if (getTotalScore(game.players[0].cards) === 21) {
        return game.players[0];
      }
      return null;
    }

    // iterate each player and find the blackjack winner
    for (const player of game.players) {
      if (getTotalScore(player.cards) === 21) {
        return player;
      }
    }

    let nonBustedPlayers = game.players.filter((player) => !isBusted(player.cards));
    let nonStayedPlayers = nonBustedPlayers.filter((player) => !player.stay);

    if (nonBustedPlayers.length === 0) return null;

    // if there is only one player who is not busted in a game of multiple players, then they are the winner
    if (nonBustedPlayers.length === 1 && game.players.length > 1) {
     return nonBustedPlayers[0];
    }
    // if all players have STAYED, then the Non-Busted player with the highest score wins
    if (nonStayedPlayers.length === 0) {
      return nonBustedPlayers.reduce((prev, current) =>
        getTotalScore(prev.cards) > getTotalScore(current.cards) ? prev : current
      );
    }
    return null;
  }

  const renderingStrategy = [
    // 'bottom', Bottom is always the main player
    "right",
    "top",
    "left",
  ];

  // // Function to render cards
  const renderCards = () => {
    let area = [];
    var i = 0;
    var j = 0;

    const winner = findWinner();

    while (i < game.players.length && i < 4) {
      const player = game.players[i];
      const score = getTotalScore(player.cards);

      if (player.id === mainPlayer?.id) {
        area.push(
          <>
            <div className="bottom player-info">
              <span className="info">
                {player.username} {" | "} 
                {game.currentPlayer && game.currentPlayer.playerId === player.id ? "Current | " : ""}
                {player.stay ? "Stayed | " : ""}
                {winner && winner.id === player.id ? "Winner | " : ""}
                {isBusted(player.cards) ? "Busted | " : ""}
                {score}
              </span>

              <div className="cards-container">
                {player.cards.map((card) => (
                  <Card
                    key={card.playerId}
                    value={card.value}
                    suit={card.suite}
                    hidden={false}
                  />
                ))}
              </div>
            </div>
          </>
        );
        i++;
        continue;
      }

      const strategy = renderingStrategy[j];
      area.push(
        <>
          <div className={`${strategy} player-info`}>
            <span className="info">
              {game.currentPlayer && game.currentPlayer.playerId === player.id ? "Current | " : ""}
              {player.stay ? "Stayed | " : ""}
              {winner && winner.id === player.id ? "Winner | " : ""}
              {isBusted(player.cards) ? "Busted | " : ""}
              {score}
            </span>

            <div className="cards-container">
              {player.cards.map((card) => (
                <Card
                  key={card.playerId}
                  value={card.value}
                  suit={card.suite}
                  hidden={false}
                />
              ))}
            </div>
          </div>
        </>
      );
      i++;
      j++;
    }

    return area;
  };

  return <div className="square-table">{renderCards()}</div>
}

function getCardValue(value: string) {
  switch (value) {
    case "J":
    case "Q":
    case "K":
      return 10;
    case "A":
      return 11;
    default:
      return parseInt(value);
  }
}

function getTotalScore(cards: IPlayerCards[]) {
  let total = 0;
  let aces = cards.filter((card) => card.value === "A");
  let withoutAces = cards.filter((card) => card.value !== "A");

  for (const card of withoutAces) {
    total += getCardValue(card.value);
  }

  for (const _ of aces) {
    if ((total + 11) > 21) {
      total += 1;
    } else {
      total += 11;
    }
  }
  
  return total;
}

function isBusted(cards: IPlayerCards[]) {
  return getTotalScore(cards) > 21;
}

export default PlayArea
