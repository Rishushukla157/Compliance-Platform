import { ObjectId } from 'mongodb';

export interface User {
  _id?: ObjectId;
  email: string;
  name: string;
  password: string;
  userType: 'naive' | 'company' | 'admin';
  companyName?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  profile?: {
    notifications: {
      email: boolean;
      assessment: boolean;
      achievements: boolean;
      security: boolean;
    };
    privacy: {
      showOnLeaderboard: boolean;
      shareProgress: boolean;
      publicProfile: boolean;
    };
  };
}

export interface Assessment {
  _id?: ObjectId;
  userId: ObjectId;
  userType: 'naive' | 'company';
  answers: Record<number, string>;
  scores: {
    overall: number;
    categories: Record<string, number>;
  };
  completedAt: Date;
  assessmentType: string;
}

export interface Question {
  _id?: ObjectId;
  id: number;
  category: string;
  question: string;
  options: Array<{
    label: string;
    text: string;
    weight: number;
  }>;
  weight: number;
  userType: 'naive' | 'company' | 'both';
  isActive: boolean;
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface Achievement {
  _id?: ObjectId;
  userId: ObjectId;
  achievementId: string;
  name: string;
  description: string;
  points: number;
  earnedAt: Date;
}

export interface Company {
  _id?: ObjectId;
  userId: ObjectId;
  companyName: string;
  industry: string;
  size: string;
  complianceFrameworks: string[];
  settings: {
    allowEmployeeAssessments: boolean;
    requireApproval: boolean;
    dataRetentionDays: number;
  };
  createdAt: Date;
  updatedAt: Date;
}