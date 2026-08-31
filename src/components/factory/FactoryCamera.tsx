"use client";

import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import type { FactoryAreaId } from "@/components/factory/simulation/ProductionState";
import {
  DEFAULT_FACTORY_CAMERA,
  FACTORY_AREA_MAP,
  getAreaCameraView,
  type CameraViewMode,
} from "@/components/factory/simulation/factoryLayout";
import { useFactory } from "@/components/factory/context/FactoryContext";

export type FactoryCameraHandle = {
  resetView: () => void;
  setDefaultView: () => void;
  flyTo: (
    position: [number, number, number],
    target: [number, number, number],
    duration?: number,
  ) => void;
  flyToArea: (id: FactoryAreaId, mode?: CameraViewMode) => void;
  playIntro: (onComplete?: () => void) => void;
};

type CameraControlsProps = {
  enabled?: boolean;
  autoRotate?: boolean;
};

type FlyState = {
  fromPos: THREE.Vector3;
  toPos: THREE.Vector3;
  fromTarget: THREE.Vector3;
  toTarget: THREE.Vector3;
  start: number;
  duration: number;
  onComplete?: () => void;
  interior?: boolean;
};

const MIN_FLY_HEIGHT = 20;
const ARC_PEAK = 8;

export const FactoryCamera = forwardRef<FactoryCameraHandle, CameraControlsProps>(
  function FactoryCamera({ enabled = true, autoRotate = false }, ref) {
    const controlsRef = useRef<React.ComponentRef<typeof OrbitControls> | null>(null);
    const { camera } = useThree();
    const flyRef = useRef<FlyState | null>(null);
    const [controlsEnabled, setControlsEnabled] = useState(true);

    const setDefaultView = () => {
      camera.position.set(...DEFAULT_FACTORY_CAMERA.position);
      if (controlsRef.current) {
        controlsRef.current.target.set(...DEFAULT_FACTORY_CAMERA.target);
        controlsRef.current.update();
      } else {
        camera.lookAt(new THREE.Vector3(...DEFAULT_FACTORY_CAMERA.target));
      }
      flyRef.current = null;
      setControlsEnabled(true);
    };

    const { state } = useFactory();
    const inRoom = state.sceneViewMode === "room";

    const flyTo = (
      position: [number, number, number],
      target: [number, number, number],
      duration = 1.2,
      onComplete?: () => void,
      interior = false,
    ) => {
      const controls = controlsRef.current;
      const currentTarget = controls
        ? controls.target.clone()
        : new THREE.Vector3(...DEFAULT_FACTORY_CAMERA.target);

      flyRef.current = {
        fromPos: camera.position.clone(),
        toPos: new THREE.Vector3(...position),
        fromTarget: currentTarget,
        toTarget: new THREE.Vector3(...target),
        start: performance.now(),
        duration: duration * 1000,
        onComplete,
        interior,
      };
      setControlsEnabled(false);
    };

    const flyToArea = (id: FactoryAreaId, mode: CameraViewMode = "cinematic") => {
      const area = FACTORY_AREA_MAP[id];
      const view = getAreaCameraView(area, mode);
      const duration = mode === "overview" ? 1 : mode === "room-interior" ? 1.1 : 1.4;
      flyTo(view.position, view.target, duration, undefined, mode === "room-interior");
    };

    const resetView = () => {
      flyTo(
        DEFAULT_FACTORY_CAMERA.position,
        DEFAULT_FACTORY_CAMERA.target,
        0.9,
      );
    };

    const playIntro = (onComplete?: () => void) => {
      setDefaultView();
      onComplete?.();
    };

    useImperativeHandle(
      ref,
      () => ({ resetView, setDefaultView, flyTo, flyToArea, playIntro }),
      [camera],
    );

    useEffect(() => {
      setDefaultView();
    }, [camera]);

    useFrame(() => {
      const fly = flyRef.current;
      if (!fly) return;

      const t = Math.min(1, (performance.now() - fly.start) / fly.duration);
      const eased = 1 - Math.pow(1 - t, 3);

      if (fly.interior) {
        camera.position.lerpVectors(fly.fromPos, fly.toPos, eased);
      } else {
        const flat = new THREE.Vector3().lerpVectors(fly.fromPos, fly.toPos, eased);
        const arc = Math.sin(Math.PI * eased) * ARC_PEAK;
        const safeY = Math.max(flat.y + arc, MIN_FLY_HEIGHT);
        camera.position.set(flat.x, safeY, flat.z);
      }

      const target = new THREE.Vector3().lerpVectors(
        fly.fromTarget,
        fly.toTarget,
        eased,
      );

      if (controlsRef.current) {
        controlsRef.current.target.copy(target);
        controlsRef.current.update();
      } else {
        camera.lookAt(target);
      }

      if (t >= 1) {
        camera.position.copy(fly.toPos);
        if (controlsRef.current) {
          controlsRef.current.target.copy(fly.toTarget);
          controlsRef.current.update();
        }
        fly.onComplete?.();
        flyRef.current = null;
        setControlsEnabled(true);
      }
    });

    return (
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enabled={enabled && controlsEnabled}
        target={DEFAULT_FACTORY_CAMERA.target}
        enableDamping
        dampingFactor={0.08}
        enablePan
        enableZoom
        enableRotate
        screenSpacePanning
        rotateSpeed={0.75}
        zoomSpeed={1.2}
        panSpeed={1.2}
        minDistance={inRoom ? 1.2 : 8}
        maxDistance={inRoom ? 24 : 130}
        minPolarAngle={inRoom ? 0.02 : 0.08}
        maxPolarAngle={inRoom ? Math.PI / 2.01 : Math.PI / 2.05}
        autoRotate={autoRotate && controlsEnabled}
        autoRotateSpeed={0.28}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.PAN,
          RIGHT: THREE.MOUSE.PAN,
        }}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN,
        }}
        keyPanSpeed={18}
        keys={{
          LEFT: "ArrowLeft",
          UP: "ArrowUp",
          RIGHT: "ArrowRight",
          BOTTOM: "ArrowDown",
        }}
      />
    );
  },
);
