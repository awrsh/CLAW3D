"use client";

import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import { DEFAULT_CAMERA } from "@/components/laboratory/sceneConfig";

export type CameraControlsHandle = {
  resetView: () => void;
};

type CameraControlsProps = {
  enabled?: boolean;
  autoRotate?: boolean;
};

export const CameraControls = forwardRef<CameraControlsHandle, CameraControlsProps>(
  function CameraControls({ enabled = true, autoRotate = false }, ref) {
    const controlsRef = useRef<React.ComponentRef<typeof OrbitControls> | null>(null);
    const { camera } = useThree();

    const resetView = () => {
      camera.position.set(...DEFAULT_CAMERA.position);
      if (controlsRef.current) {
        controlsRef.current.target.set(...DEFAULT_CAMERA.target);
        controlsRef.current.update();
      } else {
        camera.lookAt(new THREE.Vector3(...DEFAULT_CAMERA.target));
      }
    };

    useImperativeHandle(ref, () => ({ resetView }), [camera]);

    useEffect(() => {
      camera.position.set(...DEFAULT_CAMERA.position);
      camera.lookAt(new THREE.Vector3(...DEFAULT_CAMERA.target));
    }, [camera]);

    return (
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enabled={enabled}
        target={DEFAULT_CAMERA.target}
        enableDamping
        dampingFactor={0.06}
        rotateSpeed={0.45}
        zoomSpeed={0.65}
        panSpeed={0.55}
        minDistance={4}
        maxDistance={28}
        minPolarAngle={0.25}
        maxPolarAngle={Math.PI / 2.05}
        autoRotate={autoRotate}
        autoRotateSpeed={0.35}
      />
    );
  },
);
