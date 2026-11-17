import { lazy, Suspense } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './components/layout/AdminLayout.jsx';
import PublicLayout from './components/layout/PublicLayout.jsx';
import { PageLoader } from './components/common/ui.jsx';

// Student pages load fast; admin pages are split into their own chunks.
import QuizLanding from './pages/QuizLanding.jsx';
import StudentQuiz from './pages/StudentQuiz.jsx';
import StudentResult from './pages/StudentResult.jsx';

const AdminLogin = lazy(() => import('./pages/AdminLogin.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const ManageQuizzes = lazy(() => import('./pages/ManageQuizzes.jsx'));
const CreateQuiz = lazy(() => import('./pages/CreateQuiz.jsx'));
const QuizOverview = lazy(() => import('./pages/QuizOverview.jsx'));
const ImportQuestions = lazy(() => import('./pages/ImportQuestions.jsx'));
const QuestionPreview = lazy(() => import('./pages/QuestionPreview.jsx'));
const QuizResults = lazy(() => import('./pages/QuizResults.jsx'));
const AttemptDetail = lazy(() => import('./pages/AttemptDetail.jsx'));
const ResultsIndex = lazy(() => import('./pages/ResultsIndex.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="font-display text-6xl font-semibold text-ink-300">404</div>
      <h1 className="mt-2 text-lg font-semibold">Page not found</h1>
      <p className="mt-1 text-sm text-ink-500">If you were given a quiz link, check that it was copied completely.</p>
      <Link to="/admin" className="btn-secondary mt-6">Admin dashboard</Link>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />

        {/* Public student routes */}
        <Route element={<PublicLayout />}>
          <Route path="/quiz/:slug" element={<QuizLanding />} />
          <Route path="/result/:token" element={<StudentResult />} />
        </Route>
        <Route path="/quiz/:slug/attempt" element={<StudentQuiz />} />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="quizzes" element={<ManageQuizzes />} />
          <Route path="quizzes/new" element={<CreateQuiz />} />
          <Route path="quizzes/:quizId" element={<QuizOverview />} />
          <Route path="quizzes/:quizId/edit" element={<CreateQuiz />} />
          <Route path="quizzes/:quizId/import" element={<ImportQuestions />} />
          <Route path="quizzes/:quizId/questions" element={<QuestionPreview />} />
          <Route path="quizzes/:quizId/results" element={<QuizResults />} />
          <Route path="quizzes/:quizId/results/:attemptId" element={<AttemptDetail />} />
          <Route path="import" element={<ImportQuestions />} />
          <Route path="results" element={<ResultsIndex />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
