import Board from "../Board/Board";
import Cell from "../Cell/Cell";
import { start } from "./pathfind";
import { bench } from "vitest";

const board = new Board(9);


bench("normal", () => {
  start(board.grid[0][2] as Cell, [board.grid[16][2] as Cell]);
});
