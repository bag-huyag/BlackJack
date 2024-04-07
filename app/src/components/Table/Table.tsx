import axios from "axios";
import { useEffect, useState } from "react";
import { useBalance } from "../../context/Balance";
import { ICurrentPlayer, IGame, IPlayer, IPlayerCards } from "../../types";
import PlayArea from "../PlayArea";
import "./Table.css";

interface TableProps {
  initialGame: IGame;
  initialPlayer?: IPlayer;
}

const Table = ({ initialGame, initialPlayer }: TableProps) => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "https://sirshak.ddns.net";

  const [mainPlayer, setMainPlayer] = useState<IPlayer | undefined>(
    initialPlayer
  );
  const [currentPlayer, setCurrentPlayer] = useState<ICurrentPlayer>();
  const [game, setGame] = useState<IGame>(initialGame);
  const { balance, setBalance } = useBalance();
  
  const [currentTurn, setCurrentTurn] = useState<boolean>(false);
  const [canAddCard, setCanAddCard] = useState<boolean>(false);
  const [canClickStay, setCanClickStay] = useState<boolean>(false);
  const [canLeaveGame, setCanLeaveGame] = useState<boolean>(false);

  const [isTimerSet, setIsTimerSet] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(0);

  const token = localStorage.getItem("token");
  const userId = parseInt(localStorage.getItem("id")!);

  useEffect(() => {
    // initial balance
    setBalance(game.bet);
    let _istimerSet = isTimerSet;

    async function getGame() {
      try {
        const res = await axios.get<IGame>(
          `${BACKEND_URL}/games/${game.code}?playerId=${mainPlayer?.id}&playerSequenceNumber=${mainPlayer?.sequenceNumber}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "ngrok-skip-browser-warning": "true",
            },
          }
        );

        function findWinner() {
          let nonBustedPlayers = res.data.players.filter(
            (player) => !isBusted(player.cards)
          );
          let nonStayedPlayers = nonBustedPlayers.filter(
            (player) => !player.stay
          );

          if (nonBustedPlayers.length === 0) return null;

          // if there is only one player who is not busted in a game of multiple players, then they are the winner
          if (nonBustedPlayers.length === 1 && game.players.length > 1) {
            return nonBustedPlayers[0];
          }
          // if all players have STAYED, then the Non-Busted player with the highest score wins
          if (nonStayedPlayers.length === 0) {
            return nonBustedPlayers.reduce((prev, current) =>
              getTotalScore(prev.cards) > getTotalScore(current.cards)
                ? prev
                : current
            );
          }
          return null;
        }

        setGame(res.data);

        const winner = findWinner();

        if (res.data.currentPlayer) {
          setCurrentPlayer(res.data.currentPlayer);
        }

        for (const player of res.data.players) {
          if (player.userId === userId) {
            setMainPlayer(player);

            if (!_istimerSet) {
              setIsTimerSet(true);
              _istimerSet = true;
              setTimer(res.data.turnTime);
            }

            // you can add cards if you have the current turn
            if (
              res.data.currentPlayer &&
              res.data.currentPlayer.userId === userId
            ) {
              setCurrentTurn(true);
              setCanAddCard(true);
            } else {
              setCurrentTurn(false);
              setCanAddCard(false);
              setCanClickStay(false);
            }

            // if there is only one player, you cannot do anything
            if (res.data.players.length === 1) {
              setCurrentTurn(false);
              setCanClickStay(false);
            }

            // if you stayed, you cannot add card
            if (player.stay) {
              setCanAddCard(false);
              setCanClickStay(false);
            }

            // you can stay,
            // if you have current turn & there are more than 1 players & 2+ cards & not stayed & are not winner or busted
            if (
              res.data.players.length > 1 &&
              player.cards.length >= 2 &&
              !player.stay &&
              !isBusted(player.cards) &&
              winner === null &&
              res.data.currentPlayer &&
              res.data.currentPlayer.userId === userId
            ) {
              setCanClickStay(true);
            }

            // game is not started
            if (res.data.players.length !== res.data.playersLimit) {
              setCanLeaveGame(true);
            }

            if (
              res.data.playersLimit === res.data.players.length && // game is started
              winner === null // no winner yet
            ) {
              setCanLeaveGame(false);
            }

            if(
              res.data.players.length === res.data.playersLimit && // game is started 
              winner !== null // winner is found
            ) {
              setCanLeaveGame(true);
            }
          }

          // if someone is winner, we cannot add card
          if (winner) {
            setCanAddCard(false);
            setCanClickStay(false);
          }

          // add the balance to the user
          if (winner && winner.userId === userId) {
            setBalance(balance + game.bet);
          }
        }
      } catch (err) {
        console.log(err);
        alert("Invalid game code");
        window.location.href = "/dashboard";
      }
    }

    const intervalId = setInterval(getGame, 2000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (balance === null || balance === undefined) return;
    const tag = document.getElementById("player-bet");
    if (tag) {
      if (balance < 0) {
        tag.style.color = "red";
      } else {
        tag.style.color = "green";
      }
    }
  }, [balance]);

  useEffect(() => {
    // do not decrease the timer if there is only one player in the game
    if (game.players.length === 1) return;

    // do not decrease the timer if it's not the player's turn
    if (mainPlayer?.id !== currentPlayer?.playerId) {
      setTimer(game?.turnTime!);
      return;
    } 

    if (!isTimerSet) return;

    if (timer === 0) return;

    if (timer < 0) {
      setTimer(0);
      return;
    }

    const intervalId = setInterval(() => {
      setTimer((prevTimer) => prevTimer - 1);
    }, 1000);

    return () => clearInterval(intervalId);
    
  }, [isTimerSet, game.players.length, currentPlayer, mainPlayer, game]);

  useEffect(() => {
    if (timer <= 0 && isTimerSet) {
      const winner = findWinnerDelayed(game);
      if (mainPlayer?.id !== winner?.id) {
        setIsTimerSet(false);
        setTimer(0);
      }
    }
  }, [timer, game, mainPlayer]); 

  function addCard() {
    if (!currentTurn) {
      return alert("Not your turn!");
    }

    const payload = {
      gameCode: game.code,
      playerId: mainPlayer?.id,
    };

    axios
      .post(`${BACKEND_URL}/games/cards`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
      })
      .then(() => {
        changeTurn();
      })
      .catch((err) => {
        console.log(err);
        alert("Error adding card to player");
      });
  }

  function stayPlayer() {
    axios
      .put(
        `${BACKEND_URL}/players/stay`,
        {
          gameCode: game.code,
          stay: true,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
        }
      )
      .then(() => {
        changeTurn(true);
      })
      .catch((err) => {
        console.log(err);
        alert("Error staying player");
      });
  }

  function changeTurn(check = false) {
    if (check) {
      if (game?.players.length === 1) {
        return alert("You are the only player in the game");
      }
    }
    axios
      .put(
        `${BACKEND_URL}/games/turn`,
        {
          gameCode: game.code,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
        }
      )
      .then(() => {})
      .catch((err) => {
        console.log(err);
      });
  }

  function leavePlayer() {
    var conf = confirm("Are you sure you want to leave the game?");
    if (!conf) {
      return;
    }
    if (mainPlayer?.id === game.currentPlayer?.playerId) {
      changeTurn(false);
    }

    axios
      .delete(`${BACKEND_URL}/players/`, {
        params: {
          gameCode: game.code,
        },
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
      })
      .then(() => {
        window.location.href = "/dashboard";
      })
      .catch((err) => {
        alert("Error leaving game");
        console.log(err);
        window.location.href = "/dashboard";
      });
  }

  return (
    <>
      <PlayArea game={game} mainPlayer={mainPlayer} />
      <button className="button" onClick={addCard} disabled={!canAddCard}>
        Hit
      </button>
      <button className="button" onClick={stayPlayer} disabled={!canClickStay}>
        Stay
      </button>
      <button
        className="button red"
        onClick={leavePlayer}
        disabled={!canLeaveGame}
      >
        Leave
      </button>

      <span
        style={{
          display: "flex",
          justifyContent: "center",
        }}
      >
        Join Code: {game.code} | Balance:{" "} <span id="player-bet">{balance ?? 0}</span> &nbsp; | Time Left: {timer} sec
      </span>
    </>
  );
};

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
    if (total + 11 > 21) {
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

function findWinnerDelayed(game: IGame) {
  // iterate each player and find the blackjack winner
  for (const player of game.players) {
    if (getTotalScore(player.cards) === 21) {
      return player;
    }
  }
  
  let nonBustedPlayers = game.players.filter(
    (player) => !isBusted(player.cards)
  );
  let nonStayedPlayers = nonBustedPlayers.filter(
    (player) => !player.stay
  );

  if (nonBustedPlayers.length === 0) return null;

  // if there is only one player who is not busted in a game of multiple players, then they are the winner
  if (nonBustedPlayers.length === 1 && game.players.length > 1) {
    return nonBustedPlayers[0];
  }
  // if all players have STAYED, then the Non-Busted player with the highest score wins
  if (nonStayedPlayers.length === 0) {
    return nonBustedPlayers.reduce((prev, current) =>
      getTotalScore(prev.cards) > getTotalScore(current.cards)
        ? prev
        : current
    );
  }
  return null;
}

export default Table;
