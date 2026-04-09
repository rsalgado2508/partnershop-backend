import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { passportJwtSecret } from 'jwks-rsa';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { CognitoUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  private readonly cognitoClientId: string;

  constructor(configService: ConfigService) {
    const region = configService.get<string>('cognito.region');
    const userPoolId = configService.get<string>('cognito.userPoolId');
    const authority = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
    const cognitoClientId = configService.get<string>('cognito.clientId');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      issuer: authority,
      algorithms: ['RS256'],
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri: `${authority}/.well-known/jwks.json`,
      }),
    });

    this.cognitoClientId = cognitoClientId || '';
  }

  validate(payload: Record<string, unknown>): CognitoUser {
    const tokenUse = payload.token_use;
    const clientId = payload.client_id;

    if (tokenUse !== 'access') {
      this.logger.debug(
        `Rejected Cognito token with token_use=${String(tokenUse)}`,
      );
      throw new UnauthorizedException('Invalid Cognito token_use');
    }

    if (clientId !== this.cognitoClientId) {
      this.logger.debug(
        `Rejected Cognito token with client_id=${String(clientId)}`,
      );
      throw new UnauthorizedException('Invalid Cognito client_id');
    }

    return {
      sub: payload.sub as string,
      email: (payload.email as string) || '',
      username:
        (payload.username as string) ||
        (payload['cognito:username'] as string) ||
        (payload.sub as string),
      groups: (payload['cognito:groups'] as string[]) || [],
    };
  }
}
