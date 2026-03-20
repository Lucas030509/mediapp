async function checkSchema() {
    const res = await fetch('https://jxrzxizvorxnizsbyuqn.supabase.co/rest/v1/doctors?limit=1', {
        headers: {
            'apikey': 'sb_publishable_QHmZkoSdekfOoNaBP1POSQ_5VMh7zFP',
            'Authorization': 'Bearer sb_publishable_QHmZkoSdekfOoNaBP1POSQ_5VMh7zFP'
        }
    });
    const data = await res.json();
    console.log((data && data.length) ? Object.keys(data[0]) : "Empty table or error");
    console.log(data);
}
checkSchema();
