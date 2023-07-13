import { create } from "zustand";
import Cell from "./utils/Cell/Cell";
import { cells } from "./constants";
import { v4 as uuid } from "uuid";
import { socket } from "./socket";
import Board from "./utils/Board/Board";

export interface CoOrd {
  row: number;
  col: number;
}

export interface Wall extends CoOrd {
  dir: "hoz" | "vert";
}

export interface PossibleWall extends Wall {
  valid: boolean;
}

interface PlayerState extends CoOrd {
  wallsPlaced: Wall[];
  mode: "move" | "wall";
}

interface GameState {
  turn: 1 | 2;
  room: string | undefined;
  player: 1 | 2 | undefined;
  players: {
    1: PlayerState;
    2: PlayerState;
  };
  board: (boolean | Cell)[][];
  setPlayer: (player: 1 | 2) => void;
  changeTurn: () => void;
  placeWall: (player: 1 | 2, pos: Wall, isReconsiliation?: boolean) => void;
  movePlayer: (player: 1 | 2, pos: CoOrd, isReconsiliation?: boolean) => void;
  selectMode: (player: 1 | 2) => void;
  createRoom: () => void;
  joinRoom: (roomId: string) => void;
}

const store = create<GameState>((set, get) => ({
  board: new Board(cells).grid,
  room: undefined,
  turn: 1,
  player: undefined,
  players: {
    1: {
      row: 0,
      col: cells - 1,
      wallsPlaced: [],
      mode: "move",
    },
    2: {
      row: cells * 2 - 2,
      col: cells - 1,
      wallsPlaced: [],
      mode: "move",
    },
  },
  setPlayer: (player) => {
    set({ player });
  },
  placeWall: (player, wall, isReconsiliation) => {
    const initialState = get();
    const newBoard = new Board(cells, initialState.board);

    newBoard.grid[wall.row][wall.col] = false;

    if (wall.dir === "hoz") {
      newBoard.grid[wall.row][wall.col + 1] = false;
      newBoard.grid[wall.row][wall.col + 2] = false;
    } else {
      newBoard.grid[wall.row + 1][wall.col] = false;
      newBoard.grid[wall.row + 2][wall.col] = false;
    }

    set({
      board: newBoard.grid,
      players: {
        ...initialState.players,
        [player]: {
          ...initialState.players[player],
          wallsPlaced: [...initialState.players[player].wallsPlaced, wall],
        },
      },
    });
    !isReconsiliation &&
      socket.emit("playerMoved", initialState.room, {
        type: "wall",
        value: wall,
      });
    initialState.changeTurn();
  },
  changeTurn: () => {
    const curr = get().turn;

    set({ turn: curr === 1 ? 2 : 1 });
  },
  movePlayer: (player, pos, isReconsiliation) => {
    console.log("move", player, pos);
    const initialState = get();
    set({
      players: {
        ...initialState.players,
        [player]: {
          ...initialState.players[player],
          ...pos,
        },
      },
    });
    !isReconsiliation &&
      socket.emit("playerMoved", initialState.room, {
        type: "move",
        value: pos,
      });
    initialState.changeTurn();
  },
  selectMode: (player) => {
    const initialState = get();

    set({
      players: {
        ...initialState.players,
        [player]: {
          ...initialState.players[player],
          mode: initialState.players[player].mode === "move" ? "wall" : "move",
        },
      },
    });
  },
  createRoom: () => {
    const id = uuid();

    socket.emit("joinRoom", id);

    set({ room: id, player: 1 });
  },
  joinRoom: (roomId) => {
    socket.emit("joinRoom", roomId);
    set({ room: roomId, player: 2 });
  },
}));

export const useStore = store;

export default store;
