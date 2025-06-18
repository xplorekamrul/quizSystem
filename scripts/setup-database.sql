-- Create the database tables
-- This script will be automatically executed when you run it

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Quiz table
CREATE TABLE IF NOT EXISTS "Quiz" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    instructions TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Question table
CREATE TABLE IF NOT EXISTS "Question" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "quizId" TEXT NOT NULL,
    text TEXT NOT NULL,
    options TEXT[] NOT NULL,
    "correctAns" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("quizId") REFERENCES "Quiz"(id) ON DELETE CASCADE
);

-- Create QuizAttempt table
CREATE TABLE IF NOT EXISTS "QuizAttempt" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "quizId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    answers JSONB NOT NULL,
    score INTEGER,
    completed BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    UNIQUE("quizId", "studentId")
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "Question_quizId_idx" ON "Question"("quizId");
CREATE INDEX IF NOT EXISTS "Question_order_idx" ON "Question"("order");
CREATE INDEX IF NOT EXISTS "QuizAttempt_quizId_idx" ON "QuizAttempt"("quizId");
CREATE INDEX IF NOT EXISTS "QuizAttempt_studentId_idx" ON "QuizAttempt"("studentId");

-- Insert sample data for testing
INSERT INTO "Quiz" (id, title, instructions) VALUES 
('sample-quiz-1', 'Sample Mathematics Quiz', 'Answer all questions within the time limit. Each question has 60 seconds.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO "Question" (id, "quizId", text, options, "correctAns", "order") VALUES 
('q1', 'sample-quiz-1', 'What is 2 + 2?', ARRAY['3', '4', '5', '6'], '4', 0),
('q2', 'sample-quiz-1', 'What is the square root of 16?', ARRAY['2', '4', '6', '8'], '4', 1),
('q3', 'sample-quiz-1', 'What is 10 × 5?', ARRAY['45', '50', '55', '60'], '50', 2)
ON CONFLICT (id) DO NOTHING;
