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

    // Calculate score
    let score = 0
    const totalQuestions = quiz.questions.length

    for (const answer of answers) {
      const question = quiz.questions.find((q: any) => q.id === answer.questionId)
      if (question && question.correctAns === answer.answer) {
        score++
      }
    }

    // Save quiz attempt
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
      attempt,
    })
  } catch (error) {
    console.error("Error submitting quiz:", error)
    return NextResponse.json({ error: "Failed to submit quiz" }, { status: 500 })
  }
}
