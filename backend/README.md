# OTP Verification Backend Setup

## 1. Install Required Packages

```
cd backend
npm install express dotenv nodemailer express-session cors helmet morgan
```

## 2. Start the Server

For development (with auto-reload):

```
npm run dev
```

For production:

```
npm run build
npm start
```

## 3. Example Frontend Axios Requests

```js
// Send OTP
axios.post(
  "http://localhost:5000/api/send-otp",
  { email: "user@example.com" },
  { withCredentials: true },
);

// Verify OTP
axios.post(
  "http://localhost:5000/api/verify-otp",
  { otp: "123456" },
  { withCredentials: true },
);
```

## 4. How Session Works

- When a user requests an OTP, the backend generates a 6-digit code and stores it in the session (`req.session.otp`).
- The session is managed by `express-session` and stored in memory (no database needed).
- The session ID is sent to the frontend as a cookie (`sid`).
- When the user submits the OTP, the backend checks the submitted code against the one stored in the session.
- If they match, verification succeeds; otherwise, it fails.
- The session ensures that OTPs are user-specific and secure, and only accessible to the user with the correct session cookie.
