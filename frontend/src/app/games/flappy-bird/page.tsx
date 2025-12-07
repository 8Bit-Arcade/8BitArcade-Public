'use client';

import dynamic from 'next/dynamic';

const GameWrapper = dynamic(
  () => import('@/components/game/GameWrapper'),
  { ssr: false }
);

const loadFlappyBirdScene = async () => {
  const module = await import('@/games/flappy-bird/FlappyBirdScene');
  return module.FlappyBirdScene;
};

export default function FlappyBirdPage() {
  return (
    <GameWrapper
      gameId="flappy-bird"
      gameName="FLAPPY BIRD"
      sceneLoader={loadFlappyBirdScene}
      config={{
        width: 400,
        height: 600,
        backgroundColor: '#4ec0ca',
      }}
      showDPad={false}
      showAction={true}
      actionLabel="FLAP"
    />
  );
}
