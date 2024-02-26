import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios, { AxiosError } from "axios";

import "./Game.css";
import { BACKEND_URL } from "../../config";

import SquareTable from "../Games/Components/SquareTable";

interface TokenData {
  name: string;
  email: string;
  userId: number;
}

interface Card {
  id: number;
  name: string;
  value: string;
  suit: string;
}

interface Hands {
  playerId: number;
  gameCode: string;
  cardId: number;
  card: Card;
}

interface Player {
  id: number;
  bet: number;
  gameId: number;
  userId: number;
  ready: number;
  state: string;
  outcome: string;
  score: number;
  hands: Hands[];
}

interface Game {
  id: number;
  code: string;
  bet: number;
  playersCount: number;
  state: string;
  turnTime: number;
  winnerId: number;
  currentTurnId: number;
  players: Player[];
}

interface IGameResponse {
  game: Game;
}

interface IGameError {
  message?: string;
  error?: string;
}

const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
const suits = ["spades", "hearts", "clubs", "diamonds"];
function rand<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const Game = () => {
  // for future use
  const token = localStorage.getItem("token");
  const decode = jwtDecode<TokenData>(token!);
  // const [game, setGame] = useState<any>(null);
  // const [user, setUser] = useState<IUserPlayer>();

  const { code } = useParams();
  if (!code) {
    window.location.href = "/games";
  }

  useEffect(() => {
    const getAndJoinGame = async () => {
      try {
        const res = await axios.get<IGameResponse>(
          `${BACKEND_URL}/games/${code}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'ngrok-skip-browser-warning': 'true'
            },
          }
        );
        if (
          res.data.game.players.length > 4 ||
          res.data.game.playersCount > 4
        ) {
          alert("Game is full!");
          window.location.href = "/dashboard";
        }

        if (res.data.game.state === "RUNNING") {
          alert(
            "This is a running game, please join once it is finished or idle"
          );
          window.location.href = "/dashboard";
        }

        const player = res.data.game.players.find(
          (p) => p.userId === decode.userId
        );

        // This is not a player in game, so join him.
        if (!player) {
          if (res.data.game.players.length > 4 || res.data.game.playersCount > 4) {
            alert("Game is full!");
            window.location.href = "/dashboard";
          }
          try {
            await axios.post<Player>(
              `${BACKEND_URL}/games/${code}`,
              {
                userId: decode.userId,
                gameCode: code,
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'ngrok-skip-browser-warning': 'true'
                },
              }
            );
          } catch (err) {
            
          }
        }
      } catch (error) {
        const err = error as AxiosError<IGameError>;
        console.log(err);
        alert(
          err.response?.data.message ||
            err.response?.data.error ||
            "Invalid game code"
        );
        window.location.href = "/dashboard";
      }
    };
    getAndJoinGame();
  }, [code, decode]);

  return (
    <div>
      <SquareTable gameCode={code as string} />
    </div>
  );
};

export default Game;
