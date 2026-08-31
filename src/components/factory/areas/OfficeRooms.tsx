"use client";

import { memo } from "react";
import { ControlScreen } from "@/components/factory/equipment/shared";
import { WallSconce } from "@/components/factory/FactoryRoomLighting";
import { FACTORY_COLORS } from "@/components/factory/simulation/factoryLayout";

function OfficeDesk({
  position,
  rotation = 0,
  wide = false,
}: {
  position: [number, number, number];
  rotation?: number;
  wide?: boolean;
}) {
  const w = wide ? 1.8 : 1.2;
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.06, 0.65]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.75} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * w) / 2.3, 0.36, 0.2]} castShadow>
          <boxGeometry args={[0.06, 0.72, 0.06]} />
          <meshStandardMaterial color="#64748b" roughness={0.55} />
        </mesh>
      ))}
      <mesh position={[0, 0.78, -0.1]} castShadow>
        <boxGeometry args={[0.35, 0.22, 0.04]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
      </mesh>
    </group>
  );
}

function OfficeChair({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[0.42, 0.08, 0.42]} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.75, -0.18]} castShadow>
        <boxGeometry args={[0.42, 0.55, 0.06]} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>
    </group>
  );
}

function FilingCabinet({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} castShadow>
      <boxGeometry args={[0.5, 1.4, 0.45]} />
      <meshStandardMaterial color="#94a3b8" roughness={0.65} metalness={0.2} />
    </mesh>
  );
}

function MeetingTable({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.08, 1.1]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
      </mesh>
      {[
        [-0.9, 0.35, 0.35],
        [0.9, 0.35, 0.35],
        [-0.9, 0.35, -0.35],
        [0.9, 0.35, -0.35],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.75, 8]} />
          <meshStandardMaterial color="#64748b" metalness={0.4} roughness={0.45} />
        </mesh>
      ))}
    </group>
  );
}

function RoomNameplate({
  position,
  color,
}: {
  position: [number, number, number];
  color: string;
}) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[1.4, 0.32, 0.04]} />
        <meshStandardMaterial color={color} roughness={0.65} />
      </mesh>
    </group>
  );
}

function DocumentTray({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.35, 0.12, 0.25]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.85} />
      </mesh>
      {[0, 0.04, 0.08].map((y, i) => (
        <mesh key={i} position={[0, 0.08 + y, 0]}>
          <boxGeometry args={[0.3, 0.02, 0.2]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function BatchRecordCabinet({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.9, 1.6, 0.4]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.5, 0.21]}>
        <planeGeometry args={[0.7, 0.25]} />
        <meshStandardMaterial color="#2563eb" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.21]}>
        <planeGeometry args={[0.7, 0.25]} />
        <meshStandardMaterial color="#0d9488" roughness={0.6} />
      </mesh>
    </group>
  );
}

/** Plant Manager / Executive office */
export const ManagerOfficeArea = memo(function ManagerOfficeArea() {
  return (
    <group position={[-36, 0, 24]}>
      <RoomNameplate position={[0, 2.8, 5.5]} color="#1e3a5f" />
      <MeetingTable position={[0, 0, -1]} />
      <OfficeChair position={[-1.2, 0, 0.5]} rotation={Math.PI} />
      <OfficeChair position={[1.2, 0, 0.5]} rotation={Math.PI} />
      <OfficeChair position={[-1.2, 0, -2.2]} rotation={0.3} />
      <OfficeChair position={[1.2, 0, -2.2]} rotation={-0.3} />
      <OfficeDesk position={[-3.5, 0, 2]} rotation={0.2} wide />
      <OfficeChair position={[-3.5, 0, 3.2]} rotation={Math.PI} />
      <OfficeDesk position={[3.5, 0, 2]} rotation={-0.15} />
      <OfficeChair position={[3.5, 0, 3.2]} rotation={Math.PI} />
      <FilingCabinet position={[-4.5, 0.7, -3]} />
      <FilingCabinet position={[4.5, 0.7, -3]} />
      <ControlScreen position={[0, 1.6, -4.5]} active />
      <ControlScreen position={[-3, 1.5, -4.2]} active={false} />
      <WallSconce position={[-5, 2.2, 4]} rotation={Math.PI / 2} />
      <WallSconce position={[5, 2.2, 4]} rotation={-Math.PI / 2} />
      <mesh position={[0, 1.2, 4.8]} receiveShadow>
        <boxGeometry args={[3, 0.06, 0.8]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.75} />
      </mesh>
    </group>
  );
});

/** QA document review & batch release office */
export const QAOfficeArea = memo(function QAOfficeArea() {
  return (
    <group position={[36, 0, 24]}>
      <RoomNameplate position={[0, 2.8, 5.5]} color="#0d9488" />
      <OfficeDesk position={[-2.5, 0, 0]} rotation={0.1} wide />
      <OfficeDesk position={[2.5, 0, 0]} rotation={-0.1} wide />
      <OfficeDesk position={[0, 0, 2.5]} rotation={Math.PI / 2} />
      <OfficeChair position={[-2.5, 0, 1.2]} rotation={Math.PI} />
      <OfficeChair position={[2.5, 0, 1.2]} rotation={Math.PI} />
      <OfficeChair position={[0, 0, 3.5]} rotation={Math.PI} />
      <BatchRecordCabinet position={[-4.2, 0.8, -2]} />
      <BatchRecordCabinet position={[4.2, 0.8, -2]} />
      <FilingCabinet position={[-4.2, 0.7, 1]} />
      <FilingCabinet position={[4.2, 0.7, 1]} />
      <DocumentTray position={[-2.5, 0.78, -0.2]} />
      <DocumentTray position={[2.5, 0.78, -0.2]} />
      <DocumentTray position={[0, 0.78, 2.2]} />
      <ControlScreen position={[0, 1.5, -4.2]} active />
      <ControlScreen position={[-2, 1.4, -3.8]} active />
      <ControlScreen position={[2, 1.4, -3.8]} active />
      <WallSconce position={[-5, 2.2, 4]} rotation={Math.PI / 2} />
      <WallSconce position={[5, 2.2, 4]} rotation={-Math.PI / 2} />
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color={FACTORY_COLORS.corridor} roughness={0.82} />
      </mesh>
    </group>
  );
});

/** QC lab office annex — review bench adjacent to testing floor */
export const QCReviewAnnex = memo(function QCReviewAnnex() {
  return (
    <group position={[16, 0, -16]}>
      <OfficeDesk position={[5.5, 0, 3]} rotation={-Math.PI / 2} wide />
      <OfficeChair position={[4.2, 0, 3]} rotation={Math.PI / 2} />
      <BatchRecordCabinet position={[5.8, 0.8, -4]} />
      <DocumentTray position={[5.5, 0.78, 2.5]} />
      <ControlScreen position={[5.5, 1.4, 4.5]} active />
      <RoomNameplate position={[5.5, 2.6, 5]} color="#2563eb" />
      <WallSconce position={[6.2, 2, 2]} rotation={Math.PI} />
    </group>
  );
});
