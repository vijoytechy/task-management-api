export interface JwtPayloadBase {
  sub: string;
  email: string;
  role: string;
}

export interface JwtStandardClaims {
  iat?: number;
  exp?: number;
}

export interface AccessTokenPayload
  extends JwtPayloadBase,
    JwtStandardClaims {
  tokenType: 'access';
}

export interface RefreshTokenPayload
  extends JwtPayloadBase,
    JwtStandardClaims {
  tokenType: 'refresh';
}

export type JwtPayload = AccessTokenPayload | RefreshTokenPayload;
