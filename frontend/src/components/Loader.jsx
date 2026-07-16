import React, { useRef, useMemo, useEffect, useImperativeHandle } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, Text3D, Center } from '@react-three/drei';
import * as THREE from 'three';

const SEGMENTS = 350;
const BASE_Y = 0;

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

  return (
    <group scale={[2.5, 2.5, 2.5]}>
      <mesh position={[0, 0, 1.2]} scale={[1.5, 0.6, 2.2]}>
        <sphereGeometry args={[0.6, 32, 32]} />
        {skinMaterial}
      </mesh>

      <mesh position={[0.45, 0.35, 1.5]} scale={[0.6, 0.6, 1.8]} rotation={[0.1, 0.2, 0.1]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        {skinMaterial}
      </mesh>
      <mesh position={[-0.45, 0.35, 1.5]} scale={[0.6, 0.6, 1.8]} rotation={[0.1, -0.2, -0.1]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        {skinMaterial}
      </mesh>

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

const BiologicalSnake = React.memo(React.forwardRef((props, ref) => {
  const meshRef = useRef();
  const headRef = useRef();

  const instancedGeoRef = useRef();
  const instancedMatRef = useRef();
  const { size } = useThree();

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const viewportWidth = size.width || 1024;
  const viewportHeight = size.height || 768;

  const curve = useMemo(() => {
    const orbitRadius = Math.max(3.0, Math.min(5.2, viewportWidth / 320));
    const verticalLift = Math.max(0.35, Math.min(0.75, viewportHeight / 1500));

    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-orbitRadius, 0.0, 0.2),
      new THREE.Vector3(-orbitRadius * 0.55, verticalLift, 0.4),
      new THREE.Vector3(0.0, 0.0, 0.5),
      new THREE.Vector3(orbitRadius * 0.55, -verticalLift, 0.4),
      new THREE.Vector3(orbitRadius, 0.0, -0.2),
      new THREE.Vector3(orbitRadius * 0.55, verticalLift, -0.4),
      new THREE.Vector3(0.0, 0.0, -0.5),
      new THREE.Vector3(-orbitRadius * 0.55, -verticalLift, -0.4),
    ], true);
  }, [viewportWidth, viewportHeight]);

  useEffect(() => {
    return () => {
      if (instancedGeoRef.current) instancedGeoRef.current.dispose();
      if (instancedMatRef.current) instancedMatRef.current.dispose();
      if (meshRef.current) meshRef.current.dispose();
    };
  }, []);

  useImperativeHandle(ref, () => ({
    update: (time) => {
      for (let i = 0; i < SEGMENTS; i++) {
        const segmentT = i / (SEGMENTS - 1);
        const pathT = (segmentT * 0.62 + time * 0.18) % 1.0;
        const pos = curve.getPointAt(pathT);

        const slitherWave = Math.sin(pathT * Math.PI * 8 - time * 4.2) * 0.16;
        pos.y += slitherWave;

        const profileArch = Math.sin(segmentT * Math.PI);
        const scale = 0.06 + segmentT * 0.09 + profileArch * 0.04;

        dummy.position.copy(pos);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();

        if (meshRef.current) {
          meshRef.current.setMatrixAt(i, dummy.matrix);
        }

        if (i === SEGMENTS - 1 && headRef.current) {
          headRef.current.position.copy(pos);

          const pulse = 1.0 + Math.sin(time * 4.2) * 0.05;
          const baseHeadScale = scale * 1.24 * pulse;
          headRef.current.scale.set(baseHeadScale, baseHeadScale, baseHeadScale);

          const tangent = curve.getTangentAt(pathT);
          const lookTarget = pos.clone().add(tangent);

          const futurePathT = (pathT + 0.01) % 1.0;
          const futureSlitherWave = Math.sin(futurePathT * Math.PI * 8 - time * 4.2) * 0.16;
          const futureBaseY = curve.getPointAt(futurePathT).y;

          lookTarget.y = futureBaseY + futureSlitherWave;
          headRef.current.lookAt(lookTarget);
        }
      }
      
      if (meshRef.current) {
        meshRef.current.instanceMatrix.needsUpdate = true;
      }
    }
  }));

  return (
    <group {...props}>
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
}));

const BrandText = React.memo(() => {
  const { size } = useThree();
  const viewportWidth = size.width || 1024;
  const isMobile = viewportWidth < 768;
  const groupRef = useRef();

  // Gentle idle rotation to show off the true 3D depth
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(time * 1.5) * 0.15;
      groupRef.current.rotation.x = Math.sin(time * 0.8) * 0.05;
    }
  });

  const dynamicFontSize = isMobile ? 1.2 : 1.8;
  // Apply a slight horizontal stretch to replicate the image's bounding box
  const stretchScale = [1.5, 1, 1];

  return (
    <group ref={groupRef} scale={stretchScale} position={[0, 0, 0]}>
      <Center>
        <Text3D
          font="/fonts/helvetiker_bold.typeface.json"
          size={dynamicFontSize}
          height={0.4}
          curveSegments={12}
          bevelEnabled={true}
          bevelThickness={0.04}
          bevelSize={0.03}
          bevelOffset={0}
          bevelSegments={5}
        >
          {`$$$`}
          <meshPhysicalMaterial 
            color="#A31616" 
            metalness={0.5} 
            roughness={0.2} 
            clearcoat={0.8}
            emissive="#A31616"
            emissiveIntensity={0.2}
          />
        </Text3D>
      </Center>
    </group>
  );
});

function SharedScene() {
  const sharedGroupRef = useRef();
  const snakeLogicRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const wave = Math.sin(time * 1.5) * 0.15;
    
    if (sharedGroupRef.current) {
      sharedGroupRef.current.position.y = BASE_Y + wave;
    }
    
    if (snakeLogicRef.current && snakeLogicRef.current.update) {
      snakeLogicRef.current.update(time);
    }
  });

  return (
    <group ref={sharedGroupRef}>
      <BrandText />
      <BiologicalSnake ref={snakeLogicRef} />
    </group>
  );
}

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

          <SharedScene />
        </Canvas>
      </div>
      
      <span className="text-[10px] uppercase tracking-widest font-medium text-[#EAEAEA]/30 absolute bottom-[5vh] z-20 animate-pulse">
        LOADING EXPERIENCE
      </span>
    </div>
  );
}
