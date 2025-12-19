import { getDatabase } from '@/lib/mongodb';
import { Question } from '@/lib/models/User';
import { ObjectId } from 'mongodb';

export class QuestionService {
  static async getQuestions(userType: 'naive' | 'company'): Promise<Question[]> {
    const db = await getDatabase();
    return await db.collection<Question>('questions')
      .find({ 
        $or: [
          { userType },
          { userType: 'both' }
        ],
        isActive: true 
      })
      .sort({ id: 1 })
      .toArray();
  }

  static async createQuestion(question: Omit<Question, '_id' | 'createdAt' | 'updatedAt'>): Promise<Question> {
    const db = await getDatabase();
    const newQuestion: Question = {
      ...question,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection<Question>('questions').insertOne(newQuestion);
    return { ...newQuestion, _id: result.insertedId };
  }

  static async updateQuestion(questionId: string, updates: Partial<Question>): Promise<void> {
    const db = await getDatabase();
    await db.collection<Question>('questions').updateOne(
      { _id: new ObjectId(questionId) },
      { $set: { ...updates, updatedAt: new Date() } }
    );
  }

  static async deleteQuestion(questionId: string): Promise<void> {
    const db = await getDatabase();
    await db.collection<Question>('questions').updateOne(
      { _id: new ObjectId(questionId) },
      { $set: { isActive: false, updatedAt: new Date() } }
    );
  }

  static async getAllQuestions(): Promise<Question[]> {
    const db = await getDatabase();
    return await db.collection<Question>('questions')
      .find({ isActive: true })
      .sort({ id: 1 })
      .toArray();
  }

  static async seedInitialQuestions(): Promise<void> {
    const db = await getDatabase();
    const existingQuestions = await db.collection<Question>('questions').countDocuments();
    
    if (existingQuestions > 0) return;

    const initialQuestions: Omit<Question, '_id' | 'createdAt' | 'updatedAt'>[] = [
      {
        id: 1,
        category: 'Password Management',
        question: 'How do you manage your passwords across platforms?',
        options: [
          { label: 'A', text: 'Use a password manager with unique passwords for each account', weight: 100 },
          { label: 'B', text: 'Maintain a notebook with all passwords written down', weight: 60 },
          { label: 'C', text: 'Use the same password with slight variations', weight: 30 },
          { label: 'D', text: 'Memorize one common password and reuse it', weight: 10 }
        ],
        weight: 10,
        userType: 'both',
        isActive: true,
        createdBy: new ObjectId()
      },
      {
        id: 2,
        category: 'Password Management',
        question: 'How often do you change your passwords?',
        options: [
          { label: 'A', text: 'Every 3–6 months', weight: 100 },
          { label: 'B', text: 'Only when prompted or forced', weight: 70 },
          { label: 'C', text: 'Rarely or never', weight: 30 },
          { label: 'D', text: 'I only change them if there\'s a security issue', weight: 50 }
        ],
        weight: 8,
        userType: 'both',
        isActive: true,
        createdBy: new ObjectId()
      },
      {
        id: 3,
        category: 'Authentication',
        question: 'Which authentication method is used for logging into company systems?',
        options: [
          { label: 'A', text: 'Username + password + OTP or authenticator app', weight: 100 },
          { label: 'B', text: 'Username + password only', weight: 60 },
          { label: 'C', text: 'Biometric login only (fingerprint/face ID)', weight: 80 },
          { label: 'D', text: 'No authentication is required', weight: 0 }
        ],
        weight: 10,
        userType: 'company',
        isActive: true,
        createdBy: new ObjectId()
      },
      {
        id: 4,
        category: 'Device Security',
        question: 'How is your device protected when not in use?',
        options: [
          { label: 'A', text: 'Auto-lock enabled with strong password or biometric', weight: 100 },
          { label: 'B', text: 'Only screensaver or screen lock', weight: 60 },
          { label: 'C', text: 'No lock, anyone can use it', weight: 0 },
          { label: 'D', text: 'I manually lock it when I remember', weight: 30 }
        ],
        weight: 8,
        userType: 'both',
        isActive: true,
        createdBy: new ObjectId()
      },
      {
        id: 5,
        category: 'Data Protection',
        question: 'How are system backups handled?',
        options: [
          { label: 'A', text: 'Automated, encrypted backups to secure cloud', weight: 100 },
          { label: 'B', text: 'Manual backups done weekly', weight: 70 },
          { label: 'C', text: 'Occasionally backup important files', weight: 40 },
          { label: 'D', text: 'No backup process in place', weight: 0 }
        ],
        weight: 8,
        userType: 'both',
        isActive: true,
        createdBy: new ObjectId()
      }
    ];

    await db.collection<Question>('questions').insertMany(
      initialQuestions.map(q => ({
        ...q,
        createdAt: new Date(),
        updatedAt: new Date()
      }))
    );
  }
}