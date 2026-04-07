import { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { FIDEL_DATA, VOWEL_ORDER } from '../data/fidelData';

/**
 * FidelChart Component
 * 
 * An interactive React component that displays the Amharic Fidel (alphabet) chart
 * in an educational grid format. The component organizes consonant families in rows
 * and vowel modifications in columns, providing students with a clear, structured
 * view of the Amharic writing system.
 * 
 * Features:
 * - CSS Grid layout with 8 columns (1 label + 7 vowel columns)
 * - Responsive design with horizontal scrolling on mobile devices
 * - Sticky first column for consonant family labels
 * - Accessible with ARIA attributes and semantic structure
 * - Tailwind CSS styling with classroom poster aesthetic
 * 
 * @component
 * @returns {JSX.Element} The rendered Fidel chart component
 * 
 * @example
 * import FidelChart from './components/FidelChart';
 * 
 * function App() {
 *   return <FidelChart />;
 * }
 */
function FidelChart() {
  const [searchQuery, setSearchQuery] = useState('');
  const [playingCell, setPlayingCell] = useState(null);

  // Hybrid audio playback: tries audio file first, falls back to TTS
  const handlePlayAudio = async (character, familyId, vowelIndex) => {
    try {
      // Try multiple audio formats in order of preference
      const audioFormats = ['mp3', 'm4a', 'wav', 'ogg'];
      let audioLoaded = false;
      
      // Set playing state for visual feedback
      setPlayingCell(`${familyId}-${vowelIndex}`);
      
      for (const format of audioFormats) {
        if (audioLoaded) break;
        
        try {
          const audioPath = `http://localhost:5000/uploads/audio/fidel/${familyId}_${vowelIndex}.${format}`;
          const audio = new Audio(audioPath);
          
          // Attempt to play the audio
          await audio.play();
          audioLoaded = true;
          
          // Reset playing state after audio ends
          audio.onended = () => {
            setPlayingCell(null);
          };
          
          console.log(`Playing audio: ${familyId}_${vowelIndex}.${format}`);
          break; // Successfully loaded and playing
          
        } catch (formatError) {
          // This format didn't work, try next one
          continue;
        }
      }
      
      // If no audio format worked, fall back to TTS
      if (!audioLoaded) {
        console.log(`No audio file found for ${familyId}_${vowelIndex}, using TTS fallback`);
        handleSpeak(character, familyId, vowelIndex);
      }
      
    } catch (error) {
      console.error('Error with audio playback:', error);
      // Fall back to TTS
      handleSpeak(character, familyId, vowelIndex);
    }
  };

  // Text-to-Speech fallback function
  const handleSpeak = (character, familyId, vowelIndex) => {
    try {
      // Check if speech synthesis is supported
      if (!window.speechSynthesis) {
        alert('Audio not available and text-to-speech is not supported in your browser.');
        setPlayingCell(null);
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      // Create speech utterance
      const utterance = new SpeechSynthesisUtterance(character);
      
      // Set language to Amharic (Ethiopia)
      utterance.lang = 'am-ET';
      
      // Optional: Adjust speech parameters
      utterance.rate = 0.8; // Slightly slower for clarity
      utterance.pitch = 1.0; // Normal pitch
      utterance.volume = 1.0; // Full volume

      // Handle speech end
      utterance.onend = () => {
        setPlayingCell(null);
      };

      // Handle speech error
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setPlayingCell(null);
      };

      // Speak the character
      window.speechSynthesis.speak(utterance);

    } catch (error) {
      console.error('Error with text-to-speech:', error);
      setPlayingCell(null);
    }
  };

  // Vowel mapping for character-level search
  const vowelMap = {
    'ä': 0, 'e': 0, // First vowel (ä) - also matches 'e' for ease
    'u': 1,
    'i': 2,
    'a': 3, // Fourth vowel (a)
    'e': 4, // Fifth vowel (e) 
    'ə': 5, // Sixth vowel (ə)
    'o': 6
  };

  // Helper function to check if a specific character matches the search
  const isCharacterMatch = (family, vowelIndex) => {
    if (!searchQuery.trim()) return false;
    const query = searchQuery.toLowerCase().trim();
    
    // Must be at least 2 characters for character-level search
    if (query.length < 2) return false;
    
    const consonantPart = query.slice(0, -1);
    const vowelPart = query.slice(-1);
    
    const consonantMatch = 
      family.label.toLowerCase() === consonantPart ||
      family.id.toLowerCase() === consonantPart;
    
    const vowelMatch = vowelMap[vowelPart] === vowelIndex;
    
    return consonantMatch && vowelMatch;
  };

  // Enhanced filter logic for both family and character-level search
  const filteredData = FIDEL_DATA.filter((family) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    
    // Check if searching for family name (single letter or label)
    if (query.length <= 2 && !query.match(/[aeiouəä]/)) {
      return (
        family.label.toLowerCase().includes(query) ||
        family.id.toLowerCase().includes(query)
      );
    }
    
    // Check for specific character search (e.g., "hu", "la", "mi")
    // Extract consonant and vowel from query
    const consonantPart = query.slice(0, -1); // All but last character
    const vowelPart = query.slice(-1); // Last character
    
    // Check if this family matches the consonant part
    const consonantMatch = 
      family.label.toLowerCase() === consonantPart ||
      family.id.toLowerCase() === consonantPart ||
      family.label.toLowerCase().startsWith(consonantPart);
    
    if (consonantMatch && vowelMap.hasOwnProperty(vowelPart)) {
      return true;
    }
    
    // Fallback to general label/id search
    return (
      family.label.toLowerCase().includes(query) ||
      family.id.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Instructions Banner */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">How to use this chart:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Click any character</strong> to hear its pronunciation</li>
              <li>• <strong>Search</strong> by family (h, l, m) or specific character (hu, la, mi)</li>
              <li>• Characters will highlight in <span className="bg-yellow-200 px-1 rounded">yellow</span> when searched</li>
              <li>• <span className="text-xs text-gray-600">Audio files provide accurate pronunciation. TTS is used as fallback.</span></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by family (h, l, m) or character (hu, la, mi)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-12 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-gray-700 placeholder-gray-400"
          />
          <svg
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-colors font-medium"
          >
            Clear
          </button>
        )}
      </div>

      {/* Results Count */}
      {searchQuery && (
        <div className="text-sm text-gray-600">
          Found {filteredData.length} consonant {filteredData.length === 1 ? 'family' : 'families'}
        </div>
      )}

      {/* Empty State */}
      {filteredData.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No consonant family found
          </h3>
          <p className="text-gray-500">
            No results matching "{searchQuery}". Try searching for families (h, l, m) or specific characters (hu, la, mi).
          </p>
        </div>
      ) : (
        /* Fidel Chart Grid */
        <div className="w-full overflow-x-auto md:overflow-x-visible">
      <div 
        role="table" 
        aria-label="Amharic Fidel Chart"
        className="grid grid-cols-[auto_repeat(7,1fr)] gap-0 border border-gray-300 bg-white min-w-[640px] md:min-w-0"
      >
        {/* Header Row */}
        <div 
          role="columnheader"
          className="bg-blue-100 border border-gray-300 p-3 text-center font-semibold text-gray-800 sticky left-0 z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
          tabIndex={0}
        >
          Label
        </div>
        {VOWEL_ORDER.map((vowel, index) => (
          <div
            key={index}
            role="columnheader"
            className="bg-blue-100 border border-gray-300 p-3 text-center font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
            tabIndex={0}
          >
            {vowel}
          </div>
        ))}

        {/* Data Rows */}
        {filteredData.map((family) => (
          <>
            {/* Label Cell - Sticky Column */}
            <div
              key={`${family.id}-label`}
              role="rowheader"
              className="bg-gray-50 border border-gray-300 p-3 font-semibold text-gray-800 sticky left-0 z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
              tabIndex={0}
            >
              {family.label}
            </div>
            {/* Character Cells */}
            {family.characters.map((character, index) => {
              const isHighlighted = isCharacterMatch(family, index);
              const isPlaying = playingCell === `${family.id}-${index}`;
              return (
                <div
                  key={`${family.id}-${index}`}
                  role="cell"
                  onClick={() => handlePlayAudio(character, family.id, index)}
                  className={`relative border border-gray-300 p-4 text-center text-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset transition-all cursor-pointer hover:bg-blue-50 active:scale-95 active:bg-blue-200 ${
                    isHighlighted 
                      ? 'bg-yellow-200 text-gray-900 font-bold ring-2 ring-yellow-400' 
                      : isPlaying
                      ? 'bg-green-200 ring-2 ring-green-400 animate-pulse'
                      : 'text-gray-900'
                  }`}
                  style={{ fontFamily: "'Abyssinica SIL', serif" }}
                  tabIndex={0}
                  title="Click to hear pronunciation"
                >
                  {/* Speaker icon in corner */}
                  <div className="absolute top-1 right-1">
                    <Volume2 
                      className={`w-3 h-3 transition-colors ${
                        isPlaying 
                          ? 'text-teal-600' 
                          : 'text-gray-400 opacity-50 group-hover:opacity-100'
                      }`}
                    />
                  </div>
                  
                  {character}
                </div>
              );
            })}
          </>
        ))}
      </div>
      </div>
      )}
    </div>
  );
}

export default FidelChart;
