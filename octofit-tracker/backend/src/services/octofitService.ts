import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function calculatePoints(type: string, minutes: number): number {
  const basePointsPerMinute: { [key: string]: number } = {
    run: 1,
    cycle: 0.75,
    strength: 0.5,
    swim: 1.5,
  };
  const multiplier = basePointsPerMinute[type] || 1;
  return Math.max(1, Math.round(minutes * multiplier));
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const body = input as Record<string, unknown>;
  
  // Validate required fields
  if (!body.userId || !body.teamId || !body.type || body.minutes === undefined) {
    const error = new Error('Missing required fields: userId, teamId, type, minutes');
    throw Object.assign(error, { status: 400 });
  }

  // Validate ObjectIds format
  if (!mongoose.Types.ObjectId.isValid(String(body.userId))) {
    const error = new Error('Invalid userId format');
    throw Object.assign(error, { status: 400 });
  }
  if (!mongoose.Types.ObjectId.isValid(String(body.teamId))) {
    const error = new Error('Invalid teamId format');
    throw Object.assign(error, { status: 400 });
  }

  // Check if user and team exist
  const [user, team] = await Promise.all([
    User.findById(body.userId),
    Team.findById(body.teamId),
  ]);

  if (!user || !team) {
    const error = new Error('User or team not found');
    throw Object.assign(error, { status: 400 });
  }

  const points = calculatePoints(String(body.type), Number(body.minutes));
  
  const activity = await Activity.create({
    user: body.userId,
    team: body.teamId,
    type: body.type,
    minutes: body.minutes,
    points,
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const body = input as Record<string, unknown>;
  
  // Validate required fields
  if (!body.name || !body.mascot) {
    const error = new Error('Missing required fields: name, mascot');
    throw Object.assign(error, { status: 400 });
  }

  // Validate members if provided
  if (body.members && Array.isArray(body.members)) {
    for (const memberId of body.members) {
      if (!mongoose.Types.ObjectId.isValid(String(memberId))) {
        const error = new Error('Invalid member ID format');
        throw Object.assign(error, { status: 400 });
      }
    }
  }

  const team = await Team.create({
    name: body.name,
    mascot: body.mascot,
    members: body.members || [],
  });

  return team.toObject();
}

export async function getLeaderboard() {
  const leaderboardData = await Activity.aggregate([
    {
      $group: {
        _id: '$team',
        totalPoints: { $sum: '$points' },
      },
    },
    {
      $lookup: {
        from: 'teams',
        localField: '_id',
        foreignField: '_id',
        as: 'teamData',
      },
    },
    {
      $unwind: '$teamData',
    },
    {
      $project: {
        teamName: '$teamData.name',
        totalPoints: 1,
      },
    },
    {
      $sort: { totalPoints: -1 },
    },
  ]);

  return leaderboardData.map((entry, index) => ({
    teamName: entry.teamName,
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail });
  
  if (!user) {
    const error = new Error('User not found');
    throw Object.assign(error, { status: 404 });
  }

  // Find user's recent activities to determine their activity pattern
  const recentActivities = await Activity.find({ user: user._id }).limit(10).lean();
  
  // Get the most common activity type
  const activityTypes: { [key: string]: number } = {};
  for (const activity of recentActivities) {
    activityTypes[activity.type] = (activityTypes[activity.type] || 0) + 1;
  }
  const mostCommonActivityType = Object.entries(activityTypes).sort((a, b) => b[1] - a[1])[0]?.[0];

  // Find workouts matching the user's fitness goal
  const workouts = await Workout.find({ focus: user.fitnessGoal }).lean();

  return workouts.map(workout => ({
    ...workout,
    reason: mostCommonActivityType 
      ? `Matches your ${user.fitnessGoal} goal and your ${mostCommonActivityType} activity pattern`
      : `Suggested based on your ${user.fitnessGoal} fitness goal`,
  }));
}

export { User };
