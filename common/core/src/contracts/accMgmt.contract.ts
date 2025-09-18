export interface EnsureFromJwtMsg {
  sub: string;
  iss?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  preferred_username?: string;
}

export interface EnsureFromJwtResult {
  userId: string;
  isFirstLogin: boolean;
}
