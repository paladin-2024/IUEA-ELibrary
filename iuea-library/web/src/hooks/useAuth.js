import { useMutation } from '@tanstack/react-query';
import { useNavigate }  from 'react-router-dom';
import toast            from 'react-hot-toast';
import useAuthStore     from '../store/authStore';
import * as authService from '../services/auth.service';

export const useLogin = () => {
  const { setAuth } = useAuthStore();
  const navigate    = useNavigate();

  return useMutation({
    mutationFn: ({ email, password }) => authService.login(email, password),
    onSuccess:  ({ token, user }) => {
      setAuth(token, user);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(user.role === 'admin' ? '/admin' : '/');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Login failed.'),
  });
};

export const useRegister = () => {
  const { setAuth } = useAuthStore();
  const navigate    = useNavigate();

  return useMutation({
    mutationFn: ({ name, email, password, language }) =>
      authService.register(name, email, password, language),
    onSuccess: ({ token, user }) => {
      setAuth(token, user);
      toast.success('Account created!');
      navigate('/');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Registration failed.'),
  });
};

export const useLogout = () => {
  const { logout } = useAuthStore();
  const navigate   = useNavigate();
  return () => {
    logout();
    navigate('/login');
  };
};
