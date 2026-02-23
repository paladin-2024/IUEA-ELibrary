'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const currentYear = new Date().getFullYear();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Simulate sign in - replace with actual NextAuth signin
      if (email && password) {
        // Store auth state (replace with NextAuth session)
        localStorage.setItem('userEmail', email);
        localStorage.setItem('isAuthenticated', 'true');
        router.push('/');
      } else {
        setError('Please fill in all fields');
      }
    } catch (err) {
      setError('An error occurred during sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Background Image (Hidden on Mobile) */}
      <div
        className="hidden md:flex md:w-1/2 bg-cover bg-center relative"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-150784272343-583f20270319?w=800&h=1000&fit=crop"))',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#800000]/60 to-transparent"></div>
        <div className="relative z-10 flex flex-col justify-center items-start p-12 text-white">
          <div className="flex items-center gap-3 mb-8">
            <Image
              src="/logo.png"
              alt="E-Library Logo"
              width={50}
              height={50}
              className="object-contain"
            />
            <span className="text-3xl font-bold">E-Library</span>
          </div>
          <h2 className="text-4xl font-black mb-4">Welcome Back</h2>
          <p className="text-lg text-white/90">Continue your reading journey with thousands of books at your fingertips</p>
        </div>
      </div>

      {/* Right Side - Sign In Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-4 py-8 md:py-0 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="md:hidden flex flex-col items-center mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/logo.png"
                alt="E-Library Logo"
                width={40}
                height={40}
                className="object-contain"
              />
              <span className="text-2xl font-bold text-[#800000]">E-Library</span>
            </div>
          </div>

          {/* Title */}
          <div className="flex flex-col mb-8">
            <h1 className="text-3xl font-black text-[#171717]">Sign In</h1>
            <p className="text-gray-500 mt-2">Access your reading library</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSignIn} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[#171717] mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-0 top-0 flex items-center justify-center w-12 h-12 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#800000] focus:ring-2 focus:ring-[#800000]/10 transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-[#171717] mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-0 top-0 flex items-center justify-center w-12 h-12 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#800000] focus:ring-2 focus:ring-[#800000]/10 transition-colors"
                />
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#800000] text-white font-semibold py-3 px-4 rounded-lg hover:bg-[#A00000] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Sign Up Link */}
          <p className="text-center text-gray-600 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[#800000] font-semibold hover:underline">
              Sign Up
            </Link>
          </p>

          {/* Footer */}
          <p className="text-center text-gray-400 text-sm mt-8">
            © {currentYear} E-Library. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
