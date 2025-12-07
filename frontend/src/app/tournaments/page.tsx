'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { formatNumber, formatTimeRemaining } from '@/lib/utils';
import {
  TOURNAMENT_MANAGER_ADDRESS,
  TOURNAMENT_MANAGER_ABI,
  EIGHT_BIT_TOKEN_ADDRESS,
  EIGHT_BIT_TOKEN_ABI,
} from '@/config/contracts';

type Tier = 'Standard' | 'High Roller';
type Period = 'Weekly' | 'Monthly';
type TournamentStatus = 'upcoming' | 'active' | 'ended';

interface Tournament {
  id: number;
  tier: Tier;
  period: Period;
  startTime: Date;
  endTime: Date;
  entryFee: bigint;
  prizePool: bigint;
  totalEntries: number;
  winner: string;
  isActive: boolean;
  status: TournamentStatus;
  hasEntered?: boolean;
}

export default function TournamentsPage() {
  const { address, isConnected } = useAccount();
  const [filter, setFilter] = useState<Tier | 'all'>('all');
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<number | null>(null);
  const [needsApproval, setNeedsApproval] = useState(false);

  // Read tournament fees
  const { data: standardWeeklyFee } = useReadContract({
    address: TOURNAMENT_MANAGER_ADDRESS as `0x${string}`,
    abi: TOURNAMENT_MANAGER_ABI,
    functionName: 'STANDARD_WEEKLY_FEE',
  });

  const { data: standardMonthlyFee } = useReadContract({
    address: TOURNAMENT_MANAGER_ADDRESS as `0x${string}`,
    abi: TOURNAMENT_MANAGER_ABI,
    functionName: 'STANDARD_MONTHLY_FEE',
  });

  const { data: highRollerWeeklyFee } = useReadContract({
    address: TOURNAMENT_MANAGER_ADDRESS as `0x${string}`,
    abi: TOURNAMENT_MANAGER_ABI,
    functionName: 'HIGH_ROLLER_WEEKLY_FEE',
  });

  const { data: highRollerMonthlyFee } = useReadContract({
    address: TOURNAMENT_MANAGER_ADDRESS as `0x${string}`,
    abi: TOURNAMENT_MANAGER_ABI,
    functionName: 'HIGH_ROLLER_MONTHLY_FEE',
  });

  // Read prize pools
  const { data: standardWeeklyPrize } = useReadContract({
    address: TOURNAMENT_MANAGER_ADDRESS as `0x${string}`,
    abi: TOURNAMENT_MANAGER_ABI,
    functionName: 'STANDARD_WEEKLY_PRIZE',
  });

  const { data: standardMonthlyPrize } = useReadContract({
    address: TOURNAMENT_MANAGER_ADDRESS as `0x${string}`,
    abi: TOURNAMENT_MANAGER_ABI,
    functionName: 'STANDARD_MONTHLY_PRIZE',
  });

  const { data: highRollerWeeklyPrize } = useReadContract({
    address: TOURNAMENT_MANAGER_ADDRESS as `0x${string}`,
    abi: TOURNAMENT_MANAGER_ABI,
    functionName: 'HIGH_ROLLER_WEEKLY_PRIZE',
  });

  const { data: highRollerMonthlyPrize } = useReadContract({
    address: TOURNAMENT_MANAGER_ADDRESS as `0x${string}`,
    abi: TOURNAMENT_MANAGER_ABI,
    functionName: 'HIGH_ROLLER_MONTHLY_PRIZE',
  });

  // Check token allowance
  const { data: allowance } = useReadContract({
    address: EIGHT_BIT_TOKEN_ADDRESS as `0x${string}`,
    abi: EIGHT_BIT_TOKEN_ABI,
    functionName: 'allowance',
    args: address ? [address, TOURNAMENT_MANAGER_ADDRESS] : undefined,
  });

  // Approve tokens
  const { writeContract: approve, data: approveHash } = useWriteContract();
  const { isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  // Enter tournament
  const { writeContract: enterTournament, data: enterHash } = useWriteContract();
  const { isSuccess: isEnterSuccess } = useWaitForTransactionReceipt({
    hash: enterHash,
  });

  // Placeholder tournament data (in production, fetch from backend/contract events)
  useEffect(() => {
    const now = new Date();

    // Create sample tournaments using contract constants
    const sampleTournaments: Tournament[] = [];

    // Standard Weekly
    if (standardWeeklyFee && standardWeeklyPrize) {
      sampleTournaments.push({
        id: 1,
        tier: 'Standard',
        period: 'Weekly',
        startTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        entryFee: standardWeeklyFee as bigint,
        prizePool: standardWeeklyPrize as bigint,
        totalEntries: 42,
        winner: '0x0000000000000000000000000000000000000000',
        isActive: true,
        status: 'active',
      });
    }

    // Standard Monthly
    if (standardMonthlyFee && standardMonthlyPrize) {
      sampleTournaments.push({
        id: 2,
        tier: 'Standard',
        period: 'Monthly',
        startTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 33 * 24 * 60 * 60 * 1000),
        entryFee: standardMonthlyFee as bigint,
        prizePool: standardMonthlyPrize as bigint,
        totalEntries: 15,
        winner: '0x0000000000000000000000000000000000000000',
        isActive: true,
        status: 'upcoming',
      });
    }

    // High Roller Weekly
    if (highRollerWeeklyFee && highRollerWeeklyPrize) {
      sampleTournaments.push({
        id: 3,
        tier: 'High Roller',
        period: 'Weekly',
        startTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
        entryFee: highRollerWeeklyFee as bigint,
        prizePool: highRollerWeeklyPrize as bigint,
        totalEntries: 18,
        winner: '0x0000000000000000000000000000000000000000',
        isActive: true,
        status: 'active',
      });
    }

    // High Roller Monthly
    if (highRollerMonthlyFee && highRollerMonthlyPrize) {
      sampleTournaments.push({
        id: 4,
        tier: 'High Roller',
        period: 'Monthly',
        startTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 37 * 24 * 60 * 60 * 1000),
        entryFee: highRollerMonthlyFee as bigint,
        prizePool: highRollerMonthlyPrize as bigint,
        totalEntries: 8,
        winner: '0x0000000000000000000000000000000000000000',
        isActive: true,
        status: 'upcoming',
      });
    }

    setTournaments(sampleTournaments);
  }, [standardWeeklyFee, standardMonthlyFee, highRollerWeeklyFee, highRollerMonthlyFee,
      standardWeeklyPrize, standardMonthlyPrize, highRollerWeeklyPrize, highRollerMonthlyPrize]);

  // Check if approval is needed
  useEffect(() => {
    if (selectedTournament !== null && allowance !== undefined) {
      const tournament = tournaments.find(t => t.id === selectedTournament);
      if (tournament) {
        setNeedsApproval((allowance as bigint) < tournament.entryFee);
      }
    }
  }, [selectedTournament, allowance, tournaments]);

  const handleApprove = async (tournament: Tournament) => {
    if (!isConnected) return;

    approve({
      address: EIGHT_BIT_TOKEN_ADDRESS as `0x${string}`,
      abi: EIGHT_BIT_TOKEN_ABI,
      functionName: 'approve',
      args: [TOURNAMENT_MANAGER_ADDRESS, tournament.entryFee],
    });
  };

  const handleEnter = async (tournamentId: number) => {
    if (!isConnected) return;

    enterTournament({
      address: TOURNAMENT_MANAGER_ADDRESS as `0x${string}`,
      abi: TOURNAMENT_MANAGER_ABI,
      functionName: 'enterTournament',
      args: [BigInt(tournamentId)],
    });
  };

  const filteredTournaments =
    filter === 'all'
      ? tournaments
      : tournaments.filter((t) => t.tier === filter);

  const getStatusColor = (status: TournamentStatus) => {
    switch (status) {
      case 'active':
        return 'text-arcade-green';
      case 'upcoming':
        return 'text-arcade-cyan';
      case 'ended':
        return 'text-gray-500';
    }
  };

  const getStatusBadge = (status: TournamentStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2 py-1 bg-arcade-green/20 text-arcade-green font-pixel text-xs rounded">
            LIVE
          </span>
        );
      case 'upcoming':
        return (
          <span className="px-2 py-1 bg-arcade-cyan/20 text-arcade-cyan font-pixel text-xs rounded">
            SOON
          </span>
        );
      case 'ended':
        return (
          <span className="px-2 py-1 bg-gray-500/20 text-gray-500 font-pixel text-xs rounded">
            ENDED
          </span>
        );
    }
  };

  const getTierBadge = (tier: Tier) => {
    if (tier === 'High Roller') {
      return (
        <span className="px-2 py-1 bg-arcade-pink/20 text-arcade-pink font-pixel text-xs rounded">
          ⭐ HIGH ROLLER
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-arcade-purple/20 text-arcade-purple font-pixel text-xs rounded">
        STANDARD
      </span>
    );
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-pixel text-2xl md:text-3xl text-arcade-pink glow-pink mb-2">
            TOURNAMENTS
          </h1>
          <p className="font-arcade text-gray-400 mb-4">
            Two-Tier Competition System - Standard & High Roller
          </p>
          <div className="flex flex-wrap gap-4 justify-center text-sm font-arcade">
            <div className="card-arcade px-4 py-2">
              <span className="text-gray-400">Standard: </span>
              <span className="text-arcade-green">$1 Weekly / $5 Monthly</span>
            </div>
            <div className="card-arcade px-4 py-2">
              <span className="text-gray-400">High Roller: </span>
              <span className="text-arcade-pink">$5 Weekly / $25 Monthly</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 justify-center">
          {(['all', 'Standard', 'High Roller'] as const).map((tierFilter) => (
            <Button
              key={tierFilter}
              variant={filter === tierFilter ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter(tierFilter)}
            >
              {tierFilter === 'all' ? 'All Tiers' : tierFilter}
            </Button>
          ))}
        </div>

        {/* Tournament List */}
        <div className="space-y-4">
          {filteredTournaments.map((tournament) => (
            <Card key={tournament.id} className="hover:border-arcade-pink/60">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Tournament Info */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="font-pixel text-white text-sm">
                      {tournament.tier} {tournament.period}
                    </h3>
                    {getTierBadge(tournament.tier)}
                    {getStatusBadge(tournament.status)}
                  </div>
                  <p className="font-arcade text-gray-400 text-sm mb-2">
                    Compete across all games for {tournament.period.toLowerCase()} glory
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-arcade-dark border border-arcade-green/30 text-arcade-green font-arcade text-xs rounded">
                      All 12 Games
                    </span>
                    {tournament.tier === 'High Roller' && (
                      <span className="px-2 py-1 bg-arcade-dark border border-arcade-pink/30 text-arcade-pink font-arcade text-xs rounded">
                        Premium Prizes
                      </span>
                    )}
                  </div>
                </div>

                {/* Prize & Stats */}
                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <p className="font-arcade text-xs text-gray-500">Prize Pool</p>
                    <p className="font-pixel text-arcade-yellow">
                      {formatNumber(Number(formatEther(tournament.prizePool)))} 8BIT
                    </p>
                    <p className="font-arcade text-xs text-gray-400">
                      ${(Number(formatEther(tournament.prizePool)) * 0.0005).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-arcade text-xs text-gray-500">Entry Fee</p>
                    <p className="font-arcade text-arcade-cyan">
                      {formatNumber(Number(formatEther(tournament.entryFee)))} 8BIT
                    </p>
                    <p className="font-arcade text-xs text-gray-400">
                      ${(Number(formatEther(tournament.entryFee)) * 0.0005).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-arcade text-xs text-gray-500">Players</p>
                    <p className="font-arcade text-white">{tournament.totalEntries}</p>
                  </div>
                </div>

                {/* Action */}
                <div className="flex flex-col items-center gap-2 md:ml-4 min-w-[120px]">
                  {tournament.status === 'active' && (
                    <>
                      <p className="font-arcade text-xs text-gray-500">Ends in</p>
                      <p className={`font-pixel text-sm ${getStatusColor(tournament.status)}`}>
                        {formatTimeRemaining(tournament.endTime)}
                      </p>
                      {isConnected ? (
                        <>
                          {needsApproval && selectedTournament === tournament.id ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleApprove(tournament)}
                              disabled={!!approveHash}
                            >
                              {approveHash ? 'Approving...' : 'Approve 8BIT'}
                            </Button>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                setSelectedTournament(tournament.id);
                                handleEnter(tournament.id);
                              }}
                              disabled={!!enterHash}
                            >
                              {enterHash ? 'Entering...' : 'Enter Now'}
                            </Button>
                          )}
                        </>
                      ) : (
                        <Button variant="secondary" size="sm" disabled>
                          Connect Wallet
                        </Button>
                      )}
                    </>
                  )}
                  {tournament.status === 'upcoming' && (
                    <>
                      <p className="font-arcade text-xs text-gray-500">Starts in</p>
                      <p className={`font-pixel text-sm ${getStatusColor(tournament.status)}`}>
                        {formatTimeRemaining(tournament.startTime)}
                      </p>
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </>
                  )}
                  {tournament.status === 'ended' && (
                    <Button variant="ghost" size="sm">
                      View Results
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-6 mt-12">
          {/* How It Works */}
          <Card>
            <h2 className="font-pixel text-arcade-green text-sm mb-4">HOW TOURNAMENTS WORK</h2>
            <ul className="font-arcade text-sm text-gray-300 space-y-2">
              <li className="flex gap-2">
                <span className="text-arcade-green">1.</span>
                <span>Choose your tier: Standard or High Roller</span>
              </li>
              <li className="flex gap-2">
                <span className="text-arcade-green">2.</span>
                <span>Pay entry fee in 8BIT tokens (50% burned)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-arcade-green">3.</span>
                <span>Play all 12 games during tournament period</span>
              </li>
              <li className="flex gap-2">
                <span className="text-arcade-green">4.</span>
                <span>Highest combined score wins the prize pool</span>
              </li>
              <li className="flex gap-2">
                <span className="text-arcade-green">5.</span>
                <span>Winner receives 8BIT tokens automatically</span>
              </li>
            </ul>
          </Card>

          {/* Fee Distribution */}
          <Card>
            <h2 className="font-pixel text-arcade-pink text-sm mb-4">ENTRY FEE BREAKDOWN</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center font-arcade text-sm">
                <span className="text-gray-300">Prize Pool</span>
                <span className="text-arcade-green font-pixel">Fixed Amount</span>
              </div>
              <div className="flex justify-between items-center font-arcade text-sm">
                <span className="text-gray-300">Burned (Deflationary)</span>
                <span className="text-arcade-red font-pixel">50%</span>
              </div>
              <div className="flex justify-between items-center font-arcade text-sm">
                <span className="text-gray-300">Platform Reserve</span>
                <span className="text-arcade-cyan font-pixel">50%</span>
              </div>
              <div className="mt-4 p-3 bg-arcade-dark/50 rounded border border-arcade-yellow/30">
                <p className="font-arcade text-xs text-arcade-yellow">
                  💡 Entry fees help reduce token supply while funding bigger prize pools!
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Free Daily Rewards Reminder */}
        <Card className="mt-6 bg-gradient-to-r from-arcade-purple/10 to-arcade-pink/10 border-arcade-pink/30">
          <div className="text-center">
            <h3 className="font-pixel text-arcade-pink mb-2">FREE DAILY REWARDS</h3>
            <p className="font-arcade text-sm text-gray-300">
              Don't want to pay entry fees? Play for free and earn daily rewards!
            </p>
            <p className="font-arcade text-xs text-gray-400 mt-2">
              Top 10 players per game earn 280-1,250 8BIT every day. No entry fee required.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
