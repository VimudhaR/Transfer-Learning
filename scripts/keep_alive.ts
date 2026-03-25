import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || getEnvVar('VITE_SUPABASE_ANON_KEY');

function getEnvVar(key: string): string | undefined {
    try {
        const envPath = path.resolve(__dirname, '../.env');
        if (fs.existsSync(envPath)) {
            const envConfig = fs.readFileSync(envPath, 'utf8');
            const lines = envConfig.split('\n');
            for (const line of lines) {
                const [k, v] = line.split('=');
                if (k && k.trim() === key) {
                    return v.trim();
                }
            }
        }
    } catch (error) {
        // Ignore error if .env doesn't exist (e.g. in GitHub Actions)
    }
    return undefined;
}

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function keepAlive() {
    console.log('Pinging Supabase...');

    // Try to read from clinical_analyses table, or just check health/auth
    // A simple read query is enough to count as activity
    const { data, error } = await supabase
        .from('clinical_analyses')
        .select('id')
        .limit(1);

    if (error) {
        console.error('❌ Error pinging Supabase:', error);
        process.exit(1);
    } else {
        console.log('✅ Successfully pinged Supabase. Data:', data);
    }
}

keepAlive();
