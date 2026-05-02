
export const storage = {
  getUserProfile: () => {
    const data = localStorage.getItem('condoflow_user');
    if (!data) {
      const defaultUser = {
        name: 'Ricardo Mendes',
        role: 'Síndico',
        condo: 'Condominio Solar',
        avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200'
      };
      localStorage.setItem('condoflow_user', JSON.stringify(defaultUser));
      return defaultUser;
    }
    return JSON.parse(data);
  },
  saveUserProfile: (user: any) => {
    localStorage.setItem('condoflow_user', JSON.stringify(user));
  }
};
