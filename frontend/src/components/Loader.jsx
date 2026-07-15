import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

const SEGMENTS = 300;

function PythonHead() {
  const skinMaterial = (
    <meshPhysicalMaterial 
      color="#A31616" 
      metalness={0.9} 
      roughness={0.1} 
      clearcoat={1.0} 
      emissive="#2C1414" 
      emissiveIntensity={0.2}
    />
  );

  // Global scale multiplier to match the thickest part of the InstancedMesh body
  return (
    <group scale={[2.5, 2.5, 2.5]}>
      {/* 1. Compound Geometry: The Main Skull 
          Flattened on Y, elongated on Z, wider at the back.
          Offset forward (+Z) so the pivot [0,0,0] sits at the neck connection. */}
      <mesh position={[0, 0, 1.2]} scale={[1.5, 0.6, 2.2]}>
        <sphereGeometry args={[0.6, 32, 32]} />
        {skinMaterial}
      </mesh>

      {/* 2. Brow Ridges: Elongated spheres top-side */}
      <mesh position={[0.45, 0.35, 1.5]} scale={[0.6, 0.6, 1.8]} rotation={[0.1, 0.2, 0.1]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        {skinMaterial}
      </mesh>
      <mesh position={[-0.45, 0.35, 1.5]} scale={[0.6, 0.6, 1.8]} rotation={[0.1, -0.2, -0.1]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        {skinMaterial}
      </mesh>

      {/* 3. The Eyes: Tiny spheres just below the brow ridges */}
      <mesh position={[0.6, 0.15, 1.8]} rotation={[0, Math.PI / 6, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#000000" metalness={1.0} roughness={0} emissive="#330000" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[-0.6, 0.15, 1.8]} rotation={[0, -Math.PI / 6, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#000000" metalness={1.0} roughness={0} emissive="#330000" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

function BiologicalSnake() {
  const meshRef = useRef();
  const headRef = useRef();

  const instancedGeoRef = useRef();
  const instancedMatRef = useRef();

  // 4. Pre-allocate vectors and objects outside the loop
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const headPos = useMemo(() => new THREE.Vector3(), []);
  const lookAtPos = useMemo(() => new THREE.Vector3(), []);
  
  // 2. Persistent History Buffer
  const MAX_HISTORY = 400; // Enough for 300 segments with spacing
  const historyRef = useRef(new Array(MAX_HISTORY).fill(null).map(() => new THREE.Vector3()));
  
  // 3. Segment Current Positions for across-frame Lerp
  const currentPositionsRef = useRef(new Array(SEGMENTS).fill(null).map(() => new THREE.Vector3()));
  const isInitialized = useRef(false);

  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;

  const curve = useMemo(() => {
    const orbitRadius = Math.max(3.0, Math.min(5.2, viewportWidth / 320));
    const verticalLift = Math.max(0.35, Math.min(0.75, viewportHeight / 1500));

    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-orbitRadius, 0.0, orbitRadius * 0.65),
      new THREE.Vector3(-orbitRadius * 0.55, verticalLift, orbitRadius * 1.06),
      new THREE.Vector3(0.0, 0.0, orbitRadius * 1.4),
      new THREE.Vector3(orbitRadius * 0.55, -verticalLift, orbitRadius * 1.05),
      new THREE.Vector3(orbitRadius, 0.0, -orbitRadius * 0.48),
      new THREE.Vector3(orbitRadius * 0.55, verticalLift, -orbitRadius * 1.02),
      new THREE.Vector3(0.0, 0.0, -orbitRadius * 1.38),
      new THREE.Vector3(-orbitRadius * 0.55, -verticalLift, -orbitRadius * 1.0),
    ], true);
  }, [viewportWidth, viewportHeight]);

  useEffect(() => {
    return () => {
      if (instancedGeoRef.current) instancedGeoRef.current.dispose();
      if (instancedMatRef.current) instancedMatRef.current.dispose();
      if (meshRef.current) meshRef.current.dispose();
    };
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const history = historyRef.current;
    const currentPositions = currentPositionsRef.current;

    // 1. Leader (Head) movement
    const headT = (time * 0.15) % 1.0;
    curve.getPointAt(headT, headPos);
    headPos.y += Math.sin(time * 5.0) * 0.15; // Organic head bob

    if (!isInitialized.current) {
      const curveLength = curve.getLength();
      const tStep = 0.04 / curveLength;
      const speed = 0.15 * curveLength;
      for (let i = 0; i < MAX_HISTORY; i++) {
        const pastT = (headT - i * tStep + 10.0) % 1.0;
        curve.getPointAt(pastT, history[i]);
        const pastTime = time - (i * 0.04) / speed;
        history[i].y += Math.sin(pastTime * 5.0) * 0.15;
      }
      for (let i = 0; i < SEGMENTS; i++) {
        currentPositions[i].copy(history[i]);
      }
      isInitialized.current = true;
    }

    // SPATIAL History Buffer (Frame-rate Independent)
    // Only record history when the head has traveled a specific distance
    const dist = headPos.distanceTo(history[0]);
    if (dist > 0.04) {
      for (let i = MAX_HISTORY - 1; i > 0; i--) {
        history[i].copy(history[i - 1]);
      }
      history[0].copy(headPos);
    }

    for (let i = 0; i < SEGMENTS; i++) {
      // Direct 1-to-1 index mapping since history is now uniformly spaced by distance
      const historyIndex = i;
      const targetPos = history[Math.min(historyIndex, MAX_HISTORY - 1)];

      if (i === 0) {
        currentPositions[0].copy(headPos);
      } else {
        // 3. True Lerp & Drag Logic (maintaining state across frames)
        currentPositions[i].lerp(targetPos, 0.3);
      }
      
      dummy.position.copy(currentPositions[i]);

      // 5. Biological Anatomy (Head Tapering)
      const scale = Math.max(0.01, 0.12 - (i / SEGMENTS) * 0.11);
      dummy.scale.set(scale, scale, scale);

      // Dynamic Orientation
      if (i > 0) {
        const lookIndex = Math.max(0, i - 2);
        lookAtPos.copy(currentPositions[lookIndex]);
        dummy.lookAt(lookAtPos);
      } else {
        // Head looks forward along curve
        const futureT = (headT + 0.01) % 1.0;
        curve.getPointAt(futureT, lookAtPos);
        lookAtPos.y += Math.sin((time + 0.05) * 5.0) * 0.15;
        dummy.lookAt(lookAtPos);
      }

      dummy.updateMatrix();

      if (meshRef.current) {
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }

      if (i === 0 && headRef.current) {
        headRef.current.position.copy(dummy.position);
        headRef.current.quaternion.copy(dummy.quaternion);
        
        const pulse = 1.0 + Math.sin(time * 4.2) * 0.05;
        const baseHeadScale = scale * 1.24 * pulse;
        headRef.current.scale.set(baseHeadScale, baseHeadScale, baseHeadScale);
      }
    }
    
    if (meshRef.current) {
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      <instancedMesh ref={meshRef} args={[null, null, SEGMENTS]}>
        <sphereGeometry ref={instancedGeoRef} args={[1, 16, 16]} />
        <meshPhysicalMaterial 
          ref={instancedMatRef}
          color="#A31616" 
          metalness={0.9}
          roughness={0.1}
          clearcoat={1.0}
          emissive="#2C1414"
          emissiveIntensity={0.2}
        />
      </instancedMesh>
      
      <group ref={headRef}>
        <PythonHead />
      </group>
    </group>
  );
}

const BrandText = React.memo(() => {
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const isMobile = viewportWidth < 768;
  
  const dynamicFontSize = isMobile ? 0.4 : 0.8;
  const dynamicLetterSpacing = isMobile ? 0.15 : 0.25;
  const topY = isMobile ? 0.35 : 0.7;
  const bottomY = isMobile ? -0.3 : -0.6;
  const subtitleFontSize = dynamicFontSize * 0.45;

  return (
    <group>
      <Text position={[0, topY, 0]} fontSize={dynamicFontSize} letterSpacing={-0.1} color="#8B0000" anchorX="center" anchorY="middle" fontWeight="900" strokeWidth={0.05} strokeColor="#8B0000">
        $$$
      </Text>
      <Text position={[0, bottomY, 0]} fontSize={subtitleFontSize} letterSpacing={dynamicLetterSpacing} color="#E0115F" anchorX="center" anchorY="middle" fontWeight="bold">
        SWAG SEASON
      </Text>
    </group>
  );
});

// ----------------------------------------------------------------------
// CAMERA RESPONSIVENESS & MANUAL RESIZE OBSERVER
// ----------------------------------------------------------------------
function CameraController() {
  const { camera, gl } = useThree();

  useEffect(() => {
    const handleResize = () => {
      const wrapper = gl.domElement.parentElement;
      const rect = wrapper?.getBoundingClientRect();
      const w = Math.max(rect?.width || window.innerWidth || 1024, 1);
      const h = Math.max(rect?.height || window.innerHeight || 768, 1);

      camera.position.z = w < 768 ? 12 : 9;
      camera.fov = w < 768 ? 50 : 38;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      gl.setSize(w, h, false);
      gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      gl.domElement.style.width = '100%';
      gl.domElement.style.height = '100%';
      gl.domElement.style.display = 'block';
      gl.domElement.style.position = 'absolute';
      gl.domElement.style.inset = '0';
    };

    handleResize();

    const resizeObserver = new ResizeObserver(handleResize);
    const wrapper = gl.domElement.parentElement;
    if (wrapper) {
      resizeObserver.observe(wrapper);
    }

    window.addEventListener('resize', handleResize);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [camera, gl]);

  return null;
}

export default function Loader() {
  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-[#2C1414]">
      <div className="absolute inset-0 z-10 pointer-events-none">
        <Canvas
          camera={{ position: [0, 0, 8], fov: 40 }}
          className="absolute inset-0"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: 'transparent' }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          dpr={[1, 2]}
          onCreated={({ gl }) => {
            gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
          }}
        >
          <CameraController />
          <ambientLight intensity={0.5} color="#ffffff" />
          <spotLight position={[5, 10, 10]} intensity={3} angle={0.4} penumbra={1} color="#EAEAEA" />
          <directionalLight position={[-10, -10, -5]} intensity={4} color="#A31616" />

          <BrandText />
          <BiologicalSnake />
        </Canvas>
      </div>

      <span className="text-[10px] uppercase tracking-widest font-medium text-[#EAEAEA]/30 absolute bottom-[5vh] z-20 animate-pulse">
        LOADING EXPERIENCE
      </span>
    </div>
  );
}
