import { Principal } from '@dfinity/principal';

// In production, this URL should be configurable or point to the deployed quiz service.
// On Android emulator use 10.0.2.2, on iOS simulator use localhost.
const QUIZ_API_URL = 'http://127.0.0.1:3000/api';

export interface QuizLeaderboardEntry {
    principalId: string;
    level: number;
    xp: number;
}

export class QuizService {
    async checkEligibility(principal: Principal): Promise<boolean> {
        try {
            const response = await fetch(`${QUIZ_API_URL}/quiz/eligibility`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ principalId: principal.toText() }),
            });
            const data = await response.json();
            return data.canStart;
        } catch (error) {
            console.error('Quiz eligibility check failed', error);
            return false;
        }
    }

    getQuizUrl(principal: Principal): string {
        return `${QUIZ_API_URL.replace('/api', '')}/quiz?principal=${principal.toText()}`;
    }
}

export const quizService = new QuizService();
