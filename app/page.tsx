"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Users, Shield, Clock } from "lucide-react"

export default function HomePage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Secure Quiz System</h1>
        <p className="text-xl text-gray-600 mb-8">A comprehensive quiz platform with advanced security features</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Teacher Card */}
        <Card className="border-2 border-blue-200 hover:border-blue-300 transition-colors">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Teacher Portal</CardTitle>
            <CardDescription>Create and manage secure quizzes with multiple-choice questions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Create quizzes with 2-4 answer options</li>
              <li>• Set quiz instructions and metadata</li>
              <li>• Automatic validation and error checking</li>
              <li>• Question ordering and management</li>
            </ul>
            <Link href="/teacher">
              <Button className="w-full" size="lg">
                Access Teacher Portal
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Student Card */}
        <Card className="border-2 border-green-200 hover:border-green-300 transition-colors">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Student Portal</CardTitle>
            <CardDescription>Take secure quizzes with advanced anti-cheat protection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Fullscreen mode enforcement</li>
              <li>• 1-minute timer per question</li>
              <li>• Tab-switch detection and warnings</li>
              <li>• Automatic submission and scoring</li>
            </ul>
            <div className="text-center text-sm text-gray-500 mb-4">Enter Quiz ID to start</div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Quiz ID"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                id="quiz-id-input"
              />
              <Button
                onClick={() => {
                  const input = document.getElementById("quiz-id-input") as HTMLInputElement
                  if (input.value.trim()) {
                    window.location.href = `/student/quiz/${input.value.trim()}`
                  }
                }}
              >
                Start Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Features */}
      <Card className="mb-8">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Security Features</CardTitle>
          <CardDescription>Advanced anti-cheat mechanisms to ensure quiz integrity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Access Control</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Mandatory fullscreen mode</li>
                <li>• Disabled right-click context menu</li>
                <li>• Blocked developer tools shortcuts</li>
                <li>• Copy/paste prevention</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Monitoring</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Tab switching detection (3-strike system)</li>
                <li>• Automatic quiz termination on violations</li>
                <li>• Time tracking per question</li>
                <li>• Answer timestamping</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quiz Features */}
      <Card>
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-purple-600" />
          </div>
          <CardTitle className="text-2xl">Quiz Features</CardTitle>
          <CardDescription>Comprehensive quiz management and taking experience</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <h3 className="font-semibold mb-2">Timed Questions</h3>
              <p className="text-sm text-gray-600">Each question has a 60-second timer with automatic progression</p>
            </div>
            <div className="text-center">
              <h3 className="font-semibold mb-2">No Backtracking</h3>
              <p className="text-sm text-gray-600">Students cannot return to previous questions once answered</p>
            </div>
            <div className="text-center">
              <h3 className="font-semibold mb-2">Instant Results</h3>
              <p className="text-sm text-gray-600">Automatic scoring and immediate feedback upon completion</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
