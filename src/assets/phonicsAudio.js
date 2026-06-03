// Phonics audio served as static files from public/sounds/phonics/
// Loaded on-demand by audio.js via new Audio(url)
export const PHONICS_AUDIO = Object.fromEntries(
  'abcdefghijklmnopqrstuvwxyz'.split('').map(c => [c, `/sounds/phonics/${c}.m4a`])
)
