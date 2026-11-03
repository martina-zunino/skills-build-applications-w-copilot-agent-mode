import { CapabilityCard } from './CapabilityCard.js';

type Ranking = { teamName?: string; totalPoints?: number; rank?: number };

export default function Leaderboard() {
  return (
    <CapabilityCard<Ranking>
      title="Leaderboard"
      description="Compare team point totals."
      endpoint="/api/leaderboard"
      collection="leaderboard"
      emptyMessage="No rankings yet."
      renderItem={(ranking) => <>{ranking.rank != null && `#${ranking.rank} `}{ranking.teamName ?? 'Team'}{ranking.totalPoints != null && ` — ${ranking.totalPoints} points`}</>}
    />
  );
}
