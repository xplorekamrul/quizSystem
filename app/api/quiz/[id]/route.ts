import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      include: {
        questions: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            text: true,
            options: true,
            order: true,
            correctAns: true,
          },
        },
      },
    })

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
    }

    return NextResponse.json(quiz)
  } catch (error) {
    console.error("Error fetching quiz:", error)
    return NextResponse.json({ error: "Failed to fetch quiz" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { title, instructions, questions } = body

    // First, delete existing questions
    await prisma.question.deleteMany({
      where: { quizId: params.id },
    })

    // Update quiz with new data
    const updatedQuiz = await prisma.quiz.update({
      where: { id: params.id },
      data: {
        title,
        instructions,
        questions: {
          create: questions.map((q: any, index: number) => ({
            text: q.text,
            order: index + 1,
            options: q.options,
            correctAns: q.correctAns,
          })),
        },
      },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
      },
    })

    return NextResponse.json(updatedQuiz)
  } catch (error) {
    console.error("Error updating quiz:", error)
    return NextResponse.json({ error: "Failed to update quiz" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Delete the quiz (questions will be deleted automatically due to cascade)
    await prisma.quiz.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Quiz deleted successfully" })
  } catch (error) {
    console.error("Error deleting quiz:", error)
    return NextResponse.json({ error: "Failed to delete quiz" }, { status: 500 })
  }
}
