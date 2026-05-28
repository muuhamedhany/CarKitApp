// Central configuration — update API_URL to your machine's IP
export const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Supabase — direct storage access
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Google OAuth — Client IDs from Google Cloud Console
export const GOOGLE_WEB_CLIENT_ID = '339373773215-semsoh8j5o4e80usk1qk1e13mnug0stu.apps.googleusercontent.com';
export const GOOGLE_IOS_CLIENT_ID = '339373773215-b07tef610n7ouckslhbv87iq650b9jdn.apps.googleusercontent.com';
