# Supabase email templates

So users can type the 8-digit code into the forgot-password boxes, the **Reset Password** email must include the token.

## Add the 8-digit code to the Recovery email

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **Authentication** → **Email Templates**.
3. Open the **Reset Password** (recovery) template.
4. In the **Message body**, include the 8-digit token so it appears in the email.

### Option A: Copy the full template

Replace the **Message body** with this (or use `recovery-with-token.html`). It shows:

- **Your 8-digit code: `{{ .Token }}`** (large, easy to copy)
- A “Reset password” link as well (for users who prefer the link)

**Copy-paste this into the Reset Password message body in Supabase:**

```
<h2>Reset your password</h2>

<p>Use the 8-digit code below to reset your password on InvestMind:</p>

<p style="font-size: 24px; font-weight: bold; letter-spacing: 0.25em; margin: 16px 0;">{{ .Token }}</p>

<p>Enter this code in the boxes on the reset password page.</p>

<p>You can also click the link below to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset password</a></p>

<p>If you didn't request this, you can ignore this email.</p>
```

### Option B: Add one line to your current template

If you prefer to keep your existing Reset Password template, add this line where you want the code to appear:

```html
<p>Your code: <strong>{{ .Token }}</strong></p>
```

Supabase replaces `{{ .Token }}` with the actual 8-digit OTP (e.g. `14705037`).

5. **Save** the template.

After this, when users request a password reset they’ll receive an email that contains the 8-digit code they can enter in the boxes on the forgot-password screen.
