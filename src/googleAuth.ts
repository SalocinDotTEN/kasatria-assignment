import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client('978135364128-iv05neivsaf13qarecjqhqd8sb9275hd.apps.googleusercontent.com')

const signInWithGoogle = async () => {
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email']
  });
  window.location.href = authUrl;
}

const handleAuthCallback = async (code: string) => {
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  return tokens;
}

export { signInWithGoogle, handleAuthCallback };
