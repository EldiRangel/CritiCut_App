export type UserRole = 'user' | 'critic';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

/** Usuario sin contraseña, seguro para exponer en la sesión. */
export type PublicUser = Omit<User, 'password'>;
