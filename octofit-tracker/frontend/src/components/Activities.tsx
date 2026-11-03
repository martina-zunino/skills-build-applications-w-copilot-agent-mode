import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = { type?: string; minutes?: number; points?: number };

export default function Activities() {
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getJson<{ activities: Activity[] }>('/api/activities')
      .then((data) => {
        if (!Array.isArray(data.activities)) throw new Error('Invalid activities response');
        if (active) setActivities(data.activities);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : String(reason));
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <CapabilityCard
      title="Activities"
      description="Track student activity minutes and points."
      items={activities}
      error={error}
      emptyMessage="No activities yet."
      renderItem={(activity) => (
        <>{activity.type ?? 'Activity'}{activity.minutes != null && ` — ${activity.minutes} minutes`}{activity.points != null && ` — ${activity.points} points`}</>
      )}
    />
  );
}
