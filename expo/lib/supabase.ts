import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://qteobbhbblxanyzbmiec.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0ZW9iYmhiYmx4YW55emJtaWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MDYwNjIsImV4cCI6MjA4OTE4MjA2Mn0.pqMapws0e_owU4qBAW_Cg4HGbWnWq-CqmHYC_GC8n1Q';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
