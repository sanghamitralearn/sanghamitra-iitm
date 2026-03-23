import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import About from './pages/About'
import Contact from './pages/Contact'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import English from './pages/English'
import Math from './pages/Math'
import Statistics from './pages/Statistics'
import Programming from './pages/Programming'
import Grammar from './pages/Grammar'
import Vocabulary from './pages/Vocabulary'
import ReadingComprehension from './pages/ReadingComprehension'
import Writing from './pages/Writing'
import DiagnosticTest from './pages/DiagnosticTest'
import Assessment from './pages/Assessment'
import AdminDashboard from './pages/AdminDashboard'
import SubjectAnalysis from './pages/SubjectAnalysis'
import MathDashboard from './pages/MathDashboard'
import MathExamAnalysis from './pages/MathExamAnalysis'
import Algebra from './pages/Algebra'
import IIITMMath from './pages/courses/IIITM-math'
import AlgebraSubject from './pages/courses/algebra'
import Arithmetic from './pages/courses/arithmetic'
import MathSubject from './pages/courses/Math'
import PDSA from './pages/courses/PDSA'
import Math2 from './pages/courses/Math2'
import StatisticsSubject from './pages/courses/Statistics'
import Statistics2 from './pages/courses/Statistics2'
import Python from './pages/courses/Python'
import AdminSubject from './pages/courses/Admin'
import IITMMathQuiz from './pages/courses/IITMMathQuiz'
import StatisticsQuiz from './pages/courses/StatisticsQuiz'

// PDSA quiz type imports
import PdsaTestQuiz from './pages/courses/PDSA/PdsaTestQuiz'
import PdsaCodingQuiz from './pages/courses/PDSA/PdsaCodingQuiz'
import PdsaInterviewQuiz from './pages/courses/PDSA/PdsaInterviewQuiz'

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/english" element={<English />} />
            <Route path="/math" element={<Math />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/programming" element={<Programming />} />
            <Route path="/english/grammar" element={<Grammar />} />
            <Route path="/english/vocabulary" element={<Vocabulary />} />
            <Route path="/english/reading-comprehension" element={<ReadingComprehension />} />
            <Route path="/english/writing" element={<Writing />} />
            <Route path="/diagnostic-test" element={<DiagnosticTest />} />
            <Route path="/assessment" element={<Assessment />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/math" element={<MathDashboard />} />
            <Route path="/admin/analysis/:subject/:userId" element={<SubjectAnalysis />} />
            <Route path="/admin/math/exam/:email/:topic/:attemptNumber" element={<MathExamAnalysis />} />
            <Route path="/algebra" element={<Algebra />} />
            <Route path="/math2" element={<Math2 />} />
            <Route path="/statistics2" element={<Statistics2 />} />
            <Route path="/computational-thinking" element={<IIITMMath />} />
            <Route path="/dbms" element={<AdminSubject />} />
            
            {/* Course-specific routes */}
            <Route path="/courses/IIITM-math" element={<IIITMMath />} />
            <Route path="/courses/algebra" element={<AlgebraSubject />} />
            <Route path="/courses/arithmetic" element={<Arithmetic />} />
            <Route path="/courses/math" element={<MathSubject />} />
            <Route path="/courses/pdsa" element={<PDSA />} />
            <Route path="/courses/math2" element={<Math2 />} />
            <Route path="/courses/statistics" element={<StatisticsSubject />} />
            <Route path="/courses/statistics2" element={<Statistics2 />} />
            <Route path="/courses/python" element={<Python />} />
            <Route path="/courses/admin" element={<AdminSubject />} />
            
            {/* IIITM Math Quiz — dynamic, DB-driven */}
            <Route path="/courses/IIITM-math/quiz/:topic" element={<IITMMathQuiz />} />

            {/* Statistics Quiz — dynamic, DB-driven */}
            <Route path="/courses/statistics/quiz/:topic" element={<StatisticsQuiz />} />

            {/* PDSA quiz routes – parameterized */}
            <Route path="/courses/pdsa/test/:weekId" element={<PdsaTestQuiz />} />
            <Route path="/courses/pdsa/coding/:weekId" element={<PdsaCodingQuiz />} />
            <Route path="/courses/pdsa/interview/:weekId" element={<PdsaInterviewQuiz />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App
