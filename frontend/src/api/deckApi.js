import client from './client';

export const getDecks = (params) => client.get('/decks', { params });
export const getDeck = (id, params) => client.get(`/decks/${id}`, { params });
export const createDeck = (data) => client.post('/decks', data);
export const updateDeck = (id, data) => client.patch(`/decks/${id}`, data);
export const deleteDeck = (id) => client.delete(`/decks/${id}`);
