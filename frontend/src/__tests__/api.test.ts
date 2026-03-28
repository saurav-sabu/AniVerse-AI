import { describe, it, expect } from 'vitest';
import { getTMDBImageUrl } from '../lib/api';

describe('getTMDBImageUrl', () => {
  it('returns fallback for null', () => {
    const url = getTMDBImageUrl(null);
    expect(url).toContain('unsplash');
  });

  it('returns fallback for "None"', () => {
    const url = getTMDBImageUrl('None');
    expect(url).toContain('unsplash');
  });

  it('constructs TMDB URL for relative path', () => {
    const url = getTMDBImageUrl('/abc123.jpg');
    expect(url).toBe('https://image.tmdb.org/t/p/w500/abc123.jpg');
  });

  it('passes through full TMDB URLs', () => {
    const url = getTMDBImageUrl('https://image.tmdb.org/t/p/w500/abc.jpg');
    expect(url).toBe('https://image.tmdb.org/t/p/w500/abc.jpg');
  });
});
