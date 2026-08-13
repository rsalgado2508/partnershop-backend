import * as Joi from 'joi';

export const appConfigValidationSchema = Joi.object({
  APP_PORT: Joi.number().default(3000),
  APP_ENV: Joi.string()
    .valid('development', 'production', 'staging')
    .default('development'),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),
  COGNITO_USER_POOL_ID: Joi.string().required(),
  COGNITO_CLIENT_ID: Joi.string().required(),
  COGNITO_REGION: Joi.string().default('us-east-1'),
  CORS_ORIGIN: Joi.string().default('http://localhost:4200'),
});
