// Soft feminine color palette for manifestation app
const rosePink = '#F8BBD9';
const lavender = '#E4C1F9';
const peach = '#FCB69F';
const mintGreen = '#A8E6CF';
const lightAmber = '#FFD93D';
const softGray = '#F5F5F5';
const deepRose = '#D63384';
const deepPurple = '#6A4C93';

export const gradients = {
  primary: ['#F8BBD9', '#E4C1F9'] as const, // Rose to Lavender
  secondary: ['#FCB69F', '#FFD93D'] as const, // Peach to Amber
  success: ['#A8E6CF', '#90EE90'] as const, // Mint to Light Green
  sunset: ['#FF9A9E', '#FECFEF'] as const, // Pink to Light Pink
  ocean: ['#A8E6CF', '#C7CEEA'] as const, // Mint to Light Blue
};

const tintColorLight = deepRose;
const tintColorDark = rosePink;

export default {
  light: {
    text: '#2D3436',
    background: '#FFFFFF',
    tint: tintColorLight,
    tabIconDefault: '#B2BABB',
    tabIconSelected: tintColorLight,
    card: '#FFFFFF',
    border: '#E8E8E8',
    notification: deepRose,
    primary: deepRose,
    secondary: deepPurple,
    accent: peach,
    surface: softGray,
    placeholder: '#A0A0A0',
  },
  dark: {
    text: '#FFFFFF',
    background: '#1A1A1A',
    tint: tintColorDark,
    tabIconDefault: '#6C7B7F',
    tabIconSelected: tintColorDark,
    card: '#2A2A2A',
    border: '#404040',
    notification: rosePink,
    primary: rosePink,
    secondary: lavender,
    accent: peach,
    surface: '#2D2D2D',
    placeholder: '#808080',
  },
  colors: {
    rosePink,
    lavender,
    peach,
    mintGreen,
    lightAmber,
    softGray,
    deepRose,
    deepPurple,
  },
};
