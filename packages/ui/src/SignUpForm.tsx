"use client";

import { useState, useCallback, ChangeEvent, FormEvent } from "react";
import { MdEmail, MdPerson, MdBadge } from "react-icons/md";
import { RiLockPasswordLine } from "react-icons/ri";
import { FaUserPlus, FaGithub, FaEye, FaEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface FormFields {
  fullName: string;
  studentId: string;
  email: string;
  password: string;
  acceptTerms: boolean;
}

interface FormErrors {
  fullName?: string;
  studentId?: string;
  email?: string;
  password?: string;
  acceptTerms?: string;
  general?: string;
}

interface SignUpFormProps {
  className?: string;
  onSubmit?: (fields: FormFields) => Promise<void>;
  onOAuth?: (provider: "google" | "github") => void;
}

// ─── Validation ────────────────────────────────────────────────────────────────

function validateForm(fields: FormFields): FormErrors {
  const errors: FormErrors = {};
  
  if (!fields.fullName.trim()) {
    errors.fullName = "Full name is required.";
  } else if (fields.fullName.trim().length < 2) {
    errors.fullName = "Name must be at least 2 characters.";
  }

  if (!fields.studentId.trim()) {
    errors.studentId = "Student ID is required.";
  } else if (!/^\d{4,}/.test(fields.studentId)) {
    errors.studentId = "Invalid student ID format.";
  }

  if (!fields.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
    errors.email = "Invalid email format.";
  }

  if (!fields.password) {
    errors.password = "Password is required.";
  } else if (fields.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  if (!fields.acceptTerms) {
    errors.acceptTerms = "You must accept the terms and privacy policy.";
  }

  return errors;
}

// ─── Component ─────────────────────────────────────────────────────────────────

const INITIAL_FIELDS: FormFields = {
  fullName: "",
  studentId: "",
  email: "",
  password: "",
  acceptTerms: false,
};

export function SignUpForm({
  className = "",
  onSubmit: onSubmitProp,
  onOAuth: onOAuthProp,
}: SignUpFormProps) {
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
          console.info("Sign up with:", fields);
        }
      } catch (error) {
        setErrors({
          general:
            error instanceof Error
              ? error.message
              : "Registration failed. Please try again.",
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
        console.info(`OAuth sign-up initiated: ${provider}`);
      }
    },
    [onOAuthProp]
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  const inputClasses = (hasError?: boolean) => `
    w-full pl-10 pr-4 py-3 border bg-[#0a1233] text-slate-100 
    placeholder:text-slate-500 rounded-lg outline-none transition-all
    disabled:opacity-50 disabled:cursor-not-allowed
    ${
      hasError
        ? "border-red-500/50 focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
        : "border-blue-700/30 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
    }
  `;

  return (
    <div className={`w-full text-slate-100 ${className}`}>
      {/* Tab Toggle */}
      
      {/* Header */}
      <div>
        <h2 className="text-5xl font-bold tracking-tight text-white">
          Create Your Account
        </h2>
        <p className="text-slate-400 mt-3 text-lg">
          Join the next generation of software engineers.
        </p>
      </div>

      {/* General Error Banner */}
      {errors.general && (
        <div
          role="alert"
          className="mt-6 flex items-center gap-2 px-4 py-3 rounded-lg bg-red-900/20 border border-red-500/30 text-red-400 text-sm"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          {errors.general}
        </div>
      )}

      {/* Form */}
      <form className="space-y-5 mt-8" onSubmit={handleSubmit} noValidate>
        {/* Full Name */}
        <div>
          <label
            htmlFor="fullName"
            className="text-xs font-semibold uppercase tracking-widest text-slate-500"
          >
            Full Name
          </label>
          <div className="relative mt-2">
            <MdPerson
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              placeholder="John Doe"
              value={fields.fullName}
              onChange={handleChange}
              disabled={isLoading}
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? "fullName-error" : undefined}
              className={inputClasses(!!errors.fullName)}
            />
          </div>
          {errors.fullName && (
            <p
              id="fullName-error"
              role="alert"
              className="mt-1.5 text-xs text-red-400 flex items-center gap-1"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.fullName}
            </p>
          )}
        </div>

        {/* Student ID */}
        <div>
          <label
            htmlFor="studentId"
            className="text-xs font-semibold uppercase tracking-widest text-slate-500"
          >
            Student ID
          </label>
          <div className="relative mt-2">
            <MdBadge
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="studentId"
              name="studentId"
              type="text"
              autoComplete="off"
              placeholder="2024XXXXX"
              value={fields.studentId}
              onChange={handleChange}
              disabled={isLoading}
              aria-invalid={!!errors.studentId}
              aria-describedby={errors.studentId ? "studentId-error" : undefined}
              className={inputClasses(!!errors.studentId)}
            />
          </div>
          {errors.studentId && (
            <p
              id="studentId-error"
              role="alert"
              className="mt-1.5 text-xs text-red-400 flex items-center gap-1"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.studentId}
            </p>
          )}
        </div>

        {/*Email */}
        <div>
          <label
            htmlFor="email"
            className="text-xs font-semibold uppercase tracking-widest text-slate-500"
          >
            Email
          </label>
          <div className="relative mt-2">
            <MdEmail
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="student@university.edu"
              value={fields.email}
              onChange={handleChange}
              disabled={isLoading}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={inputClasses(!!errors.email)}
            />
          </div>
          {errors.email && (
            <p
              id="email-error"
              role="alert"
              className="mt-1.5 text-xs text-red-400 flex items-center gap-1"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="text-xs font-semibold uppercase tracking-widest text-slate-500"
          >
            Password
          </label>
          <div className="relative mt-2">
            <RiLockPasswordLine
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Create a strong password"
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
              {showPassword ? (
                <FaEyeSlash className="text-lg" />
              ) : (
                <FaEye className="text-lg" />
              )}
            </button>
          </div>
          {errors.password && (
            <p
              id="password-error"
              role="alert"
              className="mt-1.5 text-xs text-red-400 flex items-center gap-1"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.password}
            </p>
          )}
        </div>

        {/* Terms Checkbox */}
        <div className="pt-2">
          <div className="flex items-start gap-2">
            <input
              id="acceptTerms"
              name="acceptTerms"
              type="checkbox"
              checked={fields.acceptTerms}
              onChange={handleChange}
              disabled={isLoading}
              aria-invalid={!!errors.acceptTerms}
              aria-describedby={errors.acceptTerms ? "terms-error" : undefined}
              className="mt-0.5 w-4 h-4 rounded accent-blue-600 disabled:opacity-50"
            />
            <label
              htmlFor="acceptTerms"
              className="text-xs text-slate-400 leading-tight cursor-pointer select-none"
            >
              I agree to the{" "}
              <a
                href="/terms"
                className="text-blue-500 hover:underline font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="/privacy"
                className="text-blue-500 hover:underline font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </a>
              .
            </label>
          </div>
          {errors.acceptTerms && (
            <p
              id="terms-error"
              role="alert"
              className="mt-1.5 text-xs text-red-400 flex items-center gap-1"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {errors.acceptTerms}
            </p>
          )}
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
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              Creating Account...
            </>
          ) : (
            <>
              Create Account
              <FaUserPlus />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div
        className="flex items-center gap-4 mt-8"
        role="separator"
        aria-label="or continue with"
      >
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
          <span className="text-sm font-medium">Google</span>
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
      <footer className="mt-12 border-t border-blue-700/25 pt-8 text-center">
        <p className="text-xs text-slate-500 uppercase tracking-widest">
          Computer Science Department | Academic Systems
        </p>
        <nav
          aria-label="Footer links"
          className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-400"
        >
          <a href="/security" className="hover:text-blue-400 transition-colors">
            Security
          </a>
          <a href="/privacy" className="hover:text-blue-400 transition-colors">
            Privacy
          </a>
          <a href="/help" className="hover:text-blue-400 transition-colors">
            Help
          </a>
        </nav>
      </footer>
    </div>
  );
}