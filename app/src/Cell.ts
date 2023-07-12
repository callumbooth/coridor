import { max } from "./constants";

class Cell {
  row: number;
  col: number;
  gCost = 0;
  hCost = 0;
  fCost = 0;
  neighbors: Cell[] = [];
  previousCell: Cell | undefined;

  constructor(row: number, col: number) {
    this.row = row;
    this.col = col;
  }

  addNeighbors = (board: (Cell | boolean)[][]) => {
    this.neighbors = [];

    const northAvailable = this.row < max - 1 && board[this.row + 1][this.col];
    const eastAvailable = this.col < max - 1 && board[this.row][this.col + 1];
    const southAvailable = this.row > 0 && board[this.row - 1][this.col];
    const westAvailable = this.col > 0 && board[this.row][this.col - 1];

    const possibleNeighbors = [
      ...(northAvailable ? [{ row: this.row + 2, col: this.col }] : []),
      ...(eastAvailable ? [{ row: this.row, col: this.col + 2 }] : []),
      ...(southAvailable ? [{ row: this.row - 2, col: this.col }] : []),
      ...(westAvailable ? [{ row: this.row, col: this.col - 2 }] : []),
    ];

    possibleNeighbors.forEach((neighbor) => {
      this.neighbors.push(board[neighbor.row][neighbor.col] as Cell);
    });
  };
}

export default Cell;
