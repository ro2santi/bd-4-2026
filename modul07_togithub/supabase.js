import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'gunakan url masing-masing'; 
const SUPABASE_ANON_KEY = 'gunakan api masing-masing';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);