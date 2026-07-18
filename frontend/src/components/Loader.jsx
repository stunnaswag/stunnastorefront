import React, { useRef, useMemo, useEffect, useImperativeHandle } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, Text3D, Center } from '@react-three/drei';
import * as THREE from 'three';

const BASE_Y = 0;

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

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const wave = Math.sin(time * 1.5) * 0.15;
    
    if (sharedGroupRef.current) {
      sharedGroupRef.current.position.y = BASE_Y + wave;
    }
  });

  return (
    <group ref={sharedGroupRef}>
      <BrandText />
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
