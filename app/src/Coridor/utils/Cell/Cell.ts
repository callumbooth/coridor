import Board from "../Board/Board";

class Cell {
  row: number;
  col: number;
  gCost = 0;
  hCost = 0;

  neighbors: Cell[] = [];
  previousCell: Cell | undefined;

  constructor(row: number, col: number) {
    this.row = row;
    this.col = col;
  }

  addNeighbors = (board: Board) => {
    this.neighbors = [];

    const northAvailable =
      this.row < board.max - 1 && board.grid[this.row + 1][this.col];
    const eastAvailable =
      this.col < board.max - 1 && board.grid[this.row][this.col + 1];
    const southAvailable = this.row > 0 && board.grid[this.row - 1][this.col];
    const westAvailable = this.col > 0 && board.grid[this.row][this.col - 1];

    const possibleNeighbors = [
      ...(northAvailable ? [{ row: this.row + 2, col: this.col }] : []),
      ...(eastAvailable ? [{ row: this.row, col: this.col + 2 }] : []),
      ...(southAvailable ? [{ row: this.row - 2, col: this.col }] : []),
      ...(westAvailable ? [{ row: this.row, col: this.col - 2 }] : []),
    ];

    possibleNeighbors.forEach((neighbor) => {
      this.neighbors.push(board.grid[neighbor.row][neighbor.col] as Cell);
    });
  };

  get fCost() {
    return this.gCost + this.hCost;
  }
}

export default Cell;
