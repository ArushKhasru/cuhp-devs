import { Request, Response } from "express";
import bcrypt from "bcrypt";
import axios from "axios";
import { randomBytes } from "crypto";
import { User } from "@repo/db";
import { signToken, verifyToken } from "../utils";
import { signinSchema, signupSchema } from "../validators/auth.schema"

const isProduction = process.env.NODE_ENV === "production";
const authCookieMaxAge = 4 * 24 * 60 * 60 * 1000;
const authCookieSameSite = isProduction ? "none" : "lax";
const githubStateCookieName = "github_oauth_state";
const googleStateCookieName = "google_oauth_state";
const githubRedirectCookieName = "github_oauth_redirect";
const googleRedirectCookieName = "google_oauth_redirect";
const oauthStateMaxAge = 10 * 60 * 1000;

type GithubTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GithubProfile = {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
};

type GithubEmail = {
  email: string;
  primary: boolean;
  verified: boolean;
};

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleProfile = {
  sub: string;
  name?: string;
  email?: string;
  email_verified?: boolean;
  picture?: string;
};

const normalizeBaseUrl = (url: string) => url.trim().replace(/\/+$/, "");

const isLocalhostHostname = (hostname: string) =>
  hostname === "localhost" ||
  hostname === "127.0.0.1" ||
  hostname === "::1" ||
  hostname === "[::1]";

const isLocalhostUrl = (url: string) => {
  try {
    return isLocalhostHostname(new URL(url).hostname);
  } catch {
    return false;
  }
};

const getFrontendUrl = () => {
  const url =
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    process.env.NEXT_PUBLIC_APP_URL;

  if (!url) {
    throw new Error("FRONTEND_URL is not defined");
  }

  return normalizeBaseUrl(url);
};

// const getBackendUrl = () =>
//   normalizeBaseUrl(
//     process.env.BACKEND_URL ||
//     process.env.HTTP_BACKEND_URL ||
//     `http://localhost:${process.env.PORT || 3001}`
//   );

const getGithubCallbackUrl = () => {
  const callbackUrl =
    process.env.GITHUB_CALLBACK_URL?.trim();

  if (!callbackUrl) {
    throw new Error("GITHUB_CALLBACK_URL is not defined");
  }

  return callbackUrl;
};

const getGoogleCallbackUrl = () => {
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL?.trim();

  if (!callbackUrl) {
    throw new Error("GOOGLE_CALLBACK_URL is not defined");
  }

  return callbackUrl;
};

const setAuthCookie = (res: Response, token: string) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: authCookieSameSite,
    maxAge: authCookieMaxAge,
  });
};

const clearGithubStateCookie = (res: Response) => {
  res.clearCookie(githubStateCookieName, {
    httpOnly: true,
    secure: isProduction,
    sameSite: authCookieSameSite,
  });
};

const clearGoogleStateCookie = (res: Response) => {
  res.clearCookie(googleStateCookieName, {
    httpOnly: true,
    secure: isProduction,
    sameSite: authCookieSameSite,
  });
};

const clearOAuthRedirectCookie = (res: Response, cookieName: string) => {
  res.clearCookie(cookieName, {
    httpOnly: true,
    secure: isProduction,
    sameSite: authCookieSameSite,
  });
};

const setOAuthRedirectCookie = (res: Response, cookieName: string, frontendUrl: string) => {
  res.cookie(cookieName, frontendUrl, {
    httpOnly: true,
    secure: isProduction,
    sameSite: authCookieSameSite,
    maxAge: oauthStateMaxAge,
  });
};

const redirectToAuthCallback = (
  res: Response,
  params: Record<string, string>,
  frontendUrl?: string
) => {
  const targetFrontend = normalizeBaseUrl(frontendUrl || getFrontendUrl());
  const url = new URL(`${targetFrontend}/auth/callback`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return res.redirect(url.toString());
};

const serializeAuthUser = (user: any) => ({
  id: user._id.toString(),
  name: user.fullName,
  fullName: user.fullName,
  email: user.email,
  studentId: user.studentId,
  program: user.program,
  semester: user.semester,
  interests: user.interests,
  handle: user.handle,
  avatar: user.avatar,
  bio: user.bio,
  theme: user.theme,
  onboardingCompleted: user.onboardingCompleted,
});

const pickGithubEmail = (
  profileEmail: string | null,
  emails: GithubEmail[]
) => {
  const primaryVerified = emails.find((email) => email.primary && email.verified);
  const firstVerified = emails.find((email) => email.verified);
  return primaryVerified?.email || firstVerified?.email || profileEmail || null;
};

export const signup = async (req: Request, res: Response) => {
  try {
    const parsed = signupSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const { fullName, email, studentId, password } = parsed.data;

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long"
      })
    }

    const query: any[] = [{ email }];
    if (studentId && studentId.trim() !== "") {
      query.push({ studentId });
    }
    const existingUser = await User.findOne({
      $or: query,
    });

    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }


    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      studentId: studentId?.trim() || undefined,
      password: hashedPassword,
      authProvider: "credentials",
    });

    const token = signToken({
      id: (user._id as any).toString(),
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatar,
    });

    setAuthCookie(res, token);

    return res.status(201).json({
      message: "User registered successfully",
      token,
      user: serializeAuthUser(user),
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const signin = async (req: Request, res: Response) => {
  try {
    const parsed = signinSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }
    const { identifier, password } = parsed.data;
    const loginIdentifier = identifier.trim();

    const user = await User.findOne({
      $or: [
        { email: loginIdentifier.toLowerCase() },
        { studentId: loginIdentifier },
      ],
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken({
      id: (user._id as any).toString(),
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatar,
    })

    setAuthCookie(res, token);

    return res.status(200).json({
      message: "Signin successful",
      token,
      user: serializeAuthUser(user),
    });
  } catch (error) {
    console.error("Signin error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const githubAuth = async (req: Request, res: Response) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ message: "GitHub OAuth is not configured" });
  }



  const state = randomBytes(24).toString("hex");
  const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", getGithubCallbackUrl());
  authorizeUrl.searchParams.set("scope", "read:user user:email");
  authorizeUrl.searchParams.set("state", state);

  setOAuthRedirectCookie(res, githubRedirectCookieName, getFrontendUrl());
  res.cookie(githubStateCookieName, state, {
    httpOnly: true,
    secure: isProduction,
    sameSite: authCookieSameSite,
    maxAge: oauthStateMaxAge,
  });

  return res.redirect(authorizeUrl.toString());
};

export const githubCallback = async (req: Request, res: Response) => {
  const frontendUrl =
    typeof req.cookies?.[githubRedirectCookieName] === "string"
      ? req.cookies[githubRedirectCookieName]
      : "";

  try {
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const savedState = req.cookies?.[githubStateCookieName];

    clearOAuthRedirectCookie(res, githubRedirectCookieName);
    clearGithubStateCookie(res);

    if (!code || !state || !savedState || state !== savedState) {
      return redirectToAuthCallback(res, {
        provider: "github",
        error: "invalid_oauth_state",
      }, frontendUrl);
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return redirectToAuthCallback(res, {
        provider: "github",
        error: "github_not_configured",
      }, frontendUrl);
    }

    const tokenResponse = await axios.post<GithubTokenResponse>(
      "https://github.com/login/oauth/access_token",
      {
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: getGithubCallbackUrl(),
      },
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (tokenResponse.data.error || !tokenResponse.data.access_token) {
      console.error("GitHub token exchange failed:", tokenResponse.data.error);
      return redirectToAuthCallback(res, {
        provider: "github",
        error: "github_token_exchange_failed",
      }, frontendUrl);
    }

    const githubHeaders = {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${tokenResponse.data.access_token}`,
      "X-GitHub-Api-Version": "2022-11-28",
    };

    const [profileResponse, emailResponse] = await Promise.all([
      axios.get<GithubProfile>("https://api.github.com/user", {
        headers: githubHeaders,
      }),
      axios.get<GithubEmail[]>("https://api.github.com/user/emails", {
        headers: githubHeaders,
      }),
    ]);

    const profile = profileResponse.data;
    const githubId = String(profile.id);
    const email = pickGithubEmail(profile.email, emailResponse.data)?.toLowerCase();

    if (!email) {
      return redirectToAuthCallback(res, {
        provider: "github",
        error: "github_email_unavailable",
      }, frontendUrl);
    }

    let user = await User.findOne({ githubId });

    if (!user) {
      user = await User.findOne({ email });
    }

    if (user) {
      let shouldSave = false;

      if (!user.githubId) {
        user.githubId = githubId;
        shouldSave = true;
      }

      if (user.authProvider !== "github") {
        user.authProvider = "github";
        shouldSave = true;
      }

      if (!user.avatar && profile.avatar_url) {
        user.avatar = profile.avatar_url;
        shouldSave = true;
      }

      if (shouldSave) {
        await user.save();
      }
    } else {
      const randomPasswordHash = await bcrypt.hash(
        randomBytes(32).toString("hex"),
        10
      );

      user = await User.create({
        fullName: profile.name || profile.login,
        email,
        githubId,
        authProvider: "github",
        avatar: profile.avatar_url || "",
        password: randomPasswordHash,
      });
    }

    const token = signToken({
      id: (user._id as any).toString(),
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatar,
    });

    setAuthCookie(res, token);

    return redirectToAuthCallback(res, {
      provider: "github",
    }, frontendUrl);
  } catch (error) {
    console.error("GitHub OAuth callback error:", error);
    return redirectToAuthCallback(res, {
      provider: "github",
      error: "github_oauth_failed",
    }, frontendUrl);
  }
};

export const googleAuth = async (req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ message: "Google OAuth is not configured" });
  }

  let callbackUrl: string;
  try {
    callbackUrl = getGoogleCallbackUrl();
  } catch {
    return res.status(500).json({ message: "GOOGLE_CALLBACK_URL is not configured" });
  }



  const state = randomBytes(24).toString("hex");
  const authorizeUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", callbackUrl);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", "openid email profile");
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("prompt", "select_account");

  setOAuthRedirectCookie(res, googleRedirectCookieName, getFrontendUrl());
  res.cookie(googleStateCookieName, state, {
    httpOnly: true,
    secure: isProduction,
    sameSite: authCookieSameSite,
    maxAge: oauthStateMaxAge,
  });

  return res.redirect(authorizeUrl.toString());
};

export const googleCallback = async (req: Request, res: Response) => {
  const frontendUrl =
    typeof req.cookies?.[googleRedirectCookieName] === "string"
      ? req.cookies[googleRedirectCookieName]
      : "";

  try {
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const savedState = req.cookies?.[googleStateCookieName];

    clearOAuthRedirectCookie(res, googleRedirectCookieName);
    clearGoogleStateCookie(res);

    if (!code || !state || !savedState || state !== savedState) {
      return redirectToAuthCallback(res, {
        provider: "google",
        error: "invalid_oauth_state",
      }, frontendUrl);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return redirectToAuthCallback(res, {
        provider: "google",
        error: "google_not_configured",
      }, frontendUrl);
    }

    const callbackUrl = getGoogleCallbackUrl();
    const tokenResponse = await axios.post<GoogleTokenResponse>(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: callbackUrl,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (tokenResponse.data.error || !tokenResponse.data.access_token) {
      console.error("Google token exchange failed:", tokenResponse.data.error);
      return redirectToAuthCallback(res, {
        provider: "google",
        error: "google_token_exchange_failed",
      }, frontendUrl);
    }

    const profileResponse = await axios.get<GoogleProfile>(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokenResponse.data.access_token}`,
        },
      }
    );

    const profile = profileResponse.data;
    const googleId = profile.sub;
    const email = profile.email?.toLowerCase();

    if (!googleId || !email) {
      return redirectToAuthCallback(res, {
        provider: "google",
        error: "google_profile_unavailable",
      }, frontendUrl);
    }

    if (profile.email_verified === false) {
      return redirectToAuthCallback(res, {
        provider: "google",
        error: "google_email_unverified",
      }, frontendUrl);
    }

    let user = await User.findOne({ googleId });

    if (!user) {
      user = await User.findOne({ email });
    }

    if (user) {
      let shouldSave = false;

      if (!user.googleId) {
        user.googleId = googleId;
        shouldSave = true;
      }

      if (user.authProvider !== "google") {
        user.authProvider = "google";
        shouldSave = true;
      }

      if (!user.avatar && profile.picture) {
        user.avatar = profile.picture;
        shouldSave = true;
      }

      if (shouldSave) {
        await user.save();
      }
    } else {
      const randomPasswordHash = await bcrypt.hash(
        randomBytes(32).toString("hex"),
        10
      );

      user = await User.create({
        fullName: profile.name || email.split("@")[0],
        email,
        googleId,
        authProvider: "google",
        avatar: profile.picture || "",
        password: randomPasswordHash,
      });
    }

    const token = signToken({
      id: (user._id as any).toString(),
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatar,
    });

    setAuthCookie(res, token);

    return redirectToAuthCallback(res, {
      provider: "google",
    }, frontendUrl);
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return redirectToAuthCallback(res, {
      provider: "google",
      error: "google_oauth_failed",
    }, frontendUrl);
  }
};

export const logout = async (_: Request, res: Response) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: authCookieSameSite,
  });

  return res.status(200).json({
    message: "Logged out successfully",
  });
};

export const me = async (req: Request, res: Response) => {
  try {
    const bearerToken = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : undefined;
    const token = req.cookies["token"] || bearerToken;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = verifyToken(token);

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User found",
      token,
      user: serializeAuthUser(user),
    });

  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export const getSocketToken = async (req: Request, res: Response) => {
  try {
    let token = req.cookies["token"] as string | undefined;

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    verifyToken(token);

    return res.status(200).json({ token });
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
