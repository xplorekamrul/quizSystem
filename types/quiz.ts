export interface Quiz {
  id: string
  title: string
  instructions: string
  createdAt: string
  questions: {
    id: string
    text: string
    options: string[]
    order: number
    correctAns?: string
  }[]
}

export interface Question {
  id: string
  quizId: string
  text: string
  options: string[]
  correctAns: string
  order: number
}

export interface QuizFormData {
  title: string
  instructions: string
  questions: {
    text: string
    options: string[]
    correctAns: string
  }[]
}

export interface StudentAnswer {
  questionId: string
  answer: string
  timeSpent: number
  timestamp: Date
}

export interface QuizAttempt {
  id: string
  quizId: string
  studentId: string
  answers: StudentAnswer[]
  score?: number
  completed: boolean
  startedAt: Date
  endedAt?: Date
}
