import Cell from "../Cell/Cell";

class Board {
  size: number;
  grid: (boolean | Cell)[][];

  constructor(_size: number, initialState?: Board["grid"]) {
    this.size = _size;

    this.grid = this.createGrid(initialState);
    this.addNeighbors();
  }

  get max() {
    return this.size * 2 - 1;
  }

  createGrid = (initialState?: Board["grid"]) => {
    return new Array(this.max).fill(false).map((_, i) =>
      new Array(this.max).fill(false).map((_, j) => {
        if (i % 2) {
          if (j % 2 === 1) {
            return initialState ? initialState[i][j] : true;
          } else {
            return initialState ? initialState[i][j] : true;
          }
        } else {
          if (j % 2 === 0) {
            return new Cell(i, j);
          } else {
            return initialState ? initialState[i][j] : true;
          }
        }
      })
    );
  };

  addNeighbors = () => {
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        (this.grid[i * 2][j * 2] as Cell).addNeighbors(this);
      }
    }
  };
}

export default Board;
