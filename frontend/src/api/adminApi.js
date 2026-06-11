import client from './client';

export const getMemberProgress = (userId) =>
  client.get(`/admin/members/${userId}/progress`);

export const getMemberDecks = (userId) =>
  client.get(`/admin/members/${userId}/decks`);
