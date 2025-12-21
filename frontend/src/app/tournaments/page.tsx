'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useReadContracts } from 'wagmi';
import { formatEther } from 'viem';
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
  const [loading, setLoading] = useState(true);
  const [entering, setEntering] = useState(false);

  // Read tournaments DIRECTLY from contract (IDs 1,2,3 from Arbiscan)
  const { data: tournamentData } = useReadContracts({
    contracts: [
      {
        address: TOURNAMENT_MANAGER_ADDRESS as `0x${string}`,
        abi: TOURNAMENT_MANAGER_ABI,
        functionName: 'getTournament',
        args: [BigInt(1)],
      },
      {
        address: TOURNAMENT_MANAGER_ADDRESS as `0x${string}`,
        abi: TOURNAMENT_MANAGER_ABI,
        functionName: 'getTournament',
        args: [BigInt(2)],
      },
      {
        address: TOURNAMENT_MANAGER_ADDRESS as `0x${string}`,
        abi: TOURNAMENT_MANAGER_ABI,
        functionName: 'getTournament',
        args: [BigInt(3)],
      },
    ],
  });

  // Convert raw contract data to Tournament format
  useEffect(() => {
    if (!tournamentData) return;

    const formatted: Tournament[] = [];
    
    tournamentData.forEach((data, index) => {
      if (data.result) {
        const t = data.result as any;
        formatted.push({
          id: index + 1,
          tier: Number(t[0]) === 0 ? 'Standard' : 'High Roller' as Tier,
          period: Number(t[1]) === 0 ? 'Weekly' : 'Monthly' as Period,
          startTime: new Date(Number(t[2]) * 1000),
          endTime: new Date(Number(t[3]) * 1000),
          entryFee: t[4],
          prizePool: t[5],
          totalEntries: Number(t[6]),
          winner: t[7],
          isActive: t[8],
          status: t[8] ? 'active' : 'ended' as TournamentStatus,
        });
      }
    });

    setTournaments(formatted);
    setLoading(false);
  }, [tournamentData]);

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
    if (!isConnected || !address) return;

    setEntering(true);
    setSelectedTournament(tournamentId);

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

  // ... rest of your existing JSX stays EXACTLY the same ...
  // (getStatusColor, getStatusBadge, getTierBadge functions + JSX)

  return (
    <div className="min-h-screen py-8">
      {/* Your existing JSX - copy from line ~250 onwards */}
      {/* Header, Filters, Tournament List, Info Cards - ALL IDENTICAL */}
    </div>
  );
}
