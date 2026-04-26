'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Star, Clock, Calendar, ArrowLeft, PlayCircle, MessageSquare, Send, Pencil, X, Check } from 'lucide-react';
import { getMovieDetails, getMovieCredits, getReviews, createReview, getTMDBImageUrl, isLoggedIn, getMovieTrailer, getUserEmail, updateReview } from '@/lib/api';
import { TrailerModal } from '@/components/TrailerModal';
import ReactMarkdown from 'react-markdown';
import { MarkdownEditor } from '@/components/MarkdownEditor';

export default function TitleDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [movie, setMovie] = useState<any>(null);
  const [credits, setCredits] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const [newReview, setNewReview] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [isTrailerLoading, setIsTrailerLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editRating, setEditRating] = useState(5);

  useEffect(() => {
    setIsAuth(isLoggedIn());
    setUserEmail(getUserEmail());
    
    async function fetchData() {
      try {
        const [movieData, creditsData, reviewsData] = await Promise.all([
          getMovieDetails(id as string),
          getMovieCredits(id as string),
          getReviews(id as string)
        ]);
        setMovie(movieData);
        setCredits(creditsData);
        setReviews(reviewsData);
      } catch (err) {
        console.error("Failed to fetch title data", err);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (id) {
      fetchData();
    }
  }, [id]);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.trim()) return;
    
    setIsSubmitting(true);
    try {
      const review = await createReview(id as string, rating, newReview);
      setReviews([review, ...reviews]);
      setNewReview('');
    } catch (err: any) {
      alert(err.message || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (review: any) => {
    setEditingReviewId(review.id);
    setEditContent(review.content || '');
    setEditRating(review.rating);
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
  };

  const submitEdit = async (reviewId: number) => {
    if (!editContent.trim()) return;
    try {
      const updated = await updateReview(reviewId, editRating, editContent);
      setReviews(reviews.map(r => r.id === reviewId ? updated : r));
      setEditingReviewId(null);
    } catch (err) {
      alert("Failed to update review.");
    }
  };

  const handleWatchTrailer = async () => {
    try {
      if (!trailerKey) {
        setIsTrailerLoading(true);
        const key = await getMovieTrailer(id as string);
        setTrailerKey(key);
      }
      setShowTrailer(true);
    } catch (err) {
      alert("Trailer not available");
    } finally {
      setIsTrailerLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-pink border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!movie || movie.error) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">Movie not found</h1>
        <button onClick={() => router.back()} className="mt-4 text-brand-pink hover:underline">Go Back</button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white pb-20">
      {/* Backdrop */}
      <div className="relative h-[40vh] md:h-[60vh] w-full">
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent z-10" />
        <img 
          src={getTMDBImageUrl(movie.backdrop_path, 'original')} 
          alt={movie.title}
          className="w-full h-full object-cover opacity-50"
        />
        <button 
          onClick={() => router.back()}
          className="absolute top-6 left-6 z-20 p-2 glass rounded-full hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="container mx-auto px-4 relative z-20 -mt-32 md:-mt-48 flex flex-col md:flex-row gap-8">
        {/* Poster */}
        <div className="shrink-0 w-48 md:w-64 lg:w-80 mx-auto md:mx-0">
          <img 
            src={getTMDBImageUrl(movie.poster_path)} 
            alt={movie.title}
            className="w-full rounded-2xl shadow-2xl border border-white/10"
          />
        </div>

        {/* Info */}
        <div className="flex-1 mt-4 md:mt-16">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">{movie.title}</h1>
          <p className="text-white/60 italic mb-6">{movie.tagline}</p>

          <div className="flex flex-wrap items-center gap-6 mb-8 text-sm font-medium text-white/80">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <span className="text-lg font-bold text-white">{movie.vote_average?.toFixed(1)}</span>
              <span className="text-white/40">/10</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-pink" />
              {movie.runtime} min
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-purple" />
              {movie.release_date?.split('-')[0]}
            </div>
          </div>

          <div className="flex gap-2 mb-8 flex-wrap">
            {movie.genres?.map((g: any) => (
              <span key={g.id} className="px-3 py-1 glass border border-white/10 rounded-full text-xs font-bold uppercase tracking-wider">
                {g.name}
              </span>
            ))}
          </div>

          <h3 className="text-xl font-bold mb-3">Overview</h3>
          <p className="text-white/80 leading-relaxed max-w-3xl mb-8">{movie.overview}</p>

          <button 
            onClick={handleWatchTrailer}
            disabled={isTrailerLoading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-brand rounded-xl font-bold hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-brand-pink/20 disabled:opacity-50"
          >
            <PlayCircle className="w-5 h-5" />
            {isTrailerLoading ? "Loading..." : "Watch Trailer"}
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-16 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Cast & Crew */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-black uppercase tracking-wider mb-6 border-b border-white/10 pb-4">Top Cast</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-12">
            {credits?.cast?.slice(0, 8).map((actor: any) => (
              <Link href={`/name/${actor.id}`} key={actor.id}>
                <div className="group cursor-pointer">
                  <div className="aspect-square rounded-xl overflow-hidden mb-2 border border-white/10 bg-white/5">
                    {actor.profile_path ? (
                      <img 
                        src={getTMDBImageUrl(actor.profile_path)} 
                        alt={actor.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20">No Image</div>
                    )}
                  </div>
                  <h4 className="font-bold text-sm truncate">{actor.name}</h4>
                  <p className="text-xs text-white/50 truncate">{actor.character}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right Column: Reviews */}
        <div>
          <h2 className="text-2xl font-black uppercase tracking-wider mb-6 border-b border-white/10 pb-4">User Reviews</h2>
          
          {isAuth ? (
            <form onSubmit={submitReview} className="mb-8 p-4 glass border border-white/10 rounded-2xl">
              <h4 className="font-bold mb-3 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-brand-pink" /> Write a Review</h4>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-white/60">Rating:</span>
                <input 
                  type="number" 
                  min="1" max="10" 
                  value={rating} 
                  onChange={(e) => {
                    let val = Number(e.target.value);
                    if (val > 10) val = 10;
                    setRating(val);
                  }}
                  onBlur={() => {
                    if (rating < 1) setRating(1);
                  }}
                  className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-center"
                />
                <span className="text-sm text-white/60">/ 10</span>
              </div>
              <MarkdownEditor 
                value={newReview}
                onChange={setNewReview}
                placeholder="What did you think of the movie? (Markdown supported)"
              />
              <button 
                type="submit" 
                disabled={isSubmitting || !newReview.trim()}
                className="w-full flex items-center justify-center gap-2 py-2 bg-brand-purple rounded-lg font-bold text-sm hover:bg-brand-purple/80 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Submitting...' : <><Send className="w-4 h-4" /> Post Review</>}
              </button>
            </form>
          ) : (
            <div className="mb-8 p-6 glass border border-white/10 rounded-2xl text-center">
              <p className="text-white/60 mb-4 text-sm font-medium">Log in to write a review and rate this movie.</p>
              <Link href="/login" className="inline-block px-6 py-2 bg-white text-black font-bold rounded-lg hover:scale-105 transition-transform text-sm">
                Log In
              </Link>
            </div>
          )}

          <div className="space-y-4">
            {reviews.length === 0 ? (
              <p className="text-center text-white/40 text-sm py-8">No reviews yet. Be the first!</p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="p-4 glass border border-white/5 rounded-2xl relative group">
                  {editingReviewId === review.id ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-bold text-sm">Editing Review</h4>
                        <div className="flex items-center gap-2">
                          <button onClick={handleCancelEdit} className="p-1 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white" title="Cancel">
                            <X className="w-4 h-4" />
                          </button>
                          <button onClick={() => submitEdit(review.id)} className="p-1 hover:bg-brand-purple/20 rounded-full transition-colors text-brand-pink" title="Save">
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-medium text-white/60">Rating:</span>
                        <input 
                          type="number" min="1" max="10" 
                          value={editRating} 
                          onChange={(e) => {
                            let val = Number(e.target.value);
                            if (val > 10) val = 10;
                            setEditRating(val);
                          }}
                          onBlur={() => {
                            if (editRating < 1) setEditRating(1);
                          }}
                          className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-center text-sm"
                        />
                        <span className="text-sm text-white/60">/ 10</span>
                      </div>
                      <MarkdownEditor 
                        value={editContent}
                        onChange={setEditContent}
                        placeholder="Edit your review..."
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-pink to-brand-purple flex items-center justify-center font-bold text-sm uppercase">
                            {review.user_email ? review.user_email[0] : 'U'}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-white/90">
                              {review.user_email ? review.user_email.split('@')[0] : `User ${review.user_id}`}
                            </span>
                            <span className="text-xs text-white/40">{new Date(review.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {userEmail && review.user_email === userEmail && (
                            <button 
                              onClick={() => handleEditClick(review)}
                              className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-all text-white/60 hover:text-white"
                              title="Edit Review"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-md">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-xs font-bold">{review.rating}/10</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-white/80 prose prose-invert prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0 max-w-none">
                        <ReactMarkdown>{review.content}</ReactMarkdown>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showTrailer && (
          <TrailerModal 
            movie={{ id: String(movie.id), title: movie.title, poster: movie.poster_path, overview: movie.overview }} 
            trailerKey={trailerKey} 
            onClose={() => setShowTrailer(false)} 
          />
        )}
      </AnimatePresence>
    </main>
  );
}
