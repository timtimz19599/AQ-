import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ajdgdiepegzpfinwuwaz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_xYGo_0OYfW71Xtm_9HP-IA_1QibnDfO';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
