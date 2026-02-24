/** JWT config for AuthModule. */
export const jwtConfig = () => ({
  secret: process.env.JWT_SECRET ?? 'change-me-in-production',
  signOptions: { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' },
});
