import { useQuery } from '@tanstack/react-query';
import { listBooks, getFeatured, searchBooks, getBook, getSimilar } from '../services/books.service';

export const useBooks = (params) =>
  useQuery({ queryKey: ['books', params], queryFn: () => listBooks(params) });

export const useFeaturedBooks = () =>
  useQuery({ queryKey: ['books', 'featured'], queryFn: getFeatured });

export const useSearchBooks = (q, params) =>
  useQuery({
    queryKey: ['books', 'search', q, params],
    queryFn:  () => searchBooks(q, params),
    enabled:  !!q,
  });

export const useBook = (id) =>
  useQuery({
    queryKey: ['book', id],
    queryFn:  () => getBook(id),
    enabled:  !!id,
  });

export const useSimilarBooks = (id) =>
  useQuery({
    queryKey: ['books', 'similar', id],
    queryFn:  () => getSimilar(id),
    enabled:  !!id,
  });
