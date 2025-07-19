import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signInWithEmailAndPassword, AuthError } from 'firebase/auth';
import { auth } from '../lib/firebase';

const schema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormValues = z.infer<typeof schema>;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({ resolver: zodResolver(schema) });
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  const onSubmit = async (data: LoginFormValues) => {
    setFirebaseError(null);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      navigate('/app/dashboard');
    } catch (error) {
      const authError = error as AuthError;
      switch (authError.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setFirebaseError('Invalid email or password.');
          break;
        case 'auth/invalid-email':
          setFirebaseError('Please enter a valid email address.');
          break;
        default:
          setFirebaseError('An unexpected error occurred. Please try again.');
          break;
      }
      console.error('Failed to login', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
        {firebaseError && <p className="text-red-500 text-center mb-4">{firebaseError}</p>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input {...register('email')} className="w-full p-2 border border-gray-300 rounded-md" />
            {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" {...register('password')} className="w-full p-2 border border-gray-300 rounded-md" />
            {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="w-full bg-blue-500 text-white p-2 rounded-md disabled:opacity-50">
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="text-center mt-4">Don't have an account? <Link to="/signup" className="text-blue-500">Sign up</Link></p>
      </div>
    </div>
  );
};

export default LoginPage;