import axios, { AxiosError } from "axios";
import { jwtDecode } from "jwt-decode";
import React, { useEffect, useState } from "react";
import { BACKEND_URL } from "../../../config";
import Card from "./Card";
import "./SquareTable.css";

interface Card {
  id: number;
  name: string;
  value: string;
  suit: string;
}

interface TokenData {
  userName: string;
  email: string;
  userId: number;
}

interface Player {
  id: number;
  name: string;
  bet: number;
  gameId: number;
  userId: number;
  ready: number;
  state: string;
  outcome: string;
  score: number;
  stay: number;
  cards: Card[];
}

interface Game {
  id: number;
  code: string;
  bet: number;
  playersCount: number;
  state: string;
  turnTime: number;
  winnerId: number;
  previousTurns: string;
  currentTurnId: number;
  players: Player[];
}

interface IGameResponse {
  game: Game;
}

interface IResponseError {
  message?: string;
  error?: string;
}

// REMAINING:
// 1. Game logic for black jack
// 3. Game states and player state: ready, playing, waiting, etc.

const SquareTable: React.FC<{ gameCode: string }> = ({ gameCode }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [game, setGame] = useState<Game>();

  const [mainPlayer, setMainPlayer] = useState<Player>();
  const [players, setPlayers] = useState<Player[]>([]);
  const [balance, setBalance] = useState(0);

  const [isReady, setIsReady] = useState<boolean>(false);
  const [canAddCards, setCanAddCards] = useState<boolean>(false);
  const [canSkipTurn, setCanSkipTurn] = useState<boolean>(false);

  const token = localStorage.getItem("token");
  const decode = jwtDecode<TokenData>(token!);

  function randomizeCards<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  useEffect(() => {
    /* Getting the cards in the game */
    // TODO: make it so that the cards, refresh after every game
    async function getCards() {
      try {
        const response = await axios.get<Card[]>(`${BACKEND_URL}/cards`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
        });
        setCards(randomizeCards(response.data));
      } catch (err) {
        console.log(err);
        alert("Error getting cards");
      }
    }

    /* Getting you the player */
    async function getPlayer() {
      try {
        // sleep for 1 second so that the player can be added to the game
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const response = await axios.get<Player>(`${BACKEND_URL}/players`, {
          params: {
            userId: decode.userId,
            gameCode: gameCode,
          },
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
        });
        setMainPlayer(response.data);
      } catch (error) {
        console.log(error);
        const err = error as AxiosError<IResponseError>;
        alert(
          err.response?.data.message ||
            err.response?.data.error ||
            "You are not in this game"
        );
      }
    }

    getCards();

    getPlayer();
  }, []);

  useEffect(() => {
    async function getGame() {
      try {
        const response = await axios.get<IGameResponse>(
          `${BACKEND_URL}/games/${gameCode}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "ngrok-skip-browser-warning": "true",
            },
          }
        );
        if (response.data.game.playersCount > 4) {
          alert("Game is full");
          window.location.href = "/dashboard";
        }

        setGame(response.data.game);
        setPlayers(response.data.game.players);
        renderCards();

        for (const player of response.data.game.players) {
          if (player.userId === decode.userId) {
            setMainPlayer(player);
            setBalance(player.bet);
          }

          if (player.outcome === "WINNER") {
            setCanAddCards(false);
            break;
          }
          
          if (player.userId === decode.userId) {
            setMainPlayer(player);
            setBalance(player.bet);
            setIsReady(player.ready === 1);
            var isCurrentTurn = player.id === response.data.game.currentTurnId;
            var isBusted = player.outcome === "BUSTED";

            // player is ready and it's their turn
            if (isCurrentTurn && player.ready && !isBusted && player.stay === 0)
              setCanAddCards(true);
            else setCanAddCards(false);

            if (
              player !== undefined &&
              player?.cards.length >= 2 &&
              response.data.game?.currentTurnId === player?.id &&
              player?.outcome !== "BUSTED" &&
              player.stay === 0
            )
              setCanSkipTurn(true);
            else setCanSkipTurn(false);
          }
        }
      } catch (err) {
        console.log(err);
        alert("Invalid game code");
        window.location.href = "/dashboard";
      }
    }

    getGame();

    const intervalId = setInterval(getGame, 2000);

    return () => clearInterval(intervalId);
  }, [gameCode, token, decode.userId]);

  useEffect(() => {
    if (mainPlayer?.bet === null || mainPlayer?.bet === undefined) return;
    if (mainPlayer?.bet < 0) {
      document.getElementById("player-bet")!.style.color = "red";
    } else {
      document.getElementById("player-bet")!.style.color = "green";
    }
  }, [balance])

  function changeTurn(check = false) {
    if (check) {
      if (game?.players.length === 1) {
        return alert("You are the only player in the game");
      }
    }

    // the next player of the game is the next player after the main player
    axios
      .put(
        `${BACKEND_URL}/games/changeTurn`,
        {
          currentPlayerId: mainPlayer?.id,
          gameCode: game?.code,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
        }
      )
      .then((_) => {
        console.log("Turn skipped");
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function changeStay(stay: boolean) {
    // Make the API call to change the turn
    axios
      .put(
        `${BACKEND_URL}/players/stay`,
        {
          playerId: mainPlayer?.id,
          gameCode: game?.code,
          stay: stay,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
        }
      )
      .then((_) => {
        console.log("Player Stayed");
        changeTurn();
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function addUserCard() {
    if (game?.currentTurnId !== mainPlayer?.id) {
      return alert("Not your turn!");
    }
    const randomCard = cards[Math.floor(Math.random() * cards.length)];

    // Make the API call to add the card to the player
    const payload = {
      gameCode: game?.code,
      playerId: mainPlayer?.id,
      cardId: randomCard.id,
    };

    axios
      .post(`${BACKEND_URL}/games/playerCards`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
      })
      .then((res) => {
        // change the turn
        changeTurn();
      })
      .catch((err) => {
        console.log(err);
        alert("Error adding card to player");
      });
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

    while (i < players.length && i < 4) {
      const player = players[i];

      if (player.id === mainPlayer?.id) {
        area.push(
          <>
            <div className="bottom player-info">
              <span className="info">
                { player.ready === 1 ? "Ready": "" } { " | " }
                { game?.currentTurnId === player.id ? "Current | " : "" }
                { player.stay === 1 ? "Stayed | " : "" }
                { player.name } | { player.score }
              </span>
              {player.outcome === "BUSTED" ? (
                <span className="warn">Busted</span>
              ) : (
                ""
              )}
              {player.outcome === "WINNER" ? (
                <span className="success">Winner!</span>
              ) : (
                ""
              )}
              <div className="cards-container">
                {player?.cards.map((card) => (
                  <Card
                    key={card.id}
                    value={card.value}
                    suit={card.suit}
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
                { player.ready === 1 ? "Ready": "" } { " | " }
                { game?.currentTurnId === player.id ? "Current | " : "" }
                { player.stay === 1 ? "Stayed | " : "" }
                { player.name } | { player.score }
            </span>
            {player.outcome === "BUSTED" ? (
              <span className="warn">Busted</span>
            ) : (
              ""
            )}
            {player.outcome === "WINNER" ? (
              <span className="success">Winner!</span>
            ) : (
              ""
            )}
            <div className="cards-container">
              {player?.cards.map((card) => (
                <Card
                  key={card.id}
                  value={card.value}
                  suit={card.suit}
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

  function leavePlayer() {
    var conf = confirm("Are you sure you want to leave the game?");
    if (!conf) {
      return;
    }
    if (mainPlayer?.id === game?.currentTurnId) {
      changeTurn(false);
    }

    axios
      .delete(`${BACKEND_URL}/players/`, {
        params: {
          playerId: mainPlayer?.id,
          gameCode: gameCode,
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
      });
  }

  function changeIsReady() {
    axios
      .put(
        `${BACKEND_URL}/players/ready`,
        {
          playerId: mainPlayer?.id,
          gameCode: gameCode,
          ready: !isReady,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
        }
      )
      .then((_) => {
        setIsReady(!isReady);
      })
      .catch((err) => {});
  }

  function restartGame() {
    var agree = confirm(
      "Are you sure you want to restart the game? \nYour all cards will be lost."
    );
    if (!agree) {
      return;
    }
    axios
      .post(
        `${BACKEND_URL}/games/restart`,
        {
          gameCode: gameCode,
          playerId: mainPlayer?.id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
        }
      )
      .then(() => {
        alert("Game restarted");
      })
      .catch((err) => {
        console.log(err);
      });
  }

  return (
    <>
      <div className="square-table">
        {renderCards()}
      </div>

      <span>&nbsp; Ready? </span>
      <label className="switch">
        <input
          type="checkbox"
          id="is-ready"
          onChange={changeIsReady}
          checked={mainPlayer?.ready === 1}
        />
        <span className="slider"></span>
      </label>
      <button
        className="button"
        onClick={addUserCard}
        disabled={!canAddCards} // only allow hit if it's the player's turn
      >
        Hit
      </button>
      <button
        className="button"
        onClick={() => {
          changeStay(true);
        }}
        disabled={!canSkipTurn} // only allow stay if it's the player's turn
      >
        Stay
      </button>

      <button
        className="button"
        onClick={restartGame}
        style={{
          backgroundColor: "black",
          color: "white",
        }}
      >
        Restart
      </button>

      <button
        className="button"
        onClick={leavePlayer}
        style={{
          backgroundColor: "red",
        }}
      >
        Leave
      </button>

      <span
        style={{
          display: "flex",
          justifyContent: "center",
        }}
      >
        Join Code: {game?.code} | Balance: <div id="player-bet">{balance ?? 0}</div>
      </span>
    </>
  );
};

export default SquareTable;
