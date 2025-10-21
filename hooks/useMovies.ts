// src/hooks/useMovies.ts
import { useState, useEffect } from 'react';
import { movieService, type MovieInput } from '@/services/movieService';
import type { Movie } from '@/components/movies/movie-card';

export function useMovies() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMovies = async (params?: {
    search?: string;
    genre?: string;
    page?: number;
    limit?: number;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await movieService.getMovies({
        status: 'active',
        ...params
      });
      setMovies(response.movies);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar películas');
    } finally {
      setLoading(false);
    }
  };

  const createMovie = async (movieData: MovieInput): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      await movieService.createMovie(movieData);
      await fetchMovies(); // Recargar la lista
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear película');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateMovie = async (id: string, movieData: Partial<MovieInput>): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      await movieService.updateMovie(id, movieData);
      await fetchMovies(); // Recargar la lista
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar película');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteMovie = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      await movieService.deleteMovie(id);
      setMovies(prev => prev.filter(movie => movie.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar película');
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  return {
    movies,
    loading,
    error,
    fetchMovies,
    createMovie,
    updateMovie,
    deleteMovie,
  };
}