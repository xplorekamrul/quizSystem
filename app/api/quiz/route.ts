import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const quizzes = await prisma.quiz.findMany({
      include: {
        questions: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            text: true,
            options: true,
            order: true,
            // correctAns is intentionally excluded
          },
        },
      },
    });

    return NextResponse.json(quizzes);
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return NextResponse.json({ error: "Failed to fetch quizzes" }, { status: 500 });
  }
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { title, instructions, questions } = body;

    const quiz = await prisma.quiz.create({
      data: {
        title,
        instructions,
        questions: {
          create: questions.map((q: any, index: number) => ({
            text: q.text,
            order: index + 1,
            options: q.options,
            correctAns: q.correctAns, // Optional: Remove if you don’t store it on creation
          })),
        },
      },
    });

    return NextResponse.json(quiz, { status: 201 });
  } catch (error) {
    console.error("Error creating quiz:", error);
    return NextResponse.json({ error: "Failed to create quiz" }, { status: 500 });
  }
}
