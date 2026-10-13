import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(
    supabaseUrl,
    supabaseSecretKey
);