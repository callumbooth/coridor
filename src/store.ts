import { create } from "zustand";
import Cell from "./Cell";
import { cells } from "./constants";

const defaultBoard = [
  ...new Array(cells * 2 - 1).fill(false).map((_, i) =>
    new Array(cells * 2 - 1).fill(false).map((_, j) => {
      if (i % 2) {
        if (j % 2 === 1) {
          return true;
        } else {
          return true;
        }
      } else {
        if (j % 2 === 0) {
          return new Cell(i, j);
        } else {
          return true;
        }
      }
    })
  ),
];

for (let i = 0; i < cells; i++) {
  for (let j = 0; j < cells; j++) {
    (defaultBoard[i * 2][j * 2] as Cell).addNeighbors(defaultBoard);
  }
}

// console.log(defaultBoard);

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
  players: {
    1: PlayerState;
    2: PlayerState;
  };
  board: (boolean | Cell)[][];
  changeTurn: () => void;
  placeWall: (player: 1 | 2, pos: Wall) => void;
  movePlayer: (player: 1 | 2, pos: CoOrd) => void;
  selectMode: (player: 1 | 2) => void;
}

const store = create<GameState>((set, get) => ({
  board: defaultBoard,
  turn: 1,
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
  placeWall: (player, wall) => {
    const initialState = get();

    initialState.board[wall.row][wall.col] = false;

    if (wall.dir === "hoz") {
      initialState.board[wall.row][wall.col + 1] = false;
      initialState.board[wall.row][wall.col + 2] = false;
    } else {
      initialState.board[wall.row + 1][wall.col] = false;
      initialState.board[wall.row + 2][wall.col] = false;
    }

    set({
      //   board: [...initialState.board],
      players: {
        ...initialState.players,
        [player]: {
          ...initialState.players[player],
          wallsPlaced: [...initialState.players[player].wallsPlaced, wall],
        },
      },
    });
    initialState.changeTurn();
  },
  changeTurn: () => {
    const curr = get().turn;

    set({ turn: curr === 1 ? 2 : 1 });
  },
  movePlayer: (player, pos) => {
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
}));

// store.subscribe((state) => console.log(state));

export const useStore = store;

export default store;
