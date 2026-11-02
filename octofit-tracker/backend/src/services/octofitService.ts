import { Activity, Team, User, Workout } from '../models/index.js';
import mongoose from 'mongoose';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const body = input as Record<string, unknown>;
  
  // Validate required fields
  if (!body.userId || !body.teamId || !body.type || body.minutes === undefined) {
    const error = new Error('Missing required fields: userId, teamId, type, minutes');
    Object.assign(error, { status: 400 });
    throw error;
  }

  // Validate ID formats
  if (!mongoose.Types.ObjectId.isValid(String(body.userId))) {
    const error = new Error('Invalid userId format');
    Object.assign(error, { status: 400 });
    throw error;
  }
  if (!mongoose.Types.ObjectId.isValid(String(body.teamId))) {
    const error = new Error('Invalid teamId format');
    Object.assign(error, { status: 400 });
    throw error;
  }

  // Verify user and team exist
  const user = await User.findById(body.userId);
  if (!user) {
    const error = new Error('User not found');
    Object.assign(error, { status: 400 });
    throw error;
  }

  const team = await Team.findById(body.teamId);
  if (!team) {
    const error = new Error('Team not found');
    Object.assign(error, { status: 400 });
    throw error;
  }

  // Calculate points (simple: 1 point per minute)
  const points = typeof body.minutes === 'number' ? body.minutes : 0;

  // Create activity
  const activity = await Activity.create({
    user: body.userId,
    team: body.teamId,
    type: body.type,
    minutes: body.minutes,
    points,
    occurredAt: new Date(),
  });

  return activity.toObject ? activity.toObject() : activity;
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const body = input as Record<string, unknown>;

  // Validate required fields
  if (!body.name) {
    const error = new Error('Team name is required');
    Object.assign(error, { status: 400 });
    throw error;
  }

  // Create team
  const team = await Team.create({
    name: body.name,
    mascot: body.mascot || '',
    members: Array.isArray(body.members) ? body.members : [],
  });

  return team.toObject ? team.toObject() : team;
}

export async function getLeaderboard() {
  const teams = await Team.find();
  
  const leaderboard = await Promise.all(
    teams.map(async (team) => {
      const totalPoints = await Activity.aggregate([
        { $match: { team: team._id } },
        { $group: { _id: null, total: { $sum: '$points' } } },
      ]);
      
      return {
        teamId: team._id,
        teamName: team.name,
        totalPoints: totalPoints[0]?.total || 0,
      };
    })
  );

  // Sort by points descending
  leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);

  // Add 1-based rank
  return leaderboard.map((entry, index) => ({
    teamName: entry.teamName,
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  // Decode URL-encoded email
  const decodedEmail = decodeURIComponent(userEmail);

  // Find user by email
  const user = await User.findOne({ email: decodedEmail });
  if (!user) {
    const error = new Error('User not found');
    Object.assign(error, { status: 404 });
    throw error;
  }

  // Get user's recent activities to determine focus
  const recentActivities = await Activity.find({ user: user._id })
    .sort({ occurredAt: -1 })
    .limit(5);

  // Determine focus from recent activities or fitness goal
  let preferredFocus = user.fitnessGoal;
  if (recentActivities.length > 0) {
    // Map activity types to workout focus
    const activityTypeMap: Record<string, string> = {
      run: 'endurance',
      cycle: 'endurance',
      strength: 'strength',
      walk: 'mobility',
      swim: 'endurance',
    };
    
    const activityType = recentActivities[0].type;
    preferredFocus = activityTypeMap[activityType] || user.fitnessGoal;
  }

  // Find workouts matching the preferred focus
  const workouts = await Workout.find({ focus: preferredFocus }).lean();

  // If no exact match, get any workouts
  const suggestions = workouts.length > 0 ? workouts : await Workout.find().limit(1).lean();

  // Add reasons to suggestions
  const withReasons = suggestions.map((workout, index) => ({
    ...workout,
    reason: index === 0 
      ? `Based on your ${recentActivities.length > 0 ? recentActivities[0].type + ' activity' : user.fitnessGoal + ' goal'}`
      : 'Recommended workout',
  }));

  return withReasons;
}

export { User };
