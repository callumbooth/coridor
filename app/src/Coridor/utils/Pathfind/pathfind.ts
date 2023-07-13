import Cell from "../Cell/Cell";
// import { CoOrd } from "./store";
// import store from "./store";

// const board = store.getState().board;

// console.log(board);

export const start = (startCell: Cell, goalCells: Cell[]) => {
  const getFinalPath = (finalCell: Cell) => {
    return finalCell;
  };

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

  const heuristic = (cell: Cell) => {
    let closestGoal = Infinity;
    let closestCell = goalCells[0];

    for (let i = 0; i < goalCells.length; i++) {
      const d1 = Math.abs(goalCells[i].col - cell.col);
      const d2 = Math.abs(goalCells[i].row - cell.row);
      const dist = d1 + d2;

      if (dist < closestGoal) {
        closestGoal = dist;
        closestCell = goalCells[i];
      }
    }
    return closestCell.hCost;
  };

  //add start cell
  openCells.push(startCell);

  while (openCells.length > 0) {
    const [currentCell, currentCellIndex] = getLowestFCost();

    //end if currentCell in goals
    if (goalCells.includes(currentCell)) {
      //   console.log("path found", getFinalPath(currentCell));
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

      const tempGScore = currentCell.gCost + 1;

      if (openCells.includes(neighbor)) {
        if (tempGScore < neighbor.gCost) {
          neighbor.gCost = tempGScore;
        }
      } else {
        neighbor.gCost = tempGScore;
        openCells.push(neighbor);
      }

      neighbor.hCost = heuristic(neighbor);
      neighbor.previousCell = currentCell;
    }
  }
  console.log("no path found");
  return false;
};
