import client from './client';

export const getUsers = () => client.get('/users');
export const createUser = (data) => client.post('/users', data);
export const updateUser = (id, data) => client.patch(`/users/${id}`, data);
export const resetPassword = (id, newPassword) =>
  client.post(`/users/${id}/reset-password`, { new_password: newPassword });
export const lockUser = (id) => client.post(`/users/${id}/lock`);
export const unlockUser = (id) => client.post(`/users/${id}/unlock`);
