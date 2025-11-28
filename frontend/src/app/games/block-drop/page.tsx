'use client';

import dynamic from 'next/dynamic';

const GameWrapper = dynamic(
  () => import('@/components/game/GameWrapper'),
  { ssr: false }
);

const loadBlockDropScene = async () => {
  const module = await import('@/games/block-drop/BlockDropScene');
  return module.BlockDropScene;
};

export default function BlockDropPage() {
  return (
    <GameWrapper
      gameId="block-drop"
      gameName="BLOCK DROP"
      sceneLoader={loadBlockDropScene}
      config={{
        width: 500,
        height: 700,
        backgroundColor: '#0a0a0a',
      }}
      showDPad={true}
      showAction={true}
      actionLabel="ROTATE"
    />
  );
}
