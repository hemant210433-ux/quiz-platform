'use client';
import { Link, useParams } from '@/lib/router.jsx';
import { adminApi, downloadUrls } from '../services/api.js';
import QuizHeader from '../components/admin/QuizHeader.jsx';
import QuestionEditor from '../components/admin/QuestionEditor.jsx';
import { Alert, ErrorState, PageLoader } from '../components/common/ui.jsx';
import { useQuiz } from '../hooks/useQuiz.js';
import { useToast } from '../hooks/useToast.jsx';

export default function QuestionPreview() {
  const { quizId } = useParams();
  const { quiz, questions, loading, error, setData } = useQuiz(quizId);
  const toast = useToast();

  if (loading && !quiz) return <PageLoader />;
  if (error) return <ErrorState message={error.message} />;

  const locked = quiz.status === 'published';

  const save = async (list) => {
    const r = await adminApi.saveQuestions(quiz.id, list, 'replace');
    setData({ quiz: r.quiz, questions: r.questions, stats: r.stats });
    toast.success(`Saved ${r.stats.total} questions${r.stats.invalid ? ` – ${r.stats.invalid} still invalid` : ''}.`);
  };

  return (
    <div>
      <QuizHeader
        quiz={quiz}
        actions={
          <>
            <a className="btn-secondary btn-sm" href={downloadUrls.questionsJson(quiz.id)}>Export questions JSON</a>
            <a className="btn-secondary btn-sm" href={downloadUrls.quizJson(quiz.id)}>Export full quiz</a>
          </>
        }
      />
      {locked && (
        <div className="mb-4">
          <Alert tone="info" title="Read-only while published">
            Unpublish the quiz on the <Link className="underline" to={`/admin/quizzes/${quiz.id}`}>Overview</Link> tab to edit questions.
          </Alert>
        </div>
      )}
      <QuestionEditor
        key={`${quiz.id}-${quiz.updatedAt}`}
        initialQuestions={questions}
        readOnly={locked}
        actions={locked ? [] : [{ label: 'Save changes', primary: true, onClick: save, disabled: ({ dirty }) => !dirty }]}
      />
    </div>
  );
}
