import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, AuthError } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

const schema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type SignupFormValues = z.infer<typeof schema>;

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupFormValues>({ resolver: zodResolver(schema) });
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  const onSubmit = async (data: SignupFormValues) => {
    setFirebaseError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await setDoc(doc(db, 'profiles', userCredential.user.uid), {
        name: data.name,
        email: data.email,
        xp: 0,
        level: 1,
        streak: 0,
        created_at: new Date(),
      });
      navigate('/app/dashboard');
    } catch (error) {
      const authError = error as AuthError;
      switch (authError.code) {
        case 'auth/email-already-in-use':
          setFirebaseError('This email is already in use.');
          break;
        case 'auth/invalid-email':
          setFirebaseError('Please enter a valid email address.');
          break;
        case 'auth/weak-password':
          setFirebaseError('The password is too weak.');
          break;
        default:
          setFirebaseError('An unexpected error occurred. Please try again.');
          break;
      }
      
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">Sign Up</h2>
        {firebaseError && <p className="text-red-500 text-center mb-4">{firebaseError}</p>}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input {...register('name')} className="w-full p-2 border border-gray-300 rounded-md" />
            {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
          </div>
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
            {isSubmitting ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>
        <p className="text-center mt-4">Already have an account? <Link to="/login" className="text-blue-500">Login</Link></p>
      </div>
    </div>
  );
};

export default SignupPage;