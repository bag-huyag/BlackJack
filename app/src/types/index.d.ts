export interface ITokenData {
  name: string;
  email: string;
  userId: number;
}

export interface ICard {
  id: number;
  value: string;
  suit: string;
}

export interface IPlayerCards {
  playerId: number;
  value: string;
  suite: string;
}

export interface ICurrentPlayer {
  id: number;
  startTime: number;
  playerId: number;
  sequenceNumber: number;
  userId: number;
  username: string;
}

export interface IPlayer {
  id: number;
  gameId: number;
  userId: number;
  stay: boolean;
  sequenceNumber: number;
  username: string;
  cards: IPlayerCards[];
}

export interface IGame {
  id: number;
  code: string;
  bet: number;
  turnTime: number;
  playersLimit: number;
  players: IPlayer[];
  currentPlayer?: ICurrentPlayer;
}


export interface IError {
  message?: string;
  error?: string;
}
