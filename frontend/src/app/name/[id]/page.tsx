'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Film } from 'lucide-react';
import { getPersonDetails, getPersonCredits, getTMDBImageUrl } from '@/lib/api';

export default function PersonDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [person, setPerson] = useState<any>(null);
  const [credits, setCredits] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [personData, creditsData] = await Promise.all([
          getPersonDetails(id as string),
          getPersonCredits(id as string)
        ]);
        setPerson(personData);
        setCredits(creditsData);
      } catch (err) {
        console.error("Failed to fetch person data", err);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (id) {
      fetchData();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!person || person.error) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">Person not found</h1>
        <button onClick={() => router.back()} className="mt-4 text-brand-purple hover:underline">Go Back</button>
      </div>
    );
  }

  // Sort credits by popularity or release date
  const sortedMovies = credits?.cast?.sort((a: any, b: any) => b.popularity - a.popularity) || [];

  return (
    <main className="min-h-screen bg-[#050505] text-white pb-20 pt-8 overflow-x-hidden">
      <div className="container mx-auto px-4">
        <button 
          onClick={() => router.back()}
          className="mb-8 flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex flex-col md:flex-row gap-12">
          {/* Left Column: Image & Personal Info */}
          <div className="w-full md:w-1/3 lg:w-1/4 shrink-0">
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10 mb-6">
              {person.profile_path ? (
                <img 
                  src={getTMDBImageUrl(person.profile_path, 'w500')} 
                  alt={person.name}
                  className="w-full h-auto object-cover"
                />
              ) : (
                <div className="w-full aspect-[2/3] bg-white/5 flex items-center justify-center text-white/40">
                  No Image Available
                </div>
              )}
            </div>
            
            <h3 className="text-xl font-black uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Personal Info</h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-white/60 font-medium">Known For</p>
                <p className="font-bold">{person.known_for_department}</p>
              </div>
              <div>
                <p className="text-white/60 font-medium">Gender</p>
                <p className="font-bold">{person.gender === 1 ? 'Female' : person.gender === 2 ? 'Male' : 'Not specified'}</p>
              </div>
              {person.birthday && (
                <div>
                  <p className="text-white/60 font-medium">Birthday</p>
                  <p className="font-bold">{person.birthday}</p>
                </div>
              )}
              {person.place_of_birth && (
                <div>
                  <p className="text-white/60 font-medium">Place of Birth</p>
                  <p className="font-bold">{person.place_of_birth}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Biography & Filmography */}
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-6">{person.name}</h1>
            
            <h3 className="text-2xl font-black uppercase tracking-wider mb-4">Biography</h3>
            <div className="text-white/80 leading-relaxed max-w-4xl mb-12 whitespace-pre-wrap text-sm">
              {person.biography || "We don't have a biography for this person."}
            </div>

            <h3 className="text-2xl font-black uppercase tracking-wider mb-6 flex items-center gap-3">
              <Film className="w-6 h-6 text-brand-purple" /> 
              Known For
            </h3>
            
            <div className="flex overflow-x-auto gap-4 pb-6 no-scrollbar snap-x">
              {sortedMovies.slice(0, 15).map((movie: any) => (
                <Link href={`/title/${movie.id}`} key={movie.id} className="snap-start min-w-[140px] sm:min-w-[160px]">
                  <div className="group cursor-pointer">
                    <div className="aspect-[2/3] rounded-xl overflow-hidden mb-2 border border-white/10 bg-white/5 relative">
                      {movie.poster_path ? (
                        <img 
                          src={getTMDBImageUrl(movie.poster_path)} 
                          alt={movie.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-xs text-center p-2 text-white/40">
                          {movie.title}
                        </div>
                      )}
                    </div>
                    <h4 className="font-bold text-sm truncate">{movie.title}</h4>
                    <p className="text-xs text-white/50 truncate">{movie.character}</p>
                  </div>
                </Link>
              ))}
            </div>
            
          </div>
        </div>
      </div>
    </main>
  );
}
