import { CapabilityCard } from './CapabilityCard.js';

type Activity = { type?: string; minutes?: number; points?: number };

export default function Activities() {
  return (
    <CapabilityCard<Activity>
      title="Activities"
      description="Track student activity minutes and points."
      endpoint="/api/activities"
      collection="activities"
      emptyMessage="No activities yet."
      renderItem={(activity) => (
        <>{activity.type ?? 'Activity'}{activity.minutes != null && ` — ${activity.minutes} minutes`}{activity.points != null && ` — ${activity.points} points`}</>
      )}
    />
  );
}
