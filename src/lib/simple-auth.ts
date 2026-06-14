export const getUser = () => ({ id: '1', name: 'User', email: 'user@test.com' });
export const isAuthenticated = () => true;
export const auth = { getUser, isAuthenticated, signIn: async () => null, signOut: async () => null };
export default auth;
