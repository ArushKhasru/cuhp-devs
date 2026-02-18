"use client";

import { useState, useCallback, ChangeEvent, FormEvent } from "react";
import { MdEmail } from "react-icons/md";
import { RiLockPasswordLine } from "react-icons/ri";
import { FaArrowRight, FaGithub, FaEye, FaEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface FormFields {
  identifier: string;
  password: string;
  remember: boolean;
}

interface FormErrors {
  identifier?: string;
  password?: string;
  general?: string;
}

interface SignInFormProps {
  className?: string;
  onSubmit?: (fields: FormFields) => Promise<void>;
  onOAuth?: (provider: "google" | "github") => void;
}

// ─── Validation ────────────────────────────────────────────────────────────────

function validateForm(fields: FormFields): FormErrors {
  const errors: FormErrors = {};
  if (!fields.identifier.trim()) {
    errors.identifier = "Student ID or email is required.";
  }
  if (!fields.password) {
    errors.password = "Password is required.";
  } else if (fields.password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }
  return errors;
}

// ─── Component ─────────────────────────────────────────────────────────────────

const INITIAL_FIELDS: FormFields = { identifier: "", password: "", remember: false };

export function SignInForm({ 
  className = "",
  onSubmit: onSubmitProp,
  onOAuth: onOAuthProp
}: SignInFormProps) {
  const [fields, setFields] = useState<FormFields>(INITIAL_FIELDS);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFields((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    // Clear field-level error on change
    setErrors((prev) => ({ ...prev, [name]: undefined, general: undefined }));
  }, []);

  const handleTogglePassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const validationErrors = validateForm(fields);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      setIsLoading(true);
      setErrors({});

      try {
        if (onSubmitProp) {
          await onSubmitProp(fields);
        } else {
          // Default behavior: simulate network delay
          await new Promise((r) => setTimeout(r, 1500));
          console.info("Sign in with:", fields);
        }
      } catch (error) {
        setErrors({ 
          general: error instanceof Error ? error.message : "Invalid credentials. Please check your details and try again." 
        });
      } finally {
        setIsLoading(false);
      }
    },
    [fields, onSubmitProp]
  );

  const handleOAuth = useCallback(
    (provider: "google" | "github") => {
      if (onOAuthProp) {
        onOAuthProp(provider);
      } else {
        console.info(`OAuth sign-in initiated: ${provider}`);
      }
    },
    [onOAuthProp]
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  const inputClasses = (hasError?: boolean) => `
    w-full pl-10 pr-4 py-3 border bg-[#0a1233] text-slate-100 
    placeholder:text-slate-500 rounded-lg outline-none transition-all
    disabled:opacity-50 disabled:cursor-not-allowed
    ${hasError 
      ? 'border-red-500/50 focus:ring-2 focus:ring-red-500/30 focus:border-red-500' 
      : 'border-blue-700/30 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500'
    }
  `;

  return (
    <div className={`w-full text-slate-100 ${className}`}>
      {/* Tab Toggle */}
   
      

      {/* Header */}
      <div>
        <h2 className="text-5xl font-bold tracking-tight text-white">Welcome Back</h2>
        <p className="text-slate-400 mt-3 text-lg">
          Enter your credentials to access your dashboard.
        </p>
      </div>

      {/* General Error Banner */}
      {errors.general && (
        <div
          role="alert"
          className="mt-6 flex items-center gap-2 px-4 py-3 rounded-lg bg-red-900/20 border border-red-500/30 text-red-400 text-sm"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {errors.general}
        </div>
      )}

      {/* Form */}
      <form className="space-y-6 mt-8" onSubmit={handleSubmit} noValidate>
        {/* Student ID / Email */}
        <div>
          <label 
            htmlFor="identifier"
            className="text-xs font-semibold uppercase tracking-widest text-slate-500"
          >
            Student ID or Email
          </label>
          <div className="relative mt-2">
            <MdEmail 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none" 
              aria-hidden="true"
            />
            <input
              id="identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              placeholder="e.g. 202410056 or you@university.edu"
              value={fields.identifier}
              onChange={handleChange}
              disabled={isLoading}
              aria-invalid={!!errors.identifier}
              aria-describedby={errors.identifier ? "identifier-error" : undefined}
              className={inputClasses(!!errors.identifier)}
            />
          </div>
          {errors.identifier && (
            <p 
              id="identifier-error" 
              role="alert" 
              className="mt-1.5 text-xs text-red-400 flex items-center gap-1"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.identifier}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex justify-between">
            <label 
              htmlFor="password"
              className="text-xs font-semibold uppercase text-slate-500"
            >
              Password
            </label>
            <a 
              href="/forgot-password" 
              className="text-xs font-semibold text-blue-500 hover:underline transition-colors"
            >
              Forgot password?
            </a>
          </div>

          <div className="relative mt-2">
            <RiLockPasswordLine 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none" 
              aria-hidden="true"
            />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={fields.password}
              onChange={handleChange}
              disabled={isLoading}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              className={`${inputClasses(!!errors.password)} pr-11`}
            />
            {/* Show/Hide Toggle */}
            <button
              type="button"
              onClick={handleTogglePassword}
              disabled={isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FaEyeSlash className="text-lg" /> : <FaEye className="text-lg" />}
            </button>
          </div>
          {errors.password && (
            <p 
              id="password-error" 
              role="alert" 
              className="mt-1.5 text-xs text-red-400 flex items-center gap-1"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.password}
            </p>
          )}
        </div>

        {/* Remember Checkbox */}
        <div className="flex items-center gap-2">
          <input 
            id="remember"
            name="remember"
            type="checkbox" 
            checked={fields.remember}
            onChange={handleChange}
            disabled={isLoading}
            className="accent-blue-600 w-4 h-4 rounded disabled:opacity-50" 
          />
          <label htmlFor="remember" className="text-sm text-slate-400 cursor-pointer select-none">
            Keep me signed in
          </label>
        </div>

        {/* Submit Button */}
        <button 
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {isLoading ? (
            <>
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Signing In...
            </>
          ) : (
            <>
              Sign Into Portal
              <FaArrowRight />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-4 mt-10" role="separator" aria-label="or continue with">
        <div className="flex-1 border-t border-blue-700/25" />
        <span className="text-xs text-slate-500 uppercase tracking-widest">
          or continue with
        </span>
        <div className="flex-1 border-t border-blue-700/25" />
      </div>

      {/* OAuth Buttons */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <button 
          type="button"
          onClick={() => handleOAuth("google")}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 py-3 border border-blue-700/30 bg-[#0a1233] rounded-lg text-slate-200 hover:bg-[#101a45] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FcGoogle size={20} />
          <span className="text-sm font-medium">Google SSO</span>
        </button>

        <button 
          type="button"
          onClick={() => handleOAuth("github")}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 py-3 border border-blue-700/30 bg-[#0a1233] rounded-lg text-slate-200 hover:bg-[#101a45] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FaGithub size={18} />
          <span className="text-sm font-medium">GitHub</span>
        </button>
      </div>

      {/* Footer */}
      <footer className="mt-14 border-t border-blue-700/25 pt-8 text-center">
        <p className="text-xs text-slate-500">
          Department of Computer Science &amp; Engineering
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Academic Resource &amp; Information Systems
        </p>
        <nav aria-label="Footer links" className="mt-5 flex items-center justify-center gap-7 text-xs text-slate-400">
          <a href="/security" className="hover:text-blue-400 transition-colors">
            Security Policy
          </a>
          <a href="/privacy" className="hover:text-blue-400 transition-colors">
            Privacy
          </a>
          <a href="/help" className="hover:text-blue-400 transition-colors">
            Help Desk
          </a>
        </nav>
      </footer>
    </div>
  );
}