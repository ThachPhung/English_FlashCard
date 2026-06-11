import client from './client';

export const startSession = (deckId) =>
  client.post('/study/sessions', { deck_id: deckId || null });

export const getNextCard = (sessionId) =>
  client.get(`/study/sessions/${sessionId}/next-card`);

export const submitAnswer = (sessionId, data) =>
  client.post(`/study/sessions/${sessionId}/answer`, data);

export const undoAnswer = (sessionId) =>
  client.post(`/study/sessions/${sessionId}/undo`);

export const finishSession = (sessionId) =>
  client.post(`/study/sessions/${sessionId}/finish`);

export const suspendCard = (cardId) =>
  client.post(`/study/cards/${cardId}/suspend`);
