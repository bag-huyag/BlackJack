import axios, { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import Table from "../../components/Table";
import { BalanceProvider } from '../../context/Balance';
import { IError, IGame, IPlayer } from "../../types";
import "./Game.css";


const Game = () => {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://sirshak.ddns.net";
  const token = localStorage.getItem("token");
  const userId = parseInt(localStorage.getItem("id")!);
  // const decode = jwtDecode<IPlayer>(token!);
  const [game, setGame] = useState<IGame>();
  const [player, setPlayer] = useState<IPlayer>();

  const { code } = useParams();
  if (!code) {
    window.location.href = "/games";
  }

  useEffect(() => {
    const getAndJoinGame = async () => {
      try {
        const res = await axios.get<IGame>(
          `${BACKEND_URL}/games/${code}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'ngrok-skip-browser-warning': 'true'
            },
          }
        );

        setGame(res.data);

        const exists = res.data.players.find(
          (p) => p.userId === userId
        );

        if (exists) {
          setPlayer(exists);
          return;
        }

        if (
          (res.data.players.length + 1) > res.data.playersLimit
        ) {
          alert("Game is full!");
          window.location.href = "/dashboard";
        }
        // create the player
        try {
          await axios.post<IPlayer>(
            `${BACKEND_URL}/games/${code}`,
            {
              userId: userId,
              gameCode: code,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'ngrok-skip-browser-warning': 'true'
              },
            }
          );
        } catch (err) {}
      } 
      catch (error) {
        const err = error as AxiosError<IError>;
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
  }, []);

  return (
    <div>
      {game !== undefined ? (
        <BalanceProvider>
          <Table initialGame={game!} initialPlayer={player} />
        </BalanceProvider>
      ) : ""}
      {/* Define other tables and type of gameplay and import to use them */}
    </div>
  );
};

export default Game;
