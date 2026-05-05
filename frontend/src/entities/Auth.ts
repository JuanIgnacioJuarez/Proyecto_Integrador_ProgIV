export interface AuthUser {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}
