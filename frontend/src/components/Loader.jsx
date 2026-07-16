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

  const dummyPos = useMemo(() => new THREE.Vector3(), []);
  const lookAtPos = useMemo(() => new THREE.Vector3(), []);

  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;

  const basePoints = useMemo(() => {
    const orbitRadius = Math.max(3.0, Math.min(5.2, viewportWidth / 320));
    const verticalLift = Math.max(0.35, Math.min(0.75, viewportHeight / 1500));
    return [
      new THREE.Vector3(-orbitRadius, 0.0, orbitRadius * 0.65),
      new THREE.Vector3(-orbitRadius * 0.55, verticalLift, orbitRadius * 1.06),
      new THREE.Vector3(0.0, 0.0, orbitRadius * 1.4),
      new THREE.Vector3(orbitRadius * 0.55, -verticalLift, orbitRadius * 1.05),
      new THREE.Vector3(orbitRadius, 0.0, -orbitRadius * 0.48),
      new THREE.Vector3(orbitRadius * 0.55, verticalLift, -orbitRadius * 1.02),
      new THREE.Vector3(0.0, 0.0, -orbitRadius * 1.38),
      new THREE.Vector3(-orbitRadius * 0.55, -verticalLift, -orbitRadius * 1.0),
    ];
  }, [viewportWidth, viewportHeight]);

  const baseCurve = useMemo(() => new THREE.CatmullRomCurve3(basePoints.map(p => p.clone()), true), [basePoints]);
  
  const bodyPoints = useMemo(() => new Array(31).fill(null).map(() => new THREE.Vector3()), []);
  const initialSubCurve = useMemo(() => {
    for (let i = 0; i <= 30; i++) {
      let t = -(i / 30) * 0.4;
      if (t < 0) t += 1.0;
      baseCurve.getPointAt(t, bodyPoints[i]);
    }
    return new THREE.CatmullRomCurve3(bodyPoints, false);
  }, [baseCurve, bodyPoints]);

  useEffect(() => {
    return () => {
      if (meshRef.current && meshRef.current.geometry) {
        meshRef.current.geometry.dispose();
      }
    };
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const headT = (time * 0.2) % 1.0;
    const snakeLength = 0.4;

    // 1. Dynamic Sub-Curve Generation
    for (let i = 0; i <= 30; i++) {
      let t = headT - (i / 30) * snakeLength;
      if (t < 0) t += 1.0;
      
      baseCurve.getPointAt(t, bodyPoints[i]);
      bodyPoints[i].y += Math.sin(time * 5.0 - i * 0.5) * 0.15;
    }

    const subCurve = new THREE.CatmullRomCurve3(bodyPoints, false);

    // 2. Apply to TubeGeometry explicitly
    if (meshRef.current) {
      const oldGeo = meshRef.current.geometry;
      const newGeo = new THREE.TubeGeometry(subCurve, 64, 0.12, 8, false);
      meshRef.current.geometry = newGeo;
      if (oldGeo) oldGeo.dispose();
    }

    // 3. Head Integration tracking headT
    if (headRef.current) {
      baseCurve.getPointAt(headT, dummyPos);
      dummyPos.y += Math.sin(time * 5.0) * 0.15; // Match front of subCurve
      
      const tangent = baseCurve.getTangentAt(headT);
      lookAtPos.copy(dummyPos).add(tangent);

      headRef.current.position.copy(dummyPos);
      headRef.current.lookAt(lookAtPos);
      
      const pulse = 1.0 + Math.sin(time * 4.2) * 0.05;
      const baseHeadScale = 0.12 * 1.24 * pulse;
      headRef.current.scale.set(baseHeadScale, baseHeadScale, baseHeadScale);
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <tubeGeometry args={[initialSubCurve, 64, 0.12, 8, false]} />
        <meshPhysicalMaterial 
          color="#A31616" 
          metalness={0.9}
          roughness={0.1}
          clearcoat={1.0}
          emissive="#2C1414"
          emissiveIntensity={0.2}
          onBeforeCompile={(shader) => {
            shader.vertexShader = shader.vertexShader.replace(
              '#include <begin_vertex>',
              `
              #include <begin_vertex>
              
              // uv.x goes from 0 (head) to 1 (tail).
              // smoothstep creates a smooth curve starting at 50% down the body, reaching max pinch at the tip.
              float taperEffect = smoothstep(0.5, 1.0, uv.x);
              
              // Squeeze the vertex inward along its normal. 
              // Using 0.12 to match the exact tube radius.
              transformed -= objectNormal * (0.12 * taperEffect);
              `
            );
          }}
        />
      </mesh>
      
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
      <Text 
        position={[0, topY, 0]} 
        fontSize={dynamicFontSize} 
        letterSpacing={-0.05} 
        color="#8B0000" 
        anchorX="center" 
        anchorY="middle" 
        fontWeight={900}
        fontStyle="bold"
        strokeWidth={0.2} 
        strokeColor="#8B0000" 
        scale={[4.5, 1.2, 1]}
        depthTest={true}
        depthOffset={2}
        bevelEnabled={true}
        bevelSize={0.05}
      >
        {" $ $ $ "}
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
    <div className="w-full h-full relative overflow-hidden">
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

          <group position={[0, 0, 0]}>
            <BrandText />
            <BiologicalSnake />
          </group>
        </Canvas>
      </div>

      <span className="text-[10px] uppercase tracking-widest font-medium text-[#EAEAEA]/30 absolute bottom-[5%] z-20 animate-pulse">
        LOADING EXPERIENCE
      </span>
    </div>
  );
}
