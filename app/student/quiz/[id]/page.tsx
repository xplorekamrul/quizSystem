"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Clock, Eye, EyeOff } from "lucide-react";
import type { Quiz, StudentAnswer } from "@/types/quiz";

export default function StudentQuiz() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.id as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<StudentAnswer[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [studentId] = useState(() => `student_${Date.now()}`); // Simple student ID generation
  const [questionStartTime, setQuestionStartTime] = useState<Date>(new Date());

  // Security: Disable right-click and keyboard shortcuts
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable F12, Ctrl+Shift+I, Ctrl+U, etc.
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && e.key === "I") ||
        (e.ctrlKey && e.shiftKey && e.key === "J") ||
        (e.ctrlKey && e.key === "U")
      ) {
        e.preventDefault();
        alert("Developer tools are disabled during the quiz!");
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Security: Tab switch detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isQuizStarted && !isQuizCompleted) {
        setTabSwitchCount((prev) => {
          const newCount = prev + 1;
          if (newCount >= 3) {
            alert("Quiz terminated due to multiple tab switches!");
            handleQuizSubmit(true); // Force submit
          } else {
            alert(`Warning: Tab switching detected! (${newCount}/3)`);
          }
          return newCount;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isQuizStarted, isQuizCompleted]);

  // Timer logic
  useEffect(() => {
    if (!isQuizStarted || isQuizCompleted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleQuizSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isQuizStarted, isQuizCompleted]);

  // Fullscreen management
  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch (error) {
      alert("Fullscreen mode is required to start the quiz!");
    }
  };

  const exitFullscreen = async () => {
    try {
      await document.exitFullscreen();
      setIsFullscreen(false);
    } catch (error) {
      console.error("Error exiting fullscreen:", error);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);

      if (!isCurrentlyFullscreen && isQuizStarted && !isQuizCompleted) {
        alert("Quiz terminated: Fullscreen mode is required!");
        handleQuizSubmit(true);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [isQuizStarted, isQuizCompleted]);

  // Fetch quiz data
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await fetch(`/api/quiz/${quizId}`);

        if (response.ok) {
          const quizData = await response.json();
          setQuiz(quizData);
          setTimeLeft(quizData.questions.length * 60); // Total time = questions × 60 seconds
        }
      } catch (error) {
        console.error("Error fetching quiz:", error);
        alert("Failed to load quiz!");
      }
    };

    if (quizId) {
      fetchQuiz();
    }
  }, [quizId, router]);

  const startQuiz = async () => {
    await enterFullscreen();
    setIsQuizStarted(true);
    setQuestionStartTime(new Date());
  };

  const handleNextQuestion = useCallback(() => {
    if (!quiz) return;

    // Save current answer
    const currentQuestion = quiz.questions[currentQuestionIndex];
    const timeSpent = Math.floor(
      (new Date().getTime() - questionStartTime.getTime()) / 1000
    );

    const answer: StudentAnswer = {
      questionId: currentQuestion.id,
      answer: selectedAnswer,
      timeSpent,
      timestamp: new Date(),
    };

    setAnswers((prev) => [
      ...prev.filter((a) => a.questionId !== currentQuestion.id),
      answer,
    ]);

    // Move to next question or finish quiz
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer("");
      setTimeLeft(60);
      setQuestionStartTime(new Date());
    } else {
      handleQuizSubmit();
    }
  }, [quiz, currentQuestionIndex, selectedAnswer, questionStartTime]);

  const handleQuizSubmit = async (forced = false) => {
    if (!quiz) return;

    setIsQuizCompleted(true);

    // Include current question answer if not forced
    let finalAnswers = [...answers];
    if (!forced && selectedAnswer) {
      const currentQuestion = quiz.questions[currentQuestionIndex];
      const timeSpent = Math.floor(
        (new Date().getTime() - questionStartTime.getTime()) / 1000
      );

      finalAnswers = [
        ...answers.filter((a) => a.questionId !== currentQuestion.id),
        {
          questionId: currentQuestion.id,
          answer: selectedAnswer,
          timeSpent,
          timestamp: new Date(),
        },
      ];
    }

    try {
      const response = await fetch(`/api/quiz/${quizId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId,
          answers: finalAnswers,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setQuizResult(result);
      } else {
        alert("Failed to submit quiz!");
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      alert("Failed to submit quiz!");
    }

    await exitFullscreen();
  };

  if (!quiz) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (isQuizCompleted && quizResult) {
    return (
      <div className="container mx-auto p-6 max-w-2xl space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-green-600">
              Quiz Completed!
            </CardTitle>
            <CardDescription>Here are your results</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-4xl font-bold text-blue-600">
              {quizResult.score}/{quizResult.totalQuestions}
            </div>
            <div className="text-xl">Score: {quizResult.percentage}%</div>
            <div className="text-sm text-gray-600">
              Tab switches detected: {tabSwitchCount}
            </div>
            <Button onClick={() => router.push("/")} className="mt-6">
              Back to Home
            </Button>
          </CardContent>
        </Card>

        {/* Review block moved here */}
        <div className="space-y-6 text-left mt-6">
          <h2 className="text-lg font-semibold">Review Your Answers</h2>
          {quizResult.details.map((item: any, idx: number) => (
            <div key={idx} className="border p-4 rounded-lg bg-gray-50">
              <p className="mb-2 font-medium">
                Q{idx + 1}: {item.question}
              </p>
              <ul className="space-y-1 text-sm">
                {item.options.map((opt: string, i: number) => {
                  const isCorrect = opt === item.correctAnswer;
                  const isSelected = opt === item.studentAnswer;

                  return (
                    <li
                      key={i}
                      className={`p-2 rounded-md border ${
                        isCorrect
                          ? "bg-green-100 border-green-400"
                          : isSelected
                          ? "bg-red-100 border-red-400"
                          : "border-gray-200"
                      }`}
                    >
                      {opt}
                      {isCorrect && (
                        <span className="ml-2 text-green-600 font-semibold">
                          (Correct)
                        </span>
                      )}
                      {isSelected && !isCorrect && (
                        <span className="ml-2 text-red-600">(Your Answer)</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!isQuizStarted) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{quiz.title}</CardTitle>
            <CardDescription>{quiz.instructions}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <h4 className="font-semibold text-yellow-800 mb-2">
                    Security Requirements:
                  </h4>
                  <ul className="space-y-1 text-yellow-700">
                    <li>• Quiz must be taken in fullscreen mode</li>
                    <li>• Each question has a 1-minute timer</li>
                    <li>
                      • Tab switching will result in warnings (3 strikes =
                      termination)
                    </li>
                    <li>• Right-click and developer tools are disabled</li>
                    <li>• No backtracking to previous questions</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="mb-4">Total Questions: {quiz.questions.length}</p>
              <Button onClick={startQuiz} size="lg">
                {isFullscreen ? (
                  <EyeOff className="w-4 h-4 mr-2" />
                ) : (
                  <Eye className="w-4 h-4 mr-2" />
                )}
                Start Quiz (Fullscreen Required)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className="container mx-auto p-6 max-w-4xl h-screen flex flex-col">
  {/* Fixed Header */}
  <div className="mb-4">
    <div className="flex justify-between items-center mb-4">
      <h1 className="text-xl font-semibold">{quiz.title}</h1>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-red-600">
          <Clock className="w-4 h-4" />
          <span className="font-mono text-lg">
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
          </span>
        </div>
        {tabSwitchCount > 0 && (
          <div className="text-red-600 text-sm">Warnings: {tabSwitchCount}/3</div>
        )}
      </div>
    </div>

    <div>
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>
          Question {currentQuestionIndex + 1} of {quiz.questions.length}
        </span>
        <span>{Math.round(progress)}% Complete</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  </div>

  {/* Scrollable Questions Section */}
  <div className="flex-1 overflow-y-auto space-y-6 border-t pt-4">
    {quiz.questions.map((question, index) => (
      <Card key={question.id} className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Question {index + 1}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-4">
          <div className="text-base leading-relaxed">{question.text}</div>
          <div className="space-y-3">
            {question.options.map((option, optIdx) => {
              const answer =
                answers.find((a) => a.questionId === question.id)?.answer || "";
              return (
                <label
                  key={optIdx}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                    answer === option
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={option}
                    checked={answer === option}
                    onChange={() =>
                      setAnswers((prev) => [
                        ...prev.filter((a) => a.questionId !== question.id),
                        {
                          questionId: question.id,
                          answer: option,
                          timeSpent: 0,
                          timestamp: new Date(),
                        },
                      ])
                    }
                    className="mr-3"
                  />
                  <span className="text-sm">{option}</span>
                </label>
              );
            })}
          </div>
        </CardContent>
      </Card>
    ))}
  </div>

  {/* Fixed Submit Button */}
  <div className="text-center mt-6">
    <Button onClick={() => handleQuizSubmit()} disabled={isQuizCompleted}>
      Submit Quiz
    </Button>
  </div>
</div>

  );
}
