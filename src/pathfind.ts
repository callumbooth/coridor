import Cell from "./Cell";
import { CoOrd } from "./store";
import store from "./store";

const board = store.getState().board;

console.log(board);

const closedCells: Cell[] = [];
const openCells: Cell[] = [];

const getLowestFCost = () => {
  let lowestIndex = 0;
  for (let i = 0; i < openCells.length; i++) {
    if (openCells[i].fCost < openCells[lowestIndex].fCost) {
      lowestIndex = i;
    }
  }
  return [openCells[lowestIndex], lowestIndex] as const;
};

const getFinalPath = (finalCell: Cell) => {
  return finalCell;
};

export const start = (startCell: Cell, goalCell: Cell) => {
  const heuristic = (cell: Cell) => {
    const d1 = Math.abs(goalCell.col - cell.col);
    const d2 = Math.abs(goalCell.row - cell.row);

    return d1 + d2;
  };

  //add start cell
  openCells.push(startCell);

  while (openCells.length > 0) {
    const [currentCell, currentCellIndex] = getLowestFCost();

    //end if currentCell = goal
    if (currentCell === goalCell) {
      console.log("path found", getFinalPath(currentCell));
      return true;
    }

    //remove node from open
    openCells.splice(currentCellIndex, 1);
    //add node to closed
    closedCells.push(currentCell);

    for (let i = 0; i < currentCell.neighbors.length; i++) {
      const neighbor = currentCell.neighbors[i];

      if (closedCells.includes(neighbor)) {
        continue;
      }

      const tempGScore =
        currentCell.gCost === Infinity ? 1 : currentCell.gCost + 1;

      console.log(tempGScore, neighbor.gCost);

      if (tempGScore < neighbor.gCost) {
        const hScore = heuristic(neighbor);
        neighbor.gCost = tempGScore;
        neighbor.fCost = tempGScore + hScore;
        neighbor.hCost = hScore;
        neighbor.previousCell = currentCell;

        if (!openCells.includes(neighbor)) {
          openCells.push(neighbor);
        }
      }
    }

    // [

    // ].forEach((neighbor) => {

    //   for (let i = 0; i < closedCells.length; i++) {
    //     if (
    //       closedCells[i].row === neighbor.row &&
    //       closedCells[i].col === neighbor.col
    //     ) {
    //       return;
    //     }
    //   }

    //   let isInOpen = false;
    //   for (let i = 0; i < closedCells.length; i++) {
    //     if (
    //       openCells[i].row === neighbor.row &&
    //       openCells[i].col === neighbor.col
    //     ) {
    //       isInOpen = true;
    //       break;
    //     }
    //   }
    // });
  }
  console.log("no path found");
  return false;
};
