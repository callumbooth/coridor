import Board from "../Board/Board";
import Cell from "../Cell/Cell";
import { start } from "./pathfind";

let board = new Board(3);

describe("pathfind", () => {
  afterEach(() => {
    board = new Board(3);
  });

  it("should return true when a path can be found", () => {
    const res = start(board.grid[0][2] as Cell, [board.grid[4][2] as Cell]);

    expect(res).toBe(true);
  });

  it("should return false when a path cannot be found", () => {
    const blockedBoard = new Board(3);

    blockedBoard.grid[1].forEach((_, i) => (blockedBoard.grid[1][i] = false));

    blockedBoard.addNeighbors();

    const res = start(blockedBoard.grid[0][2] as Cell, [
      blockedBoard.grid[4][2] as Cell,
    ]);

    expect(res).toBe(false);
  });
});
