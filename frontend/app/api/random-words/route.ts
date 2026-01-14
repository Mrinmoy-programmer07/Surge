import { NextResponse } from 'next/server';

// Scramble a word by shuffling its letters
function scrambleWord(word: string): string {
  const letters = word.split('');
  let scrambled = '';
  
  // Keep shuffling until we get something different from original
  do {
    const shuffled = [...letters];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    scrambled = shuffled.join('');
  } while (scrambled === word && word.length > 1);
  
  return scrambled;
}

// Fallback words in case API fails
const FALLBACK_WORDS = [
  "ALGORITHM", "BLOCKCHAIN", "COMPUTER", "DATABASE", "ENCRYPT",
  "FUNCTION", "GRAPHICS", "HARDWARE", "INTERNET", "JAVASCRIPT",
  "KEYBOARD", "LANGUAGE", "MEMORY", "NETWORK", "OPTIMIZE",
  "PROTOCOL", "QUANTUM", "RUNTIME", "SOFTWARE", "TERMINAL",
  "UPLOAD", "VIRTUAL", "WIRELESS", "EXECUTE", "YOUTUBE"
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const count = parseInt(searchParams.get('count') || '10');
  const minLength = parseInt(searchParams.get('minLength') || '7');
  const maxLength = parseInt(searchParams.get('maxLength') || '14');
  
  try {
    // Try to fetch from Random Word API
    const response = await fetch(
      `https://random-word-api.vercel.app/api?words=${count * 3}`,
      { next: { revalidate: 0 } } // No caching
    );
    
    if (!response.ok) {
      throw new Error('API request failed');
    }
    
    const allWords: string[] = await response.json();
    
    // Filter words by length, format, and remove duplicates
    const seenWords = new Set<string>();
    const validWords = allWords
      .filter(word => {
        const upperWord = word.toUpperCase();
        if (seenWords.has(upperWord)) return false; // Skip duplicates
        if (word.length < minLength || word.length > maxLength) return false;
        if (!/^[a-zA-Z]+$/.test(word)) return false; // Only letters
        seenWords.add(upperWord);
        return true;
      })
      .slice(0, count)
      .map(word => ({
        word: word.toUpperCase(),
        scrambled: scrambleWord(word.toUpperCase())
      }));
    
    // If we don't have enough words, add from fallback
    if (validWords.length < count) {
      const needed = count - validWords.length;
      const shuffledFallback = [...FALLBACK_WORDS]
        .sort(() => Math.random() - 0.5)
        .slice(0, needed)
        .map(word => ({
          word: word,
          scrambled: scrambleWord(word)
        }));
      validWords.push(...shuffledFallback);
    }
    
    return NextResponse.json({
      success: true,
      words: validWords
    });
    
  } catch (error) {
    console.error('Random word API error:', error);
    
    // Return fallback words on error
    const shuffledFallback = [...FALLBACK_WORDS]
      .sort(() => Math.random() - 0.5)
      .slice(0, count)
      .map(word => ({
        word: word,
        scrambled: scrambleWord(word)
      }));
    
    return NextResponse.json({
      success: true,
      words: shuffledFallback,
      fallback: true
    });
  }
}
