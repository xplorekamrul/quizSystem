import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { StudentAnswer } from "@/types/quiz"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { studentId, answers }: { studentId: string; answers: StudentAnswer[] } = await request.json()

    if (!studentId || !answers) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get quiz with correct answers
    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
      },
    })

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    // Map answers by questionId for quick lookup
    const answerMap = Object.fromEntries(answers.map((a) => [a.questionId, a]))

    let score = 0
    const details = quiz.questions.map((q: {
      id: string;
      text: string;
      options: string[];
      correctAns: string;
    }) => {
      const studentAnswer = answerMap[q.id]
      const isCorrect = studentAnswer?.answer === q.correctAns
      if (isCorrect) score++

      return {
        questionId: q.id,
        question: q.text,
        options: q.options,
        correctAnswer: q.correctAns,
        studentAnswer: studentAnswer?.answer ?? null,
        isCorrect,
      }
    })

    const totalQuestions = quiz.questions.length

    // Save attempt
    const attempt = await prisma.quizAttempt.upsert({
      where: {
        quizId_studentId: {
          quizId: params.id,
          studentId,
        },
      },
      update: {
        answers: JSON.stringify(answers),
        score,
        completed: true,
        endedAt: new Date(),
      },
      create: {
        quizId: params.id,
        studentId,
        answers: JSON.stringify(answers),
        score,
        completed: true,
        endedAt: new Date(),
      },
    })

    return NextResponse.json({
      score,
      totalQuestions,
      percentage: Math.round((score / totalQuestions) * 100),
      details,
    })
  } catch (error) {
    console.error("Error submitting quiz:", error)
    return NextResponse.json({ error: "Failed to submit quiz" }, { status: 500 })
  }
}
