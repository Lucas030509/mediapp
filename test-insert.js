const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jxrzxizvorxnizsbyuqn.supabase.co';
const supabaseKey = 'sb_publishable_QHmZkoSdekfOoNaBP1POSQ_5VMh7zFP';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase.from('doctors').insert([{
        first_name: 'Test',
        last_name: 'Test',
        specialty_id: '123e4567-e89b-12d3-a456-426614174000',
        license_number: '12345'
    }]);
    console.log('Insert Error:', JSON.stringify(error, null, 2));
}

check();
