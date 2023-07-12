import * as THREE from "three";
import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, ThreeElements } from "@react-three/fiber";
import {
  Box,
  Cylinder,
  Environment,
  GizmoHelper,
  GizmoViewport,
  Grid,
  OrbitControls,
  Plane,
  Tetrahedron,
} from "@react-three/drei";
import {
  CuboidCollider,
  CylinderCollider,
  Physics,
  RigidBody,
} from "@react-three/rapier";
import { useControls } from "leva";

// function Box(props: ThreeElements["mesh"]) {
//   const meshRef = useRef<THREE.Mesh>(null!);
//   const [hovered, setHover] = useState(false);
//   const [active, setActive] = useState(false);

//   useFrame((state, delta) => (meshRef.current.rotation.x += delta));

//   return (
//     <mesh
//       {...props}
//       ref={meshRef}
//       scale={active ? 1.5 : 1}
//       onClick={(event) => setActive(!active)}
//       onPointerOver={(event) => setHover(true)}
//       onPointerOut={(event) => setHover(false)}
//     >
//       <boxGeometry args={[1, 1, 1]} />
//       <meshStandardMaterial color={hovered ? "hotpink" : "orange"} />
//     </mesh>
//   );
// }

const PizzaBase = () => {
  return (
    <RigidBody colliders={false} type="fixed" position={[0, 0, 0]}>
      <CylinderCollider args={[0.3, 10]} />
      <Cylinder args={[10, 10, 0.4, 20]}>
        <meshStandardMaterial color={"orange"} />
      </Cylinder>
    </RigidBody>
  );
};

const getRandom = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const Squares = () => {
  // const meshRef = useRef<THREE.Mesh>(null!);

  const randPos = [
    getRandom(-5, 5),
    getRandom(9, 11),
    getRandom(-5, 5),
  ] as const;

  return (
    <RigidBody position={randPos} colliders="cuboid">
      <Box args={[1, 0.1, 1]}>
        <meshStandardMaterial color={"red"} />
      </Box>
    </RigidBody>
  );
};

const Triangles = () => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [enabled, setEnabled] = useState(true);

  const randPos = [
    getRandom(-5, 5),
    getRandom(2, 11),
    getRandom(-5, 5),
  ] as const;

  if (!enabled) {
    return null;
  }

  return (
    <RigidBody
      position={randPos}
      colliders="trimesh"
      onIntersectionEnter={(other) => {
        if (other.rigidBodyObject?.name === "floor") {
          setEnabled(false);
        }
      }}
    >
      <Tetrahedron args={[1, 0]} ref={meshRef}>
        <meshStandardMaterial color={"red"} />
      </Tetrahedron>
    </RigidBody>
  );
};

const Circles = () => {
  // const meshRef = useRef<THREE.Mesh>(null!);

  const randPos = [
    getRandom(-5, 5),
    getRandom(9, 11),
    getRandom(-5, 5),
  ] as const;

  return (
    <RigidBody position={randPos} colliders={false}>
      <CylinderCollider args={[0.1, 1]} />
      <Cylinder args={[1, 1, 0.1, 10]}>
        <meshStandardMaterial color={"red"} />
      </Cylinder>
    </RigidBody>
  );
};

const Experience = () => {
  const controls = useControls({
    squares: { value: 0, min: 0, max: 3, step: 1 },
    triangles: { value: 0, min: 0, max: 3, step: 1 },
    circles: { value: 0, min: 0, max: 3, step: 1 },
  });

  const getSize = (thing: "squares" | "circles" | "triangles") => {
    const multiplier = 8;

    const amount = controls[thing] * multiplier;

    return Array(amount)
      .fill("")
      .map((_, i) => i);
  };

  const squareSize = useMemo(() => getSize("squares"), [controls.squares]);
  const circleSize = useMemo(() => getSize("circles"), [controls.circles]);
  const triangleSize = useMemo(
    () => getSize("triangles"),
    [controls.triangles]
  );

  return (
    <>
      {/* Helpers */}
      <OrbitControls makeDefault />
      <Grid position={[0, -0.01, 0]} args={[10.5, 10.5]} />

      {/* Lights */}
      <ambientLight intensity={1} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />

      {/* Stage */}
      {squareSize.length > 0 && squareSize.map((i) => <Squares key={i} />)}
      {triangleSize.length > 0 &&
        triangleSize.map((i) => <Triangles key={i} />)}
      {circleSize.length > 0 && circleSize.map((i) => <Circles key={i} />)}

      <PizzaBase />

      {/* Floor */}
      <RigidBody type="fixed" colliders={false} name="floor">
        <CuboidCollider args={[50, 0.1, 50]} position={[0, -3.5, 0]} sensor />
        <Plane
          args={[100, 100]}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -1.5, 0]}
        >
          <meshStandardMaterial color={"white"} />
        </Plane>
      </RigidBody>

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
  <Canvas shadows camera={{ position: [10, 10, 10] }}>
    <Suspense>
      <Physics debug>
        <Experience />
      </Physics>
    </Suspense>
  </Canvas>
);

const App = () => (
  <>
    <MyCanvas />
  </>
);

export default App;
