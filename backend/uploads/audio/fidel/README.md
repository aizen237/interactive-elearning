# Amharic Fidel Audio Files

This directory contains audio pronunciation files for the Amharic Fidel alphabet.

## File Naming Convention

Audio files should be named using the following pattern:
```
{familyId}_{vowelIndex}.{extension}
```

### Supported Audio Formats

The system will automatically try these formats in order:
1. **MP3** (`.mp3`) - Most compatible, recommended
2. **M4A** (`.m4a`) - Good quality, widely supported
3. **WAV** (`.wav`) - Uncompressed, larger file size
4. **OGG** (`.ogg`) - Open format, good compression

You can use any of these formats - the system will find and play whichever is available.

### Family IDs
The family ID corresponds to the consonant family (from fidelData.js):
- `h`, `l`, `h2` (ḥ), `m`, `s`, `r`, `s2`, `sh`, `q`, `b`, `t`, `ch`, `ḫ`, `n`, `ñ`, `a`, `k`, `h2`, `w`, `ʿ`, `z`, `zh`, `y`, `d`, `j`, `g`, `ṭ`, `ch2`, `p2`, `s3`, `s4`, `f`, `p`

### Vowel Indices
The vowel index corresponds to the column position (0-6):
- `0` = ä (first vowel)
- `1` = u (second vowel)
- `2` = i (third vowel)
- `3` = a (fourth vowel)
- `4` = e (fifth vowel)
- `5` = ə (sixth vowel)
- `6` = o (seventh vowel)

## Examples

- `h_0.mp3` or `h_0.m4a` = ሀ (ha with ä vowel)
- `h_1.mp3` or `h_1.m4a` = ሁ (hu)
- `h_2.mp3` or `h_2.m4a` = ሂ (hi)
- `l_0.mp3` or `l_0.m4a` = ለ (la with ä vowel)
- `l_1.mp3` or `l_1.m4a` = ሉ (lu)
- `sh_3.mp3` or `sh_3.m4a` = ሻ (sha)
- `ch_6.mp3` or `ch_6.m4a` = ቾ (cho)

## Total Files Needed

33 consonant families × 7 vowel forms = **231 audio files**

## Audio Format Specifications

- **Format**: MP3, M4A, WAV, or OGG (MP3 or M4A recommended)
- **Sample Rate**: 44.1 kHz (recommended)
- **Bit Rate**: 128 kbps or higher (for MP3/M4A)
- **Duration**: 1-2 seconds per character
- **Volume**: Normalized to prevent clipping

## Recording Tips

1. Use a native Amharic speaker for accurate pronunciation
2. Record in a quiet environment
3. Keep consistent volume across all files
4. Use clear, natural pronunciation
5. Add slight pause before and after the sound

## Placeholder Audio

If you don't have audio files yet, the system will show an alert when clicked. You can:
1. Record your own audio files
2. Use text-to-speech services (Google TTS, Amazon Polly)
3. Source from language learning resources
4. Hire a native speaker for professional recordings
