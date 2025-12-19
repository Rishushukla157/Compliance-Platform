const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    SEND_OTP: `${API_BASE_URL}/api/auth/send-otp`,
    VERIFY_OTP: `${API_BASE_URL}/api/auth/verify-otp`,
    COMPLETE_REGISTRATION: `${API_BASE_URL}/api/auth/complete-registration`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
    REFRESH: `${API_BASE_URL}/api/auth/refresh`,
    PROFILE: `${API_BASE_URL}/api/auth/profile`
  },
  ADMIN: {
    ANALYTICS: `${API_BASE_URL}/api/admin/analytics`,
    USERS: `${API_BASE_URL}/api/admin/users`,
    QUESTIONS: `${API_BASE_URL}/api/admin/questions`,
    ADD_QUESTION: `${API_BASE_URL}/api/admin/add-question`,
    DELETE_QUESTION: `${API_BASE_URL}/api/admin/delete-question`,
    UPDATE_QUESTION: `${API_BASE_URL}/api/admin/update-question`,
    DELETE_USER: `${API_BASE_URL}/api/admin/users`,
    ADD_USER: `${API_BASE_URL}/api/admin/add-user`,
    GET_USER: `${API_BASE_URL}/api/admin/users`,
    UPDATE_USER: `${API_BASE_URL}/api/admin/users`,
  },
  USER: {
    PROFILE: `${API_BASE_URL}/api/user/profile`,
    ASSESSMENTS: `${API_BASE_URL}/api/user/assessments`,
    ACHIEVEMENTS: `${API_BASE_URL}/api/user/achievements`,
    REPORTS: `${API_BASE_URL}/api/user/reports`,
    REPORT: `${API_BASE_URL}/api/user/report`,
    QUESTIONS: `${API_BASE_URL}/api/user/questions`,
    SUBMIT_ASSESSMENT: `${API_BASE_URL}/api/user/submit-assessment`,
    SAVE_ANSWER: `${API_BASE_URL}/api/user/save-answer`,
    SEND_REPORT: `${API_BASE_URL}/api/user/sendReport`,
  },
  COMPANY: {
    ANALYTICS: `${API_BASE_URL}/api/company/analytics`,
    EMPLOYEES: `${API_BASE_URL}/api/company/employees`,
    REPORTS: `${API_BASE_URL}/api/company/reports`,
    LEADERBOARD: `${API_BASE_URL}/api/company/leaderboard`,
  },
  QUESTIONS: {
    SERVICES: `${API_BASE_URL}/api/questions`,
  },
  COMMON: {
    REFRESH: `${API_BASE_URL}/api/auth/refresh`,
  }
};