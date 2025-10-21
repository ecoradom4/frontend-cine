export interface Movie {
  id: string;
  title: string;
  genre: string;
  duration: number;
  rating: number;
  description: string;
  price: number;
  releaseDate: string;
  poster: string;
  status: 'active' | 'inactive';
  showtimes?: string[];
  createdAt?: string;
  updatedAt?: string;
}