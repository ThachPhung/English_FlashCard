import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  finishSession,
  getNextCard,
  startSession,
  submitAnswer,
  suspendCard,
  undoAnswer,
} from '../api/studyApi';
import Flashcard from '../components/Flashcard';
import ProgressBar from '../components/ProgressBar';
import { getSettings } from '../api/settingsApi';
import { saveStudyResult } from '../utils/studyResultStorage';

function parseDeckId(raw) {
  if (!raw) return null;
  const id = parseInt(raw, 10);
  return Number.isFinite(id) ? id : null;
}

export default function StudyPage() {
  const { deckId: deckIdParam } = useParams();
  const deckId = parseDeckId(deckIdParam);
  const sessionKey = deckId ? `study_session_${deckId}` : 'study_session_all';
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [card, setCard] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const cardShownAt = useRef(Date.now());

  useEffect(() => {
    getSettings()
      .then((r) => setSoundEnabled(r.data.sound_enabled))
      .catch(() => setSoundEnabled(true));
  }, []);

  useEffect(() => {
    if (deckIdParam && deckId === null) {
      navigate('/study/result', { replace: true });
      return;
    }

    const init = async () => {
      setLoading(true);
      setError('');
      try {
        const savedSession = localStorage.getItem(sessionKey);
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          const next = await getNextCard(parsed.id);
          if (next.data.status === 'completed' || !next.data.current_card) {
            localStorage.removeItem(sessionKey);
            setSession(next.data);
            setCard(null);
          } else {
            setSession(next.data);
            setCard(next.data.current_card);
          }
        } else {
          const res = await startSession(deckId);
          setSession(res.data);
          setCard(res.data.current_card);
          if (res.data.current_card) {
            localStorage.setItem(sessionKey, JSON.stringify({ id: res.data.id }));
          }
        }
      } catch (err) {
        localStorage.removeItem(sessionKey);
        setError(err.response?.data?.detail || 'Không tạo được phiên học');
      } finally {
        setLoading(false);
        cardShownAt.current = Date.now();
        setShowAnswer(false);
      }
    };
    init();
  }, [deckId, deckIdParam, navigate, sessionKey]);

  const goToResult = (resultData) => {
    saveStudyResult(resultData, deckId);
    navigate('/study/result', { state: { result: resultData, deckId } });
  };

  const finishAndGoResult = async (sessionId) => {
    setFinishing(true);
    setError('');
    try {
      const result = await finishSession(sessionId);
      localStorage.removeItem(sessionKey);
      goToResult(result.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Không thể xem kết quả. Thử lại.');
    } finally {
      setFinishing(false);
    }
  };

  const refreshNext = async (sessionId) => {
    const next = await getNextCard(sessionId);
    setSession(next.data);
    setCard(next.data.current_card);
    setShowAnswer(false);
    cardShownAt.current = Date.now();
    if (!next.data.current_card) {
      await finishAndGoResult(sessionId);
    }
  };

  const handleFlip = () => {
    if (!submitting && card) {
      setShowAnswer((prev) => !prev);
    }
  };

  const handleRate = async (rating) => {
    if (!card || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const responseTime = Date.now() - cardShownAt.current;
      await submitAnswer(session.id, {
        card_id: card.id,
        rating,
        response_time_ms: responseTime,
      });
      await refreshNext(session.id);
    } catch (err) {
      setError(err.response?.data?.detail || 'Không ghi nhận được câu trả lời');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUndo = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await undoAnswer(session.id);
      const next = await getNextCard(session.id);
      setSession(next.data);
      setCard(next.data.current_card);
      setShowAnswer(false);
      cardShownAt.current = Date.now();
    } catch (err) {
      setError(err.response?.data?.detail || 'Không hoàn tác được');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuspend = async () => {
    if (!card || submitting) return;
    setSubmitting(true);
    try {
      await suspendCard(card.id);
      await refreshNext(session.id);
    } catch (err) {
      setError(err.response?.data?.detail || 'Không tạm dừng được thẻ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExit = async () => {
    if (session) {
      try {
        await finishSession(session.id);
      } catch {
        /* ignore */
      }
      localStorage.removeItem(sessionKey);
    }
    navigate(deckId ? `/decks/${deckId}` : '/decks');
  };

  if (loading) return <p className="text-center py-12">Đang tải phiên học...</p>;

  if (error && !session) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <Link to="/decks" className="text-indigo-600 hover:underline">← Quay lại danh sách bộ từ</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link to={deckId ? `/decks/${deckId}` : '/decks'} className="text-sm text-indigo-600 hover:underline">
          ← Quay lại bộ từ
        </Link>
        <button onClick={handleExit} className="text-sm text-slate-500 hover:text-slate-700">
          Kết thúc phiên
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30">
          {error}
        </div>
      )}

      {session && (
        <ProgressBar current={session.completed_cards} total={session.total_cards} />
      )}

      <Flashcard
        card={card}
        showAnswer={showAnswer}
        onFlip={handleFlip}
        onRate={handleRate}
        onSuspend={card ? handleSuspend : null}
        onUndo={session?.completed_cards > 0 ? handleUndo : null}
        submitting={submitting || finishing}
        soundEnabled={soundEnabled}
      />

      {!card && session && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => finishAndGoResult(session.id)}
            disabled={finishing}
            className="rounded-lg bg-indigo-600 px-8 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {finishing ? 'Đang tải kết quả...' : 'Xem kết quả'}
          </button>
        </div>
      )}
    </div>
  );
}
