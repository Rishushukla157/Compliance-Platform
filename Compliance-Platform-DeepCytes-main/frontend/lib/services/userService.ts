import { getDatabase } from '@/lib/mongodb';
import { User, Assessment, Achievement } from '@/lib/models/User';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

export class UserService {
  static async createUser(userData: Omit<User, '_id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const db = await getDatabase();
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    const user: User = {
      ...userData,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
      profile: {
        notifications: {
          email: true,
          assessment: true,
          achievements: true,
          security: true
        },
        privacy: {
          showOnLeaderboard: true,
          shareProgress: false,
          publicProfile: false
        }
      }
    };

    const result = await db.collection<User>('users').insertOne(user);
    return { ...user, _id: result.insertedId };
  }

  static async findUserByEmail(email: string): Promise<User | null> {
    const db = await getDatabase();
    return await db.collection<User>('users').findOne({ email });
  }

  static async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  static async getUserById(userId: string): Promise<User | null> {
    const db = await getDatabase();
    return await db.collection<User>('users').findOne({ _id: new ObjectId(userId) });
  }

  static async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    const db = await getDatabase();
    await db.collection<User>('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { ...updates, updatedAt: new Date() } }
    );
  }

  static async saveAssessment(assessment: Omit<Assessment, '_id'>): Promise<Assessment> {
    const db = await getDatabase();
    const result = await db.collection<Assessment>('assessments').insertOne(assessment);
    return { ...assessment, _id: result.insertedId };
  }

  static async getUserAssessments(userId: string): Promise<Assessment[]> {
    const db = await getDatabase();
    return await db.collection<Assessment>('assessments')
      .find({ userId: new ObjectId(userId) })
      .sort({ completedAt: -1 })
      .toArray();
  }

  static async getLeaderboard(userType: 'naive' | 'company', limit: number = 10): Promise<any[]> {
    const db = await getDatabase();
    return await db.collection('assessments').aggregate([
      { $match: { userType } },
      { $sort: { completedAt: -1 } },
      { $group: {
        _id: '$userId',
        latestScore: { $first: '$scores.overall' },
        latestAssessment: { $first: '$completedAt' }
      }},
      { $sort: { latestScore: -1 } },
      { $limit: limit },
      { $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }},
      { $unwind: '$user' },
      { $project: {
        name: '$user.name',
        score: '$latestScore',
        assessmentDate: '$latestAssessment'
      }}
    ]).toArray();
  }

  static async addAchievement(userId: string, achievement: Omit<Achievement, '_id' | 'userId'>): Promise<void> {
    const db = await getDatabase();
    await db.collection<Achievement>('achievements').insertOne({
      ...achievement,
      userId: new ObjectId(userId)
    });
  }

  static async getUserAchievements(userId: string): Promise<Achievement[]> {
    const db = await getDatabase();
    return await db.collection<Achievement>('achievements')
      .find({ userId: new ObjectId(userId) })
      .toArray();
  }
}