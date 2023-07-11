import { Suspense, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Box,
  Environment,
  GizmoHelper,
  GizmoViewport,
  OrbitControls,
  Plane,
  Stats,
  Torus,
} from "@react-three/drei";

import { CoOrd, Wall as IWall, PossibleWall, useStore } from "./store";
import { start } from "./pathfind";
import Cell from "./Cell";
import { cells } from "./constants";

const wallWidth = 0.1;
const cellWidth = 1;

const fsize = cells * cellWidth + (cells - 1) * wallWidth;
const center = fsize / 2;
const max = cells * 2 - 1;

const goNorth = (cell: CoOrd) => {
  return {
    row: cell.row + 2,
    col: cell.col,
    dir: "north",
  } as const;
};

const goEast = (cell: CoOrd) => {
  return {
    row: cell.row,
    col: cell.col + 2,
    dir: "east",
  } as const;
};

const goSouth = (cell: CoOrd) => {
  return {
    row: cell.row - 2,
    col: cell.col,
    dir: "south",
  } as const;
};

const goWest = (cell: CoOrd) => {
  return {
    row: cell.row,
    col: cell.col - 2,
    dir: "west",
  } as const;
};

const getWallPos = (cell: IWall) => {
  let xCellCount;
  let xWallCount;
  let zCellCount;
  let zWallCount;
  const normalise =
    cellWidth / 2 + wallWidth / 2 + (cell.dir === "vert" ? -wallWidth : 0);

  if (cell.col % 2 === 1) {
    //odd rows
    xCellCount = cell.col < 2 ? 1 : (cell.col + 1) / 2;
    xWallCount = xCellCount;
  } else {
    xCellCount = cell.col < 2 ? 1 : cell.col / 2 + 1;
    xWallCount = xCellCount - 1;
  }

  if (cell.row % 2 === 1) {
    //odd cols
    zCellCount = cell.row < 2 ? 1 : (cell.row + 1) / 2;
    zWallCount = zCellCount - 1;
  } else {
    zCellCount = cell.row < 2 ? 1 : cell.row / 2 + 1;
    zWallCount = zCellCount;
  }

  const x = xCellCount * cellWidth + xWallCount * wallWidth + normalise;

  const z = zCellCount * cellWidth + zWallCount * wallWidth + normalise;

  // const x = xCellCount * cellWidth + xWallCount * wallWidth;
  // const z = zCellCount * cellWidth + zWallCount * wallWidth;

  return {
    x,
    z,
  };
};

const Wall = (props: IWall & { player: 1 | 2 }) => {
  const isHoz = props.dir === "hoz";
  const pos = getWallPos(props);

  return (
    <Box
      args={[2 + wallWidth, 1, wallWidth]}
      position={[pos.x, 0, -pos.z]}
      rotation={[0, !isHoz ? -Math.PI / 2 : 0, 0]}
    >
      <meshStandardMaterial color={"hotpink"} />
    </Box>
  );
};

const getPlayerPos = (coord: CoOrd) => {
  // cells = cell / 2 + 1
  // walls = cell / 2
  // pos = cells * cellWidth + walls * wallWidth

  const xCells = coord.col < 2 ? 1 : coord.col / 2 + 1;
  const xWalls = coord.col < 2 ? 0 : coord.col / 2;

  const zCells = coord.row < 2 ? 1 : coord.row / 2 + 1;
  const zWalls = coord.row < 2 ? 0 : coord.row / 2;

  const x = xCells * cellWidth + xWalls * wallWidth;
  const z = zCells * cellWidth + zWalls * wallWidth;

  return {
    x,
    z,
  };
};

const Player = (props: { player: 1 | 2 }) => {
  const isP1 = props.player === 1;

  const player = useStore((state) => state.players[props.player]);

  const pos = getPlayerPos(player);

  return (
    <Box position={[pos.x, 0, -pos.z]} args={[1, 2, 1]}>
      <meshStandardMaterial color={isP1 ? "red" : "blue"} />
    </Box>
  );
};

const getValidMoves = (cell: { row: number; col: number }) => {
  const board = useStore.getState().board;

  const northAvailable = cell.row < max - 1 && board[cell.row + 1][cell.col];
  const eastAvailable = cell.col < max - 1 && board[cell.row][cell.col + 1];
  const southAvailable = cell.row > 0 && board[cell.row - 1][cell.col];
  const westAvailable = cell.col > 0 && board[cell.row][cell.col - 1];
  const validMoves = [];

  if (northAvailable) {
    validMoves.push(goNorth(cell));
  }

  if (eastAvailable) {
    validMoves.push(goEast(cell));
  }

  if (southAvailable) {
    validMoves.push(goSouth(cell));
  }

  if (westAvailable) {
    validMoves.push(goWest(cell));
  }

  return validMoves;
};

const getAdditionalMoves = (
  cell: { row: number; col: number },
  going: "north" | "south" | "east" | "west"
) => {
  const board = useStore.getState().board;

  const northAvailable = cell.row < max - 1 && board[cell.row + 1][cell.col];
  const eastAvailable = cell.col < max - 1 && board[cell.row][cell.col + 1];
  const southAvailable = cell.row > 0 && board[cell.row - 1][cell.col];
  const westAvailable = cell.col > 0 && board[cell.row][cell.col - 1];

  switch (going) {
    case "north": {
      if (northAvailable) {
        return [goNorth(cell)];
      }

      return [
        ...(eastAvailable ? [goEast(cell)] : []),
        ...(westAvailable ? [goWest(cell)] : []),
      ];
    }
    case "east": {
      if (eastAvailable) {
        return [goEast(cell)];
      }
      return [
        ...(northAvailable ? [goNorth(cell)] : []),
        ...(southAvailable ? [goSouth(cell)] : []),
      ];
    }
    case "south": {
      if (southAvailable) {
        return [goSouth(cell)];
      }
      return [
        ...(eastAvailable ? [goEast(cell)] : []),
        ...(westAvailable ? [goWest(cell)] : []),
      ];
    }
    case "west": {
      if (westAvailable) {
        return [goWest(cell)];
      }
      return [
        ...(northAvailable ? [goNorth(cell)] : []),
        ...(southAvailable ? [goSouth(cell)] : []),
      ];
    }
    default: {
      return [];
    }
  }
};

const MoveTo = () => {
  const movePlayer = useStore((state) => state.movePlayer);

  const currTurn = useStore((state) => state.turn);
  const currPlayer = useStore((state) => state.players[currTurn]);
  const oppPlayer = useStore((store) => store.players[currTurn === 1 ? 2 : 1]);

  if (currPlayer.mode !== "move") {
    return null;
  }

  const initialMoves = getValidMoves({
    row: currPlayer.row,
    col: currPlayer.col,
  });

  const validMoves = initialMoves.reduce((initial, current) => {
    if (current.row === oppPlayer.row && current.col === oppPlayer.col) {
      const additionalMoves = getAdditionalMoves(
        {
          row: oppPlayer.row,
          col: oppPlayer.col,
        },
        current.dir
      );

      if (!additionalMoves) {
        return initial;
      }

      return [...initial, ...additionalMoves];
    }

    return [...initial, current];
  }, [] as CoOrd[]);

  return (
    <>
      {validMoves.map((validMove, i) => {
        const pos = getPlayerPos(validMove);

        return (
          <Box
            key={i}
            position={[pos.x, 0, -pos.z]}
            onClick={(e) => {
              e.stopPropagation();
              movePlayer(currTurn, { row: validMove.row, col: validMove.col });
            }}
          >
            <meshStandardMaterial color={"gray"} opacity={0.7} transparent />
          </Box>
        );
      })}
    </>
  );
};

const PlaceWalls = () => {
  const players = useStore((state) => state.players);
  const playersKeys = [1, 2] as const;

  return (
    <>
      {playersKeys.map((playersKeys) => {
        const walls = players[playersKeys].wallsPlaced;

        return walls.map((wall, i) => (
          <Wall
            key={i}
            row={wall.row}
            col={wall.col}
            dir={wall.dir}
            player={playersKeys}
          />
        ));
      })}
    </>
  );
};

const PotentialWall = ({
  cell,
  isHovered,
  setHoveredCell,
}: {
  cell: PossibleWall;
  isHovered: boolean;
  setHoveredCell: React.Dispatch<React.SetStateAction<PossibleWall | null>>;
}) => {
  const placeWall = useStore((state) => state.placeWall);
  const currPlayer = useStore((state) => state.turn);
  const pos = getWallPos(cell);
  const isHoz = cell.dir === "hoz";

  return (
    <Box
      position={[
        pos.x + (isHoz ? -cellWidth / 2 - wallWidth / 2 : 0),
        -0.5,
        -pos.z + (!isHoz ? cellWidth / 2 + wallWidth / 2 : 0),
      ]}
      args={[1, 0.1, 0.1]}
      rotation={[0, !isHoz ? -Math.PI / 2 : 0, 0]}
      onClick={(e) => {
        if (!cell.valid) {
          return;
        }
        e.stopPropagation();
        placeWall(currPlayer, cell);
      }}
      onPointerEnter={(e) => {
        if (!cell.valid) {
          return;
        }
        e.stopPropagation();
        setHoveredCell(cell);
      }}
      onPointerLeave={(e) => {
        if (!cell.valid) {
          return;
        }
        e.stopPropagation();
        setHoveredCell(null);
      }}
    >
      <meshStandardMaterial
        color={isHovered ? "green" : cell.valid ? "gray" : "black"}
        opacity={0.7}
        transparent
      />
    </Box>
  );
};

const PotentialWalls = ({ available }: { available: PossibleWall[] }) => {
  const [hoveredCell, setHoveredCell] = useState<PossibleWall | null>(null);

  return (
    <>
      {available.map((cell, i) => {
        const isHovered =
          !!hoveredCell &&
          cell.col === hoveredCell.col &&
          cell.row === hoveredCell.row;
        const isHoveredVert =
          !!hoveredCell &&
          cell.dir === "vert" &&
          cell.col === hoveredCell.col &&
          cell.row === hoveredCell.row + 2;

        const isHoveredHoz =
          !!hoveredCell &&
          cell.dir === "hoz" &&
          cell.col === hoveredCell.col + 2 &&
          cell.row === hoveredCell.row;
        return (
          <PotentialWall
            key={i}
            cell={cell}
            isHovered={isHovered || isHoveredVert || isHoveredHoz}
            setHoveredCell={setHoveredCell}
          />
        );
      })}
    </>
  );
};

const SelectWallPlace = () => {
  //find all empty walls, then place a box.
  const board = useStore((state) => state.board);
  const turn = useStore((state) => state.turn);
  const player = useStore((state) => state.players[turn]);

  const available = useMemo(() => {
    return board.reduce((intialRow, currentRow, rowIndex) => {
      const cells = currentRow.reduce((initialCol, currentCol, colIndex) => {
        if (
          currentCol === false ||
          currentCol === null ||
          (rowIndex % 2 === 1 && colIndex % 2 === 1)
        ) {
          return initialCol;
        }

        let isValid = true;
        if (colIndex > max - 2 || rowIndex > max - 2) {
          isValid = false;
        } else {
          if (rowIndex % 2 === 1 && colIndex % 2 === 0) {
            if (
              board[rowIndex][colIndex + 1] !== true ||
              board[rowIndex][colIndex + 2] !== true
            ) {
              isValid = false;
            }
          }

          if (rowIndex % 2 === 0 && colIndex % 2 === 1) {
            if (
              board[rowIndex + 1][colIndex] !== true ||
              board[rowIndex + 2][colIndex] !== true
            ) {
              isValid = false;
            }
          }

          return [
            ...initialCol,
            {
              row: rowIndex,
              col: colIndex,
              dir: rowIndex % 2 === 1 ? ("hoz" as const) : ("vert" as const),
              valid: isValid,
            },
          ];
        }
        return [
          ...initialCol,
          {
            row: rowIndex,
            col: colIndex,
            dir: rowIndex % 2 === 1 ? ("hoz" as const) : ("vert" as const),
            valid: isValid,
          },
        ];
      }, [] as PossibleWall[]);
      return [...intialRow, ...cells];
    }, [] as PossibleWall[]);
  }, [board, player.wallsPlaced]);

  if (player.mode !== "wall") {
    return null;
  }

  return (
    <>
      <PotentialWalls available={available} />
    </>
  );
};

const Experience = () => {
  const placeWall = useStore((state) => state.placeWall);
  return (
    <>
      {/* Helpers */}
      <OrbitControls makeDefault target={[center, 0, -center]} />

      {/* Lights */}

      {/* Stage */}
      <group position={[0, 1, 0]}>
        <MoveTo />

        <Player player={1} />
        <Player player={2} />
      </group>
      <Box
        position={[0, 0.5, 0]}
        onClick={() => {
          // placeWall(1, { col: 1, row: 0, dir: "vert" });
          // placeWall(1, { col: 3, row: 0, dir: "vert" });
          // placeWall(1, { col: 5, row: 0, dir: "vert" });
          // placeWall(1, { col: 7, row: 0, dir: "vert" });
          // placeWall(1, { col: 9, row: 0, dir: "vert" });
          // placeWall(1, { col: 11, row: 0, dir: "vert" });
          // placeWall(1, { col: 13, row: 0, dir: "vert" });
          // placeWall(1, { col: 15, row: 0, dir: "vert" });
          // placeWall(1, { col: 1, row: 4, dir: "vert" });
          // placeWall(1, { col: 3, row: 4, dir: "vert" });
          // placeWall(1, { col: 5, row: 4, dir: "vert" });
          // placeWall(1, { col: 7, row: 4, dir: "vert" });
          // placeWall(1, { col: 9, row: 4, dir: "vert" });
          // placeWall(1, { col: 11, row: 4, dir: "vert" });
          // placeWall(1, { col: 13, row: 4, dir: "vert" });
          // placeWall(1, { col: 15, row: 4, dir: "vert" });
          // placeWall(1, { col: 1, row: 8, dir: "vert" });
          // placeWall(1, { col: 3, row: 8, dir: "vert" });
          // placeWall(1, { col: 5, row: 8, dir: "vert" });
          // placeWall(1, { col: 7, row: 8, dir: "vert" });
          // placeWall(1, { col: 9, row: 8, dir: "vert" });
          // placeWall(1, { col: 11, row: 8, dir: "vert" });
          // placeWall(1, { col: 13, row: 8, dir: "vert" });
          // placeWall(1, { col: 15, row: 8, dir: "vert" });
          // placeWall(1, { col: 1, row: 12, dir: "vert" });
          // placeWall(1, { col: 3, row: 12, dir: "vert" });
          // placeWall(1, { col: 5, row: 12, dir: "vert" });
          // placeWall(1, { col: 7, row: 12, dir: "vert" });
          // placeWall(1, { col: 9, row: 12, dir: "vert" });
          // placeWall(1, { col: 11, row: 12, dir: "vert" });
          // placeWall(1, { col: 13, row: 12, dir: "vert" });
          // placeWall(1, { col: 15, row: 12, dir: "vert" });
          // placeWall(2, { col: 0, row: 1, dir: "hoz" });
          // placeWall(2, { col: 0, row: 3, dir: "hoz" });
          // placeWall(2, { col: 0, row: 5, dir: "hoz" });
          // placeWall(2, { col: 0, row: 7, dir: "hoz" });
          // placeWall(2, { col: 0, row: 9, dir: "hoz" });
          // placeWall(2, { col: 0, row: 11, dir: "hoz" });
          // placeWall(2, { col: 0, row: 13, dir: "hoz" });
          // placeWall(2, { col: 0, row: 15, dir: "hoz" });
          // placeWall(2, { col: 4, row: 1, dir: "hoz" });
          // placeWall(2, { col: 4, row: 3, dir: "hoz" });
          // placeWall(2, { col: 4, row: 5, dir: "hoz" });
          // placeWall(2, { col: 4, row: 7, dir: "hoz" });
          // placeWall(2, { col: 4, row: 9, dir: "hoz" });
          // placeWall(2, { col: 4, row: 11, dir: "hoz" });
          // placeWall(2, { col: 4, row: 13, dir: "hoz" });
          // placeWall(2, { col: 4, row: 15, dir: "hoz" });
          // placeWall(2, { col: 8, row: 1, dir: "hoz" });
          // placeWall(2, { col: 8, row: 3, dir: "hoz" });
          // placeWall(2, { col: 8, row: 5, dir: "hoz" });
          // placeWall(2, { col: 8, row: 7, dir: "hoz" });
          // placeWall(2, { col: 8, row: 9, dir: "hoz" });
          // placeWall(2, { col: 8, row: 11, dir: "hoz" });
          // placeWall(2, { col: 8, row: 13, dir: "hoz" });
          // placeWall(2, { col: 8, row: 15, dir: "hoz" });
          // placeWall(2, { col: 14, row: 1, dir: "hoz" });
          // placeWall(2, { col: 14, row: 3, dir: "hoz" });
          // placeWall(2, { col: 14, row: 5, dir: "hoz" });
          // placeWall(2, { col: 14, row: 7, dir: "hoz" });
          // placeWall(2, { col: 14, row: 9, dir: "hoz" });
          // placeWall(2, { col: 14, row: 11, dir: "hoz" });
          // placeWall(2, { col: 14, row: 13, dir: "hoz" });
          // placeWall(2, { col: 14, row: 15, dir: "hoz" });
          // placeWall(2, { col: 3, row: 4, dir: "vert" });
          // placeWall(2, { col: 2, row: 3, dir: "hoz" });
          // placeWall(2, { col: 4, row: 1, dir: "hoz" });
          // placeWall(2, { col: 8, row: 1, dir: "hoz" });
        }}
      >
        <meshBasicMaterial color={"green"} />
      </Box>

      <group position={[0, 0.5, 0]}>
        <SelectWallPlace />
        <PlaceWalls />
      </group>

      {/* Floor */}
      <group position={[0, -0.02, 0]}>
        <Torus
          position={[center + cellWidth / 2, -0.01, -center - cellWidth / 2]}
          rotation={[-Math.PI / 2, 0, (45 * Math.PI) / 180]}
          args={[6.98, 0.1, 3, 4]}
        >
          <meshBasicMaterial color={"black"} />
        </Torus>
        <Plane
          args={[100, 100]}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, 0]}
        >
          <meshStandardMaterial color={"white"} />
        </Plane>
      </group>

      {/* <Grid
        position={[center + cellWidth / 2, -0.01, -center - cellWidth / 2]}
        args={[fsize, fsize]}
        // infiniteGrid
        // cellSize={cellWidth}
        sectionSize={cellWidth}
      /> */}
      <Environment preset="city" />
      <Stats showPanel={0} />
      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport
          axisColors={["#9d4b4b", "#2f7f4f", "#3b5b9d"]}
          labelColor="white"
        />
      </GizmoHelper>
    </>
  );
};

export const MyCanvas = () => (
  <Canvas shadows camera={{ position: [center, 4, 5], zoom: 1 }}>
    <Suspense>
      <Experience />
    </Suspense>
  </Canvas>
);

const UI = () => {
  const turn = useStore((state) => state.turn);
  const player = useStore((state) => state.players[turn]);
  const selectMode = useStore((state) => state.selectMode);
  const board = useStore((state) => state.board);

  return (
    <div className="absolute z-10 bottom-8 left-1/2 -translate-x-1/2 p-4 bg-white">
      <div className="flex gap-4">
        <div className="flex-1 flex flex-col">
          <div>Turn</div>
          <div>Player: {turn}</div>
        </div>
        <div className="flex-1 flex flex-col">
          <div>Mode</div>
          <div className="flex gap-4">
            <button
              className={player.mode === "move" ? "bg-red-900" : ""}
              onClick={() => selectMode(turn)}
            >
              Move
            </button>
            <button
              className={player.mode === "wall" ? "bg-red-900" : ""}
              onClick={() => selectMode(turn)}
            >
              Wall
            </button>
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          <div>Walls left</div>
          <div>{10 - player.wallsPlaced.length}</div>
        </div>
        <div className="flex-1 flex flex-col">
          <button
            onClick={() => start(board[0][0] as Cell, board[4][4] as Cell)}
          >
            start search
          </button>
        </div>
      </div>
    </div>
  );
};

const App = () => (
  <>
    <UI />
    <MyCanvas />
  </>
);

export default App;
