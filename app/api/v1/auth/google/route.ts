import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/v1/auth/google/callback`;

  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  // If Google OAuth credentials are not set, provide a helpful setup page with fallback demo option
  if (!clientId || !clientSecret) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Google Sign-In Setup | Hishab Rakhi</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #0c1512;
      color: #e5e9e6;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    .card {
      background-color: #172420;
      border: 1px solid #233731;
      border-radius: 20px;
      padding: 32px;
      max-width: 520px;
      width: 100%;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    }
    h2 {
      margin-top: 0;
      color: #34d399;
      font-size: 22px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    p {
      color: #9cb1a9;
      font-size: 14px;
      line-height: 1.6;
    }
    .code-box {
      background: #0f1c18;
      border: 1px solid #1f332c;
      padding: 12px 16px;
      border-radius: 10px;
      font-family: monospace;
      font-size: 13px;
      color: #a7f3d0;
      word-break: break-all;
      margin: 12px 0;
    }
    .steps {
      margin: 16px 0;
      padding-left: 20px;
      font-size: 13.5px;
      color: #c0d3cb;
    }
    .steps li {
      margin-bottom: 8px;
    }
    .btn {
      display: inline-block;
      width: 100%;
      text-align: center;
      background: #10b981;
      color: #062b1e;
      font-weight: 700;
      padding: 12px 0;
      border-radius: 12px;
      text-decoration: none;
      font-size: 14px;
      transition: background 0.2s;
      border: none;
      cursor: pointer;
      box-sizing: border-box;
      margin-top: 8px;
    }
    .btn:hover {
      background: #34d399;
    }
    .btn-secondary {
      background: transparent;
      color: #9cb1a9;
      border: 1px solid #233731;
      margin-top: 10px;
    }
    .btn-secondary:hover {
      background: #1f332c;
      color: #ffffff;
    }
  </style>
</head>
<body>
  <div class="card">
    <h2>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/></svg>
      Google Sign-In Configuration
    </h2>
    <p>To enable Google Sign-In with your own credentials, configure these environment variables in your Vercel project settings or <code>.env.local</code>:</p>
    
    <div class="code-box">
      GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com<br/>
      GOOGLE_CLIENT_SECRET=your-client-secret
    </div>

    <ol class="steps">
      <li>Visit the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" style="color: #34d399;">Google Cloud Console</a>.</li>
      <li>Create an <strong>OAuth 2.0 Client ID</strong> (Web Application).</li>
      <li>Set <strong>Authorized redirect URIs</strong> to:
        <div class="code-box" style="margin-top: 6px;">${redirectUri}</div>
      </li>
      <li>Add <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> to Vercel Environment Variables.</li>
    </ol>

    <div style="margin-top: 20px;">
      <a href="/api/v1/auth/google/callback?demo=true" class="btn">Test with Demo Google Account</a>
      <a href="/auth/login" class="btn btn-secondary">Return to Sign In</a>
    </div>
  </div>
</body>
</html>`;
    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // Google OAuth 2.0 Authorization Endpoint
  const state = crypto.randomBytes(16).toString('hex');
  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', clientId);
  googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'openid email profile');
  googleAuthUrl.searchParams.set('access_type', 'online');
  googleAuthUrl.searchParams.set('prompt', 'select_account');
  googleAuthUrl.searchParams.set('state', state);

  const response = NextResponse.redirect(googleAuthUrl.toString());
  // Store state in an HTTP-only temporary cookie for CSRF verification
  response.cookies.set('hr_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 300, // 5 minutes
  });

  return response;
}

