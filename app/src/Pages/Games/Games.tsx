import axios from "axios";
import { useEffect, useState } from "react";

import "./Games.css";

interface GameData {
  bet: number;
  playersCount: number;
  code: string;
  turnTime: number;
}

const Games = () => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://sirshak.ddns.net";
  const token = localStorage.getItem("token");
  const userID = parseInt(localStorage.getItem("id")!);
  const [games, setGames] = useState<GameData[]>([]);
  const [seconds, setSeconds] = useState(30);
  const [players, setPlayers] = useState(2);

  useEffect(() => {
    try {
      axios
        .get<GameData[]>(`${BACKEND_URL}/games`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
        })
        .then((res) => {
          setGames(res.data);
        })
        .catch((err) => {
          console.log(err.response.data.message || err.message);
        });
    } catch {
      console.log("Error fetching games");
      alert("Error fetching games. Please refresh.");
    }
  }, [setGames, token]);

  function openCreateGamePopup() {
    document.getElementById("create-game-popup")!.style.display = "flex";
    (document.getElementById("bet-amount") as HTMLInputElement).value = "50";
    (document.getElementById("move-time") as HTMLInputElement).value =
      "10 секунд";
  }

  function closeCreateGamePopup() {
    document.getElementById("create-game-popup")!.style.display = "none";
  }

  function createGame() {
    const betAmount = parseInt(
      (document.getElementById("bet-amount") as HTMLInputElement).value.replace(
        /\D/g,
        ""
      )
    );
    if (isNaN(betAmount)) {
      alert("Время хода и сумма ставки должны быть числами");
      return;
    }

    axios
      .post(
        `${BACKEND_URL}/games`,
        {
          turnTime: seconds,
          bet: betAmount,
          playersLimit: players,
          userId: userID
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
        }
      )
      .then((res) => {
        setGames(() => [...games, res.data]); // Add new game to games list
        window.location.href = `/game/${res.data.code}`;
      })
      .catch((err) => {
        alert(err);
      });
  }

  return (
    <>
      <div className="header">
        <a href="/dashboard">
          <div className="back-arrow">
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 131 131"
              preserveAspectRatio="xMidYMid meet"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="65.5"
                cy="65.5"
                r="57.5"
                fill="white"
                stroke="#F4F7FC"
                strokeWidth="16"
              />
              <path
                d="M73.5 39L47 65.5L73.5 92"
                stroke="#0D4CD3"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </a>
        <div className="title">СТОЛЫ</div>
      </div>
      <div className="table-list">
        {games.map((game, index) => {
          return (
            <a href={`/game/${game.code}`} key={game.code}>
              <div className="table">
                <div key={index}>
                  <h3>СТОЛ {index + 1}</h3>
                  <p>Количество игроков: {game.playersCount}</p>
                  <p>Ставка: {game.bet}₽</p>
                  <p>Код: {game.code}</p>
                  <p>Время поворота: {game.turnTime}₽</p>
                </div>
              </div>
            </a>
          );
        })}
      </div>
      <button className="create-btn" onClick={openCreateGamePopup}>
        СОЗДАТЬ
      </button>
      <div id="create-game-popup" className="popup-overlay">
        <div className="popup-content">
          <span className="close-btn" onClick={closeCreateGamePopup}>
            &times;
          </span>
          <h2>Создать игру</h2>
          <div className="input-group">
            <label htmlFor="bet-amount">Ставка</label>
            <input type="number" id="bet-amount" min={50} />
          </div>
          <div className="input-group">
            <label>Время на ход (seconds)</label>
            <div className="increment-btns">
              <button onClick={() => {
                if (seconds === 10) return;
                setSeconds(seconds - 1);
              }}>-</button>
              <input type="text" value={seconds} readOnly />
              <button onClick={() => {
                if (seconds === 60) return;
                setSeconds(seconds + 1);
              }}>+</button>
            </div>
          </div>
          <div className="input-group">
            <label>Players Limit</label>
            <div className="increment-btns">
              <button onClick={() => {
                if (players === 2) return;
                setPlayers(players - 1);
              }}>-</button>
              <input type="text" value={players} readOnly />
              <button onClick={() => {
                if (players === 4) return;
                setPlayers(players + 1);
              }}>+</button>
            </div>
          </div>
          <button className="create-btn" onClick={createGame}>
            СОЗДАТЬ
          </button>
        </div>
      </div>
    </>
  );
};

export default Games;
