/**
 * Complete Amharic Fidel (Alphabet) Data
 * 
 * Contains all 33 base consonants with their 7 vowel modifications
 * Each consonant family includes:
 * - id: unique identifier
 * - label: phonetic label for search and display
 * - characters: array of 7 characters (ä, u, i, a, e, ə, o order)
 */

export const VOWEL_ORDER = ['ä', 'u', 'i', 'a', 'e', 'ə', 'o'];

export const FIDEL_DATA = [
  {
    id: 'h',
    label: 'h',
    characters: ['ሀ', 'ሁ', 'ሂ', 'ሃ', 'ሄ', 'ህ', 'ሆ']
  },
  {
    id: 'l',
    label: 'l',
    characters: ['ለ', 'ሉ', 'ሊ', 'ላ', 'ሌ', 'ል', 'ሎ']
  },
  {
    id: 'ḥ',
    label: 'ḥ',
    characters: ['ሐ', 'ሑ', 'ሒ', 'ሓ', 'ሔ', 'ሕ', 'ሖ']
  },
  {
    id: 'm',
    label: 'm',
    characters: ['መ', 'ሙ', 'ሚ', 'ማ', 'ሜ', 'ም', 'ሞ']
  },
  {
    id: 's',
    label: 's',
    characters: ['ሠ', 'ሡ', 'ሢ', 'ሣ', 'ሤ', 'ሥ', 'ሦ']
  },
  {
    id: 'r',
    label: 'r',
    characters: ['ረ', 'ሩ', 'ሪ', 'ራ', 'ሬ', 'ር', 'ሮ']
  },
  {
    id: 's2',
    label: 's',
    characters: ['ሰ', 'ሱ', 'ሲ', 'ሳ', 'ሴ', 'ስ', 'ሶ']
  },
  {
    id: 'sh',
    label: 'sh',
    characters: ['ሸ', 'ሹ', 'ሺ', 'ሻ', 'ሼ', 'ሽ', 'ሾ']
  },
  {
    id: 'q',
    label: 'q',
    characters: ['ቀ', 'ቁ', 'ቂ', 'ቃ', 'ቄ', 'ቅ', 'ቆ']
  },
  {
    id: 'b',
    label: 'b',
    characters: ['በ', 'ቡ', 'ቢ', 'ባ', 'ቤ', 'ብ', 'ቦ']
  },
  {
    id: 't',
    label: 't',
    characters: ['ተ', 'ቱ', 'ቲ', 'ታ', 'ቴ', 'ት', 'ቶ']
  },
  {
    id: 'ch',
    label: 'ch',
    characters: ['ቸ', 'ቹ', 'ቺ', 'ቻ', 'ቼ', 'ች', 'ቾ']
  },
  {
    id: 'ḫ',
    label: 'ḫ',
    characters: ['ኀ', 'ኁ', 'ኂ', 'ኃ', 'ኄ', 'ኅ', 'ኆ']
  },
  {
    id: 'n',
    label: 'n',
    characters: ['ነ', 'ኑ', 'ኒ', 'ና', 'ኔ', 'ን', 'ኖ']
  },
  {
    id: 'ñ',
    label: 'ñ',
    characters: ['ኘ', 'ኙ', 'ኚ', 'ኛ', 'ኜ', 'ኝ', 'ኞ']
  },
  {
    id: 'a',
    label: 'a',
    characters: ['አ', 'ኡ', 'ኢ', 'ኣ', 'ኤ', 'እ', 'ኦ']
  },
  {
    id: 'k',
    label: 'k',
    characters: ['ከ', 'ኩ', 'ኪ', 'ካ', 'ኬ', 'ክ', 'ኮ']
  },
  {
    id: 'h2',
    label: 'h',
    characters: ['ኸ', 'ኹ', 'ኺ', 'ኻ', 'ኼ', 'ኽ', 'ኾ']
  },
  {
    id: 'w',
    label: 'w',
    characters: ['ወ', 'ዉ', 'ዊ', 'ዋ', 'ዌ', 'ው', 'ዎ']
  },
  {
    id: 'ʿ',
    label: 'ʿ',
    characters: ['ዐ', 'ዑ', 'ዒ', 'ዓ', 'ዔ', 'ዕ', 'ዖ']
  },
  {
    id: 'z',
    label: 'z',
    characters: ['ዘ', 'ዙ', 'ዚ', 'ዛ', 'ዜ', 'ዝ', 'ዞ']
  },
  {
    id: 'zh',
    label: 'zh',
    characters: ['ዠ', 'ዡ', 'ዢ', 'ዣ', 'ዤ', 'ዥ', 'ዦ']
  },
  {
    id: 'y',
    label: 'y',
    characters: ['የ', 'ዩ', 'ዪ', 'ያ', 'ዬ', 'ይ', 'ዮ']
  },
  {
    id: 'd',
    label: 'd',
    characters: ['ደ', 'ዱ', 'ዲ', 'ዳ', 'ዴ', 'ድ', 'ዶ']
  },
  {
    id: 'j',
    label: 'j',
    characters: ['ጀ', 'ጁ', 'ጂ', 'ጃ', 'ጄ', 'ጅ', 'ጆ']
  },
  {
    id: 'g',
    label: 'g',
    characters: ['ገ', 'ጉ', 'ጊ', 'ጋ', 'ጌ', 'ግ', 'ጎ']
  },
  {
    id: 'ṭ',
    label: 'ṭ',
    characters: ['ጠ', 'ጡ', 'ጢ', 'ጣ', 'ጤ', 'ጥ', 'ጦ']
  },
  {
    id: 'ch2',
    label: "ch'",
    characters: ['ጨ', 'ጩ', 'ጪ', 'ጫ', 'ጬ', 'ጭ', 'ጮ']
  },
  {
    id: 'p2',
    label: "p'",
    characters: ['ጰ', 'ጱ', 'ጲ', 'ጳ', 'ጴ', 'ጵ', 'ጶ']
  },
  {
    id: 's3',
    label: "s'",
    characters: ['ጸ', 'ጹ', 'ጺ', 'ጻ', 'ጼ', 'ጽ', 'ጾ']
  },
  {
    id: 's4',
    label: "ṣ'",
    characters: ['ፀ', 'ፁ', 'ፂ', 'ፃ', 'ፄ', 'ፅ', 'ፆ']
  },
  {
    id: 'f',
    label: 'f',
    characters: ['ፈ', 'ፉ', 'ፊ', 'ፋ', 'ፌ', 'ፍ', 'ፎ']
  },
  {
    id: 'p',
    label: 'p',
    characters: ['ፐ', 'ፑ', 'ፒ', 'ፓ', 'ፔ', 'ፕ', 'ፖ']
  }
];

export default FIDEL_DATA;
