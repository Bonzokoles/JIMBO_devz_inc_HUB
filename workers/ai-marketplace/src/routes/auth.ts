import { Hono } from "hono";
import { SignJWT, jwtVerify } from "jose";
import { v4 as uuidv4 } from "uuid";

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
};

const router = new Hono<{ Bindings: Bindings }>();

// POST /auth/register - Create account
router.post("/register", async (c) => {
  const { email, password, name } = await c.req.json();

  try {
    const userId = uuidv4();

    await c.env.DB.prepare(
      `
      INSERT INTO users (id, email, password_hash, name, api_key)
      VALUES (?, ?, ?, ?, ?)
    `,
    )
      .bind(userId, email, hashPassword(password), name, generateApiKey())
      .run();

    const secret = new TextEncoder().encode(c.env.JWT_SECRET);
    const token = await new SignJWT({ userId, email })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("30d")
      .sign(secret);

    return c.json({ token, userId }, 201);
  } catch (err) {
    return c.json({ error: "Failed to register" }, 400);
  }
});

// POST /auth/login - Login
router.post("/login", async (c) => {
  const { email, password } = await c.req.json();

  try {
    const user = await c.env.DB.prepare("SELECT * FROM users WHERE email = ?")
      .bind(email)
      .first();

    if (!user || !verifyPassword(password, user.password_hash)) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    const secret = new TextEncoder().encode(c.env.JWT_SECRET);
    const token = await new SignJWT({ userId: user.id, email: user.email })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("30d")
      .sign(secret);

    await c.env.DB.prepare(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?",
    )
      .bind(user.id)
      .run();

    return c.json({ token, userId: user.id });
  } catch (err) {
    return c.json({ error: "Login failed" }, 500);
  }
});

// GET /auth/profile - Get current user profile
router.get("/profile", async (c) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return c.json({ error: "Unauthorized" }, 401);

  try {
    const secret = new TextEncoder().encode(c.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const user = await c.env.DB.prepare(
      "SELECT id, email, name, subscription_tier, monthly_budget, spent_this_month FROM users WHERE id = ?",
    )
      .bind(payload.userId)
      .first();

    if (!user) return c.json({ error: "User not found" }, 404);
    return c.json(user);
  } catch (err) {
    return c.json({ error: "Invalid token" }, 401);
  }
});

// POST /auth/verify-token - Verify JWT token
router.post("/verify-token", async (c) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return c.json({ valid: false }, 401);

  try {
    const secret = new TextEncoder().encode(c.env.JWT_SECRET);
    await jwtVerify(token, secret);
    return c.json({ valid: true });
  } catch (err) {
    return c.json({ valid: false }, 401);
  }
});

// Helper functions
function hashPassword(password: string): string {
  // Use bcrypt or similar in production
  return btoa(password);
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

function generateApiKey(): string {
  return "sk_" + uuidv4().replace(/-/g, "");
}

export default router;
