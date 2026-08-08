import client from './client';

// Auth
export const login = (data) => client.post('/auth/login', data).then((r) => r.data);
export const register = (data) => client.post('/auth/register', data).then((r) => r.data);
export const fetchMe = () => client.get('/auth/me').then((r) => r.data);
export const logoutApi = () => client.post('/auth/logout').then((r) => r.data);
export const changePassword = (data) => client.post('/auth/change-password', data).then((r) => r.data);
export const deleteAccountApi = (password) => client.delete('/users/account', { data: { password } }).then((r) => r.data);

// Posts
export const fetchFeed = (page = 1, tab = 'for-you', userId) =>
  client.get(`/posts?page=${page}&tab=${tab}${userId ? `&userId=${userId}` : ''}`).then((r) => r.data);
export const createPost = (data) => client.post('/posts', data).then((r) => r.data);
export const deletePost = (id) => client.delete(`/posts/${id}`).then((r) => r.data);
export const likePost = (id) => client.post(`/posts/${id}/like`).then((r) => r.data);
export const commentOnPost = (id, text) =>
  client.post(`/posts/${id}/comments`, { text }).then((r) => r.data);
export const sharePost = (id) => client.post(`/posts/${id}/share`).then((r) => r.data);
export const toggleSavePost = (id) => client.post(`/posts/${id}/save`).then((r) => r.data);
export const getUserPosts = (userId) => client.get(`/posts/user/${userId}`).then((r) => r.data);
export const getSavedPosts = () => client.get('/users/saved').then((r) => r.data);
export const getPost = (id) => client.get(`/posts/${id}`).then((r) => r.data);

// Stories
export const fetchStories = () => client.get('/stories').then((r) => r.data);
export const createStory = (data) => client.post('/stories', data).then((r) => r.data);
export const viewStory = (id) => client.post(`/stories/${id}/view`).then((r) => r.data);
export const deleteStory = (id) => client.delete(`/stories/${id}`).then((r) => r.data);

// Users
export const fetchUserProfile = (username) =>
  client.get(`/users/${username}`).then((r) => r.data);
export const toggleFollow = (id) => client.post(`/users/${id}/follow`).then((r) => r.data);
export const searchUsers = (q) => client.get(`/users/search?q=${encodeURIComponent(q)}`).then((r) => r.data);
export const getSuggestions = () => client.get('/users/suggestions').then((r) => r.data);
export const updateProfile = (data) => client.put('/users/profile', data).then((r) => r.data);
export const updateSettings = (data) => client.put('/users/settings', data).then((r) => r.data);
export const getExploreUsers = () => client.get('/users/explore').then((r) => r.data);
export const getConnections = () => client.get('/users/connections').then((r) => r.data);
export const getUserFollowers = (username) => client.get(`/users/${username}/followers`).then((r) => r.data);
export const getUserFollowing = (username) => client.get(`/users/${username}/following`).then((r) => r.data);

// Messages
export const getConversations = () => client.get('/messages').then((r) => r.data);
export const getMessages = (userId) => client.get(`/messages/${userId}`).then((r) => r.data);
export const sendMessage = (userId, data) => client.post(`/messages/${userId}`, data).then((r) => r.data);
export const markConversationRead = (convId) => client.put(`/messages/${convId}/read`).then((r) => r.data);

// Notifications
export const getNotifications = () => client.get('/notifications').then((r) => r.data);
export const markNotificationsRead = () => client.put('/notifications/read').then((r) => r.data);
