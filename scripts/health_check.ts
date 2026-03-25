import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Env Loading (same as keep_alive.ts)
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
    } catch (error) { }
    return undefined;
}

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkFunction(name: string, payload: any) {
    console.log(`\nTesting ${name}...`);
    const start = Date.now();
    const { data, error } = await supabase.functions.invoke('clinical-nlp-analysis', {
        body: payload
    });
    const duration = Date.now() - start;

    if (error) {
        console.error(`❌ Failed (${duration}ms):`, error.message || error);
        // Special check for common errors
        if (error.message?.includes('functions_client_error')) {
            console.log("   -> Hint: Is the function 'clinical-nlp-analysis' deployed?");
        }
        return false;
    } else if (data && data.error) {
        console.error(`❌ Returned Logic Error (${duration}ms):`, data.error);
        return false;
    } else {
        console.log(`✅ Success (${duration}ms)`);
        // console.log("   Result:", JSON.stringify(data.data || data, null, 2).slice(0, 100) + "...");
        return true;
    }
}

async function runHealthCheck() {
    console.log('Starting Health Check for Clinical NLP Functions...');

    const sampleText = "Patient presents with type 2 diabetes and hypertension. Prescribed Metformin 500mg.";

    // 1. NER
    await checkFunction('NER Analysis', {
        type: 'ner',
        text: sampleText,
        model: 'BioBERT'
    });

    // 2. Summarization
    await checkFunction('Summarization', {
        type: 'summarization',
        text: sampleText + " " + sampleText + " " + sampleText, // Make it longer
        model: 'DistilBART'
    });

    // 3. Keep Alive (Database Check)
    console.log('\nTesting Database Connection...');
    const { error: dbError } = await supabase.from('clinical_analyses').select('count').limit(1).single();
    if (dbError && dbError.code !== 'PX000' && dbError.code !== 'PGRST116') { // Ignore "0 rows" error
        console.error('❌ Database connection failed:', dbError.message);
    } else {
        console.log('✅ Database connection active');
    }

    console.log('\nHealth Check Complete.');
}

runHealthCheck();
