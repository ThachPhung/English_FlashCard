const RESULT_KEY = 'last_study_result';

export function saveStudyResult(result, deckId) {
  sessionStorage.setItem(RESULT_KEY, JSON.stringify({ result, deckId: deckId ?? null }));
}

export function loadStudyResult() {
  try {
    const raw = sessionStorage.getItem(RESULT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearStudyResult() {
  sessionStorage.removeItem(RESULT_KEY);
}
