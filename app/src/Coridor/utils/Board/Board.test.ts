import Cell from "../Cell/Cell";
import Board from "./Board";

describe("Board", () => {
  it("should create a board", () => {
    const cells = 3;
    const board = new Board(cells);

    expect(board.grid.length).toBe(cells * 2 - 1);
    expect(board.grid[0].length).toBe(cells * 2 - 1);
  });

  it("should add neighbors", () => {
    const cells = 3;

    const board = new Board(cells);


    const topRight = board.grid[4][4] as Cell;
    const bottomLeft = board.grid[0][0] as Cell;
    const middleLeft = board.grid[0][2] as Cell;
    const center = board.grid[2][2] as Cell;

    expect(topRight.neighbors).toHaveLength(2);
    expect(bottomLeft.neighbors).toHaveLength(2);
    expect(middleLeft.neighbors).toHaveLength(3);
    expect(center.neighbors).toHaveLength(4);
  });
});
