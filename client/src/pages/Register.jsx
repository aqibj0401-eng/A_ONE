import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { register, isLoading, error, isAuthenticated, clearError } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/products');
    }
    return () => clearError();
  }, [isAuthenticated, navigate, clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await register(name, email, password);
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#111111] font-sans selection:bg-black selection:text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      
      <div className="absolute top-8 left-8">
        <Link to="/" className="inline-flex items-center text-sm font-medium hover:underline underline-offset-4">
           <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-4xl font-serif font-medium tracking-tight">
          Create Account
        </h2>
      </div>

      <div className="mt-12 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <form className="space-y-8" onSubmit={handleSubmit}>
          {error && (
            <div className="border border-red-500 bg-red-50 text-red-600 px-4 py-3 text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-900 mb-2">Full Name</label>
            <input
              type="text"
              required
              className="appearance-none block w-full px-0 py-3 border-b border-gray-400 bg-transparent placeholder-gray-400 focus:outline-none focus:border-[#111111] sm:text-sm text-gray-900 transition-colors rounded-none"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-900 mb-2">Email Address</label>
            <input
              type="email"
              required
              className="appearance-none block w-full px-0 py-3 border-b border-gray-400 bg-transparent placeholder-gray-400 focus:outline-none focus:border-[#111111] sm:text-sm text-gray-900 transition-colors rounded-none"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-gray-900 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="appearance-none block w-full px-0 pr-10 py-3 border-b border-gray-400 bg-transparent placeholder-gray-400 focus:outline-none focus:border-[#111111] sm:text-sm text-gray-900 transition-colors rounded-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black transition-colors focus:outline-none p-2"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-4 px-4 border border-[#111111] text-sm font-medium text-white bg-[#111111] hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
           <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-[#111111] hover:underline underline-offset-4">
                 Sign in
              </Link>
           </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
