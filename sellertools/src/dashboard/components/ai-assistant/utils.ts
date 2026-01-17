import * as jose from 'jose';

export async function signWithJose(storeKey: string, jwtKey: string) {
  const payload = {
    storeKey: storeKey,
  };

  // Create a secret key (in production, generate and store this securely)
  const secretKey = new TextEncoder().encode(jwtKey);

  // Sign the payload
  const jwt = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('1h')
    .setIssuedAt()
    .sign(secretKey);

  return jwt;
}
