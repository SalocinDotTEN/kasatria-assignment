import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(import.meta.env.VITE_GOOGLE_AUTH_CLIENT_ID, '', import.meta.env.VITE_GOOGLE_AUTH_REDIRECT_URI)

const signInWithGoogle = async () => {
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email'],
    redirect_uri: import.meta.env.VITE_GOOGLE_AUTH_REDIRECT_URI,
  });
  window.location.href = authUrl;
}

const handleAuthCallback = async (code: string) => {
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  return tokens;
}

export { signInWithGoogle, handleAuthCallback };
