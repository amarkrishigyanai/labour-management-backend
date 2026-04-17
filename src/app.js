import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import userRouter from "./routes/user.routes.js";

const app = express();

// ── Middleware ──────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'Labour Hire API is running' });
});

// ── Routes ──────────────────────────────────────────────
// (You will add these as you build each feature)
// app.use('/api/v1/users', require('./routes/authRoutes'));
app.use("/api/v1/users", userRouter);


// ── 404 Handler ─────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global Error Handler ────────────────────────────────
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    errors: err.errors || [],
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

export default app;