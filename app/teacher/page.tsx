"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Plus,
  Trash2,
  Save,
  Copy,
  Share2,
  Eye,
  Calendar,
  Users,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  BookOpen,
  Edit,
  Upload,
  FileText,
  ToggleLeft,
  ToggleRight,
} from "lucide-react"
import type { QuizFormData, Quiz } from "@/types/quiz"
import * as XLSX from "xlsx"

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState("create")
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(false)
  const [quiz, setQuiz] = useState<QuizFormData>({
    title: "",
    instructions: "",
    questions: [
      {
        text: "",
        options: ["", ""],
        correctAns: "",
      },
    ],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState("")
  const [createdQuizId, setCreatedQuizId] = useState<string | null>(null)

  // New state for toggle functionality
  const [inputMode, setInputMode] = useState<"form" | "upload">("form")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isFileReady, setIsFileReady] = useState(false)

  // Edit functionality state
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null)
  const [editQuizData, setEditQuizData] = useState<QuizFormData>({
    title: "",
    instructions: "",
    questions: [],
  })
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const handleExcelUpload = async (file?: File) => {
    if (!file) return

    setUploadedFile(file)
    setIsFileReady(true)
    setSubmitMessage(`File "${file.name}" ready for upload. Click "Submit Quiz from File" to process.`)
  }

  const submitFileUpload = async () => {
    if (!uploadedFile) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target!.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: "array" })
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      if (!jsonData.length) {
        setSubmitMessage("The Excel sheet is empty or improperly formatted.")
        return
      }

      const firstRow: any = jsonData[0]

      const questions = jsonData.map((row: any, index: number) => {
        const options = [row["Option A"], row["Option B"], row["Option C"], row["Option D"]].filter(Boolean)
        return {
          text: row["Question Text"],
          options,
          correctAns: row["Correct Answer"],
        }
      })

      const quizPayload = {
        title: firstRow["Quiz Title"] || "Untitled Quiz",
        instructions: firstRow["Quiz Instructions"] || "",
        questions,
      }

      // Validate structure before upload
      const error = validateQuizUpload(quizPayload)
      if (error) {
        setSubmitMessage(error)
        return
      }

      try {
        const res = await fetch("/api/quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(quizPayload),
        })

        const result = await res.json()

        if (res.ok) {
          setSubmitMessage(`Quiz "${result.title}" uploaded successfully!`)
          setCreatedQuizId(result.id)
          setUploadedFile(null)
          setIsFileReady(false)
          if (activeTab === "manage") fetchQuizzes()
        } else {
          setSubmitMessage(`Error: ${result.error}`)
        }
      } catch (err) {
        setSubmitMessage("Failed to upload quiz from Excel.")
      }
    }

    reader.readAsArrayBuffer(uploadedFile)
  }

  const validateQuizUpload = (quiz: QuizFormData) => {
    if (!quiz.title || !quiz.instructions) return "Quiz title or instructions missing"

    for (let i = 0; i < quiz.questions.length; i++) {
      const q = quiz.questions[i]
      if (!q.text?.trim()) return `Question ${i + 1} is missing text`
      if (!q.options || q.options.length < 2) return `Question ${i + 1} must have at least 2 options`
      if (!q.correctAns || !q.options.includes(q.correctAns)) {
        return `Question ${i + 1} has invalid correct answer`
      }
    }
    return null
  }

  // Fetch quizzes when component mounts or when switching to manage tab
  useEffect(() => {
    if (activeTab === "manage") {
      fetchQuizzes()
    }
  }, [activeTab])

  const fetchQuizzes = async () => {
    setIsLoadingQuizzes(true)
    try {
      const response = await fetch("/api/quiz")
      if (response.ok) {
        const quizzesData = await response.json()
        setQuizzes(quizzesData)
      } else {
        console.error("Failed to fetch quizzes")
      }
    } catch (error) {
      console.error("Error fetching quizzes:", error)
    } finally {
      setIsLoadingQuizzes(false)
    }
  }

  // Edit quiz functionality
  const handleEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz)
    setEditQuizData({
      title: quiz.title,
      instructions: quiz.instructions,
      questions: quiz.questions.map((q) => ({
        text: q.text,
        options: q.options,
        correctAns: q.correctAns || "",
      })),
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateQuiz = async () => {
    if (!editingQuiz) return

    const error = validateQuiz(editQuizData)
    if (error) {
      setSubmitMessage(error)
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/quiz/${editingQuiz.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editQuizData),
      })

      if (response.ok) {
        setSubmitMessage("Quiz updated successfully!")
        setIsEditDialogOpen(false)
        setEditingQuiz(null)
        fetchQuizzes()
      } else {
        const error = await response.json()
        setSubmitMessage(`Error: ${error.error}`)
      }
    } catch (error) {
      setSubmitMessage("Failed to update quiz. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete quiz functionality
  const handleDeleteQuiz = async (quizId: string) => {
    try {
      const response = await fetch(`/api/quiz/${quizId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setSubmitMessage("Quiz deleted successfully!")
        fetchQuizzes()
      } else {
        const error = await response.json()
        setSubmitMessage(`Error: ${error.error}`)
      }
    } catch (error) {
      setSubmitMessage("Failed to delete quiz. Please try again.")
    }
  }

  const addQuestion = (isEdit = false) => {
    const newQuestion = {
      text: "",
      options: ["", ""],
      correctAns: "",
    }

    if (isEdit) {
      setEditQuizData((prev) => ({
        ...prev,
        questions: [...prev.questions, newQuestion],
      }))
    } else {
      setQuiz((prev) => ({
        ...prev,
        questions: [...prev.questions, newQuestion],
      }))
    }
  }

  const removeQuestion = (index: number, isEdit = false) => {
    const currentQuestions = isEdit ? editQuizData.questions : quiz.questions
    if (currentQuestions.length > 1) {
      if (isEdit) {
        setEditQuizData((prev) => ({
          ...prev,
          questions: prev.questions.filter((_, i) => i !== index),
        }))
      } else {
        setQuiz((prev) => ({
          ...prev,
          questions: prev.questions.filter((_, i) => i !== index),
        }))
      }
    }
  }

  const updateQuestion = (index: number, field: string, value: string, isEdit = false) => {
    if (isEdit) {
      setEditQuizData((prev) => ({
        ...prev,
        questions: prev.questions.map((q, i) => (i === index ? { ...q, [field]: value } : q)),
      }))
    } else {
      setQuiz((prev) => ({
        ...prev,
        questions: prev.questions.map((q, i) => (i === index ? { ...q, [field]: value } : q)),
      }))
    }
  }

  const updateOption = (questionIndex: number, optionIndex: number, value: string, isEdit = false) => {
    if (isEdit) {
      setEditQuizData((prev) => ({
        ...prev,
        questions: prev.questions.map((q, i) =>
          i === questionIndex
            ? {
                ...q,
                options: q.options.map((opt, j) => (j === optionIndex ? value : opt)),
              }
            : q,
        ),
      }))
    } else {
      setQuiz((prev) => ({
        ...prev,
        questions: prev.questions.map((q, i) =>
          i === questionIndex
            ? {
                ...q,
                options: q.options.map((opt, j) => (j === optionIndex ? value : opt)),
              }
            : q,
        ),
      }))
    }
  }

  const addOption = (questionIndex: number, isEdit = false) => {
    const currentQuestions = isEdit ? editQuizData.questions : quiz.questions
    const currentQuestion = currentQuestions[questionIndex]

    if (currentQuestion.options.length < 4) {
      if (isEdit) {
        setEditQuizData((prev) => ({
          ...prev,
          questions: prev.questions.map((q, i) => (i === questionIndex ? { ...q, options: [...q.options, ""] } : q)),
        }))
      } else {
        setQuiz((prev) => ({
          ...prev,
          questions: prev.questions.map((q, i) => (i === questionIndex ? { ...q, options: [...q.options, ""] } : q)),
        }))
      }
    }
  }

  const removeOption = (questionIndex: number, optionIndex: number, isEdit = false) => {
    const currentQuestions = isEdit ? editQuizData.questions : quiz.questions
    const currentQuestion = currentQuestions[questionIndex]

    if (currentQuestion.options.length > 2) {
      if (isEdit) {
        setEditQuizData((prev) => ({
          ...prev,
          questions: prev.questions.map((q, i) =>
            i === questionIndex
              ? {
                  ...q,
                  options: q.options.filter((_, j) => j !== optionIndex),
                  correctAns: q.correctAns === q.options[optionIndex] ? "" : q.correctAns,
                }
              : q,
          ),
        }))
      } else {
        setQuiz((prev) => ({
          ...prev,
          questions: prev.questions.map((q, i) =>
            i === questionIndex
              ? {
                  ...q,
                  options: q.options.filter((_, j) => j !== optionIndex),
                  correctAns: q.correctAns === q.options[optionIndex] ? "" : q.correctAns,
                }
              : q,
          ),
        }))
      }
    }
  }

  const validateQuiz = (quizData = quiz) => {
    if (!quizData.title.trim() || !quizData.instructions.trim()) {
      return "Please fill in quiz title and instructions"
    }

    for (let i = 0; i < quizData.questions.length; i++) {
      const question = quizData.questions[i]

      if (!question.text.trim()) {
        return `Question ${i + 1}: Please enter question text`
      }

      const validOptions = question.options.filter((opt) => opt.trim())
      if (validOptions.length < 2) {
        return `Question ${i + 1}: Please provide at least 2 options`
      }

      if (!question.correctAns.trim()) {
        return `Question ${i + 1}: Please select the correct answer`
      }

      if (!question.options.includes(question.correctAns)) {
        return `Question ${i + 1}: Correct answer must match one of the options`
      }
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const error = validateQuiz()
    if (error) {
      setSubmitMessage(error)
      return
    }

    setIsSubmitting(true)
    setSubmitMessage("")

    try {
      const response = await fetch("/api/quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(quiz),
      })

      if (response.ok) {
        const createdQuiz = await response.json()
        setSubmitMessage(`Quiz "${createdQuiz.title}" created successfully!`)
        setCreatedQuizId(createdQuiz.id)

        // Reset form
        setQuiz({
          title: "",
          instructions: "",
          questions: [
            {
              text: "",
              options: ["", ""],
              correctAns: "",
            },
          ],
        })

        // Refresh quiz list if on manage tab
        if (activeTab === "manage") {
          fetchQuizzes()
        }
      } else {
        const error = await response.json()
        setSubmitMessage(`Error: ${error.error}`)
      }
    } catch (error) {
      setSubmitMessage("Failed to create quiz. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setSubmitMessage(`${type} copied to clipboard!`)
      setTimeout(() => setSubmitMessage(""), 3000)
    } catch (error) {
      console.error("Failed to copy:", error)
      setSubmitMessage(`Failed to copy ${type.toLowerCase()}`)
    }
  }

  const shareQuiz = async (quizId: string, title: string) => {
    const shareUrl = `${window.location.origin}/student/quiz/${quizId}`
    const shareText = `Take the quiz: "${title}"\nQuiz ID: ${quizId}\nLink: ${shareUrl}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Quiz: ${title}`,
          text: shareText,
          url: shareUrl,
        })
      } catch (error) {
        console.error("Error sharing:", error)
        copyToClipboard(shareText, "Share text")
      }
    } else {
      copyToClipboard(shareText, "Share text")
    }
  }

  const QuizSuccessCard = ({ quizId, title }: { quizId: string; title: string }) => {
    const quizUrl = `${window.location.origin}/student/quiz/${quizId}`

    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <CardTitle className="text-green-800">Quiz Created Successfully!</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-green-700">Quiz Title</Label>
            <p className="text-green-800 font-semibold">{title}</p>
          </div>

          <div>
            <Label className="text-sm font-medium text-green-700">Quiz ID</Label>
            <div className="flex items-center gap-2 mt-1">
              <code className="bg-white px-3 py-2 rounded border text-sm font-mono flex-1">{quizId}</code>
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(quizId, "Quiz ID")}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-green-700">Direct Link</Label>
            <div className="flex items-center gap-2 mt-1">
              <code className="bg-white px-3 py-2 rounded border text-sm font-mono flex-1 truncate">{quizUrl}</code>
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(quizUrl, "Quiz link")}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={() => shareQuiz(quizId, title)} className="flex-1" variant="default">
              <Share2 className="w-4 h-4 mr-2" />
              Share Quiz
            </Button>
            <Button onClick={() => window.open(quizUrl, "_blank")} variant="outline" className="flex-1">
              <ExternalLink className="w-4 h-4 mr-2" />
              Preview Quiz
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const QuizCard = ({ quiz }: { quiz: Quiz }) => {
    const quizUrl = `${window.location.origin}/student/quiz/${quiz.id}`

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg">{quiz.title}</CardTitle>
              <CardDescription className="mt-1 line-clamp-2">{quiz.instructions}</CardDescription>
            </div>
            <Badge variant="secondary" className="ml-2">
              {quiz.questions.length} questions
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(quiz.createdAt).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              Quiz ID: <code className="bg-gray-100 px-1 rounded text-xs">{quiz.id}</code>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Quiz ID</Label>
            <div className="flex items-center gap-2 mt-1">
              <code className="bg-gray-50 px-3 py-2 rounded border text-sm font-mono flex-1">{quiz.id}</code>
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(quiz.id, "Quiz ID")}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => shareQuiz(quiz.id, quiz.title)} variant="default" size="sm" className="flex-1">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button onClick={() => window.open(quizUrl, "_blank")} variant="outline" size="sm" className="flex-1">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
          </div>

          <div className="flex gap-2 pt-2 border-t">
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleEditQuiz(quiz)} variant="outline" size="sm" className="flex-1">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Quiz</DialogTitle>
                  <DialogDescription>Make changes to your quiz. Click save when you're done.</DialogDescription>
                </DialogHeader>

                {editingQuiz && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="edit-title">Quiz Title</Label>
                        <Input
                          id="edit-title"
                          value={editQuizData.title}
                          onChange={(e) => setEditQuizData((prev) => ({ ...prev, title: e.target.value }))}
                          placeholder="Enter quiz title"
                        />
                      </div>

                      <div>
                        <Label htmlFor="edit-instructions">Instructions</Label>
                        <Textarea
                          id="edit-instructions"
                          value={editQuizData.instructions}
                          onChange={(e) => setEditQuizData((prev) => ({ ...prev, instructions: e.target.value }))}
                          placeholder="Enter quiz instructions for students"
                          rows={3}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold">Questions</h4>
                        <Button type="button" onClick={() => addQuestion(true)} variant="outline" size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Question
                        </Button>
                      </div>

                      {editQuizData.questions.map((question, questionIndex) => (
                        <Card key={questionIndex} className="border-l-4 border-l-blue-500">
                          <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">Question {questionIndex + 1}</CardTitle>
                              {editQuizData.questions.length > 1 && (
                                <Button
                                  type="button"
                                  onClick={() => removeQuestion(questionIndex, true)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <Label>Question Text</Label>
                              <Textarea
                                value={question.text}
                                onChange={(e) => updateQuestion(questionIndex, "text", e.target.value, true)}
                                placeholder="Enter your question"
                                rows={2}
                              />
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <Label>Options (2-4 options)</Label>
                                {question.options.length < 4 && (
                                  <Button
                                    type="button"
                                    onClick={() => addOption(questionIndex, true)}
                                    variant="outline"
                                    size="sm"
                                  >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add Option
                                  </Button>
                                )}
                              </div>

                              <div className="space-y-2">
                                {question.options.map((option, optionIndex) => (
                                  <div key={optionIndex} className="flex items-center gap-2">
                                    <Input
                                      value={option}
                                      onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value, true)}
                                      placeholder={`Option ${optionIndex + 1}`}
                                    />
                                    {question.options.length > 2 && (
                                      <Button
                                        type="button"
                                        onClick={() => removeOption(questionIndex, optionIndex, true)}
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-700"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <Label>Correct Answer</Label>
                              <select
                                value={question.correctAns}
                                onChange={(e) => updateQuestion(questionIndex, "correctAns", e.target.value, true)}
                                className="w-full p-2 border border-gray-300 rounded-md"
                              >
                                <option value="">Select correct answer</option>
                                {question.options
                                  .filter((opt) => opt.trim())
                                  .map((option, index) => (
                                    <option key={index} value={option}>
                                      {option}
                                    </option>
                                  ))}
                              </select>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateQuiz} disabled={isSubmitting}>
                    <Save className="w-4 h-4 mr-2" />
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="flex-1">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the quiz "{quiz.title}" and all its
                    questions.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDeleteQuiz(quiz.id)} className="bg-red-600 hover:bg-red-700">
                    Delete Quiz
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderQuestionForm = (question: any, questionIndex: number, isEdit = false) => (
    <Card key={questionIndex} className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Question {questionIndex + 1}</CardTitle>
          {(isEdit ? editQuizData.questions.length : quiz.questions.length) > 1 && (
            <Button
              type="button"
              onClick={() => removeQuestion(questionIndex, isEdit)}
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Question Text</Label>
          <Textarea
            value={question.text}
            onChange={(e) => updateQuestion(questionIndex, "text", e.target.value, isEdit)}
            placeholder="Enter your question"
            rows={2}
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Options (2-4 options)</Label>
            {question.options.length < 4 && (
              <Button type="button" onClick={() => addOption(questionIndex, isEdit)} variant="outline" size="sm">
                <Plus className="w-3 h-3 mr-1" />
                Add Option
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {question.options.map((option: string, optionIndex: number) => (
              <div key={optionIndex} className="flex items-center gap-2">
                <Input
                  value={option}
                  onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value, isEdit)}
                  placeholder={`Option ${optionIndex + 1}`}
                  required
                />
                {question.options.length > 2 && (
                  <Button
                    type="button"
                    onClick={() => removeOption(questionIndex, optionIndex, isEdit)}
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>Correct Answer</Label>
          <select
            value={question.correctAns}
            onChange={(e) => updateQuestion(questionIndex, "correctAns", e.target.value, isEdit)}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          >
            <option value="">Select correct answer</option>
            {question.options
              .filter((opt: string) => opt.trim())
              .map((option: string, index: number) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
          </select>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Teacher Dashboard</h1>
        <p className="text-gray-600">Create and manage secure quizzes for your students</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Create Quiz</TabsTrigger>
          <TabsTrigger value="manage">Manage Quizzes</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          {createdQuizId && <QuizSuccessCard quizId={createdQuizId} title={quiz.title || "Untitled Quiz"} />}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Create New Quiz</CardTitle>
                  <CardDescription>
                    Design a secure quiz with multiple-choice questions or upload from Excel file.
                  </CardDescription>
                </div>

                {/* Toggle Button */}
                <div className="flex items-center gap-2">
                  <FileText className={`w-4 h-4 ${inputMode === "form" ? "text-blue-600" : "text-gray-400"}`} />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setInputMode(inputMode === "form" ? "upload" : "form")
                      setSubmitMessage("")
                      setUploadedFile(null)
                      setIsFileReady(false)
                    }}
                    className="p-1"
                  >
                    {inputMode === "form" ? (
                      <ToggleLeft className="w-6 h-6 text-gray-400" />
                    ) : (
                      <ToggleRight className="w-6 h-6 text-blue-600" />
                    )}
                  </Button>
                  <Upload className={`w-4 h-4 ${inputMode === "upload" ? "text-blue-600" : "text-gray-400"}`} />
                </div>
              </div>

              <div className="text-sm text-gray-600">
                {inputMode === "form" ? "Using Form Input" : "Using File Upload"}
              </div>
            </CardHeader>

            <CardContent>
              {inputMode === "form" ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Quiz Metadata */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Quiz Title</Label>
                      <Input
                        id="title"
                        value={quiz.title}
                        onChange={(e) => setQuiz((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter quiz title"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="instructions">Instructions</Label>
                      <Textarea
                        id="instructions"
                        value={quiz.instructions}
                        onChange={(e) => setQuiz((prev) => ({ ...prev, instructions: e.target.value }))}
                        placeholder="Enter quiz instructions for students"
                        rows={3}
                        required
                      />
                    </div>
                  </div>

                  {/* Questions */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Questions</h3>
                      <Button type="button" onClick={() => addQuestion()} variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Question
                      </Button>
                    </div>

                    {quiz.questions.map((question, questionIndex) =>
                      renderQuestionForm(question, questionIndex, false),
                    )}
                  </div>

                  {submitMessage && (
                    <div
                      className={`p-3 rounded-md ${
                        submitMessage.includes("Error") || submitMessage.includes("Please")
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-green-50 text-green-700 border border-green-200"
                      }`}
                    >
                      {submitMessage}
                    </div>
                  )}

                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    <Save className="w-4 h-4 mr-2" />
                    {isSubmitting ? "Creating Quiz..." : "Create Quiz"}
                  </Button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Upload Excel File</h3>
                    <p className="text-gray-600 mb-4">Select an Excel file (.xlsx) containing your quiz questions</p>
                    <Input
                      type="file"
                      accept=".xlsx"
                      onChange={(e) => handleExcelUpload(e.target.files?.[0])}
                      className="max-w-xs mx-auto"
                    />
                  </div>

                  {uploadedFile && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-blue-800">File Ready</span>
                      </div>
                      <p className="text-blue-700 mb-4">File "{uploadedFile.name}" is ready to be processed.</p>
                      <Button onClick={submitFileUpload} disabled={!isFileReady} className="w-full">
                        <Upload className="w-4 h-4 mr-2" />
                        Submit Quiz from File
                      </Button>
                    </div>
                  )}

                  {submitMessage && (
                    <div
                      className={`p-3 rounded-md ${
                        submitMessage.includes("Error") || submitMessage.includes("Please")
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-green-50 text-green-700 border border-green-200"
                      }`}
                    >
                      {submitMessage}
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Excel File Format:</h4>
                    <p className="text-sm text-gray-600 mb-2">Your Excel file should have the following columns:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>
                        • <strong>Quiz Title</strong> (first row only)
                      </li>
                      <li>
                        • <strong>Quiz Instructions</strong> (first row only)
                      </li>
                      <li>
                        • <strong>Question Text</strong>
                      </li>
                      <li>
                        • <strong>Option A</strong>, <strong>Option B</strong>, <strong>Option C</strong>,{" "}
                        <strong>Option D</strong>
                      </li>
                      <li>
                        • <strong>Correct Answer</strong>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Your Quizzes</h2>
              <p className="text-gray-600">Manage and share your created quizzes</p>
            </div>
            <Button onClick={fetchQuizzes} variant="outline" disabled={isLoadingQuizzes}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingQuizzes ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {submitMessage && (
            <div
              className={`p-3 rounded-md ${
                submitMessage.includes("Error")
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-green-50 text-green-700 border border-green-200"
              }`}
            >
              {submitMessage}
            </div>
          )}

          {isLoadingQuizzes ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading quizzes...</p>
              </div>
            </div>
          ) : quizzes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <BookOpen className="w-16 h-16 mx-auto mb-4" />
                </div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No quizzes created yet</h3>
                <p className="text-gray-500 mb-4">Create your first quiz to get started</p>
                <Button onClick={() => setActiveTab("create")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Quiz
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {quizzes.map((quiz) => (
                <QuizCard key={quiz.id} quiz={quiz} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}


