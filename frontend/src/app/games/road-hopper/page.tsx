'use client';

import dynamic from 'next/dynamic';

const GameWrapper = dynamic(
  () => import('@/components/game/GameWrapper'),
  { ssr: false }
);

const loadRoadHopperScene = async () => {
  const module = await import('@/games/road-hopper/RoadHopperScene');
  return module.RoadHopperScene;
};

export default function RoadHopperPage() {
  return (
    <GameWrapper
      gameId="road-hopper"
      gameName="ROAD HOPPER"
      sceneLoader={loadRoadHopperScene}
      config={{
        width: 800,
        height: 480,
        backgroundColor: '#0a0a0a',
      }}
      showDPad={true}
      showAction={false}
    />
  );
}
