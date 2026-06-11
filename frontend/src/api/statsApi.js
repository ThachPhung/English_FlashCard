import client from './client';

export const getOverview = () => client.get('/stats/overview');
export const getDailyStats = (days = 30) => client.get('/stats/daily', { params: { days } });
export const getDeckStats = (deckId) => client.get(`/stats/decks/${deckId}`);
