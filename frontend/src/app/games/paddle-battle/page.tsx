'use client';

import dynamic from 'next/dynamic';

const GameWrapper = dynamic(
  () => import('@/components/game/GameWrapper'),
  { ssr: false }
);

const loadPaddleBattleScene = async () => {
  const module = await import('@/games/paddle-battle/PaddleBattleScene');
  return module.PaddleBattleScene;
};

export default function PaddleBattlePage() {
  return (
    <GameWrapper
      gameId="paddle-battle"
      gameName="PADDLE BATTLE"
      sceneLoader={loadPaddleBattleScene}
      config={{
        width: 800,
        height: 600,
        backgroundColor: '#000000',
      }}
      showDPad={true}
      showAction={false}
    />
  );
}
