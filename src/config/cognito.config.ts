import { registerAs } from '@nestjs/config';

export default registerAs('cognito', () => ({
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  clientId: process.env.COGNITO_CLIENT_ID,
  region: process.env.COGNITO_REGION || 'us-east-1',
  get authority(): string {
    return `https://cognito-idp.${this.region}.amazonaws.com/${this.userPoolId}`;
  },
  get jwksUri(): string {
    return `${this.authority}/.well-known/jwks.json`;
  },
}));
