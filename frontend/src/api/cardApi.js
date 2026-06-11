import client from './client';

export const getCards = (deckId, params = {}) =>
  client.get(`/decks/${deckId}/cards`, { params });

export const getCard = (id) => client.get(`/cards/${id}`);
export const createCard = (deckId, data) => client.post(`/decks/${deckId}/cards`, data);
export const updateCard = (id, data) => client.patch(`/cards/${id}`, data);
export const deleteCard = (id) => client.delete(`/cards/${id}`);

export const importPreview = (deckId, file) => {
  const form = new FormData();
  form.append('file', file);
  return client.post(`/decks/${deckId}/import/preview`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const importCards = (deckId, file, skipDuplicates = true) => {
  const form = new FormData();
  form.append('file', file);
  return client.post(`/decks/${deckId}/import?skip_duplicates=${skipDuplicates}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
