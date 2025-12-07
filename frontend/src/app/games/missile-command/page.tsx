'use client';

import dynamic from 'next/dynamic';

const GameWrapper = dynamic(
  () => import('@/components/game/GameWrapper'),
  { ssr: false }
);

const loadMissileCommandScene = async () => {
  const module = await import('@/games/missile-command/MissileCommandScene');
  return module.MissileCommandScene;
};

export default function MissileCommandPage() {
  return (
    <GameWrapper
      gameId="missile-command"
      gameName="MISSILE COMMAND"
      sceneLoader={loadMissileCommandScene}
      config={{
        width: 640,
        height: 600,
        backgroundColor: '#000000',
      }}
      showDPad={true}
      showAction={true}
      actionLabel="FIRE"
    />
  );
}
