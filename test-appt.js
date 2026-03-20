const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://jxrzxizvorxnizsbyuqn.supabase.co',
    'sb_publishable_QHmZkoSdekfOoNaBP1POSQ_5VMh7zFP'
);

async function check() {
    const { error: insError } = await supabase.from('appointments').insert([{
        end_time: '12:00',
        start_time: '11:00',
        appointment_date: '2026-03-01',
        type: 'Consulta'
    }]);
    console.log('Insert error:', insError);
}

check();
