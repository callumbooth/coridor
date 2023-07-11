import { max } from "./constants";

class Cell {
  row: number;
  col: number;
  gCost = Infinity;
  hCost = 0;
  fCost = Infinity;
  neighbors: Cell[] = [];
  previousCell: Cell | undefined;

  constructor(row: number, col: number) {
    this.row = row;
    this.col = col;
  }

  addNeighbors = (board: (Cell | boolean)[][]) => {
    [
      { row: this.row + 2, col: this.col },
      { row: this.row, col: this.col + 2 },
      { row: this.row - 2, col: this.col },
      { row: this.row, col: this.col - 2 },
    ].forEach((neighbor) => {
      if (
        neighbor.row < 0 ||
        neighbor.col < 0 ||
        neighbor.row > max - 1 ||
        neighbor.col > max - 1
      ) {
        return;
      }

      this.neighbors.push(board[neighbor.row][neighbor.col] as Cell);
    });
  };
}

export default Cell;
