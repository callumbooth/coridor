import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Box,
  Environment,
  GizmoHelper,
  GizmoViewport,
  Grid,
  OrbitControls,
  Plane,
} from "@react-three/drei";

import { CoOrd, Wall as IWall, cells, useStore } from "./store";

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
  const xCount = cell.col < 2 ? 1 : (cell.col + 1) / 2;

  const zCount = cell.row < 2 ? 1 : (cell.row + 1) / 2;

  const normalise = cellWidth / 2 - wallWidth / 2;

  const x = xCount * cellWidth + xCount * wallWidth + normalise;
  const z = zCount * cellWidth + zCount * wallWidth + normalise;

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

  // console.log(cell.col, max - 1, board);
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

const PlaceWall = () => {
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
        <PlaceWall />

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

          placeWall(2, { col: 0, row: 1, dir: "hoz" });
          placeWall(2, { col: 0, row: 3, dir: "hoz" });
          placeWall(2, { col: 0, row: 5, dir: "hoz" });
          placeWall(2, { col: 0, row: 7, dir: "hoz" });
        }}
      >
        <meshBasicMaterial color={"green"} />
      </Box>

      <group position={[0, 0.5, 0]}>
        <PlaceWall />
      </group>

      {/* Floor */}
      <group position={[0, -0.02, 0]}>
        <Plane
          args={[100, 100]}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, 0]}
        >
          <meshStandardMaterial color={"white"} />
        </Plane>
      </group>

      <Grid
        position={[center, -0.01, -center]}
        args={[fsize, fsize]}
        // infiniteGrid
        // cellSize={cellWidth}
        sectionSize={cellWidth}
      />
      <Environment preset="city" />
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

const App = () => (
  <>
    <MyCanvas />
  </>
);

export default App;
