const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const http = require('http');

// Create a dummy audio file
const audioPath = path.join(__dirname, 'test_audio.webm');
fs.writeFileSync(audioPath, 'dummy audio content');

const form = new FormData();
const metadata = {
    user_metadata: {
        user_id: 'test_user_123',
        sex: 'female',
        age: 25,
        stress_level: 5,
        nationality: 'US',
        mother_tongue: 'English',
        consent_timestamp: Date.now()
    },
    session_info: {
        level: '3000',
        total_score: 100,
        duration_ms: 60000,
        phrases_matched: 10
    },
    phrase_events: [
        { phrase: 'hello world', timestamp: 1000, pressure_metric: 0.5, level: '3000' }
    ]
};

form.append('metadata', JSON.stringify(metadata));
form.append('audio', fs.createReadStream(audioPath));

const request = http.request({
    method: 'POST',
    host: 'localhost',
    port: 3000,
    path: '/api/submit',
    headers: form.getHeaders(),
}, (response) => {
    let data = '';
    response.on('data', (chunk) => {
        data += chunk;
    });
    response.on('end', () => {
        console.log('Response Status:', response.statusCode);
        console.log('Response Body:', data);

        // Cleanup
        fs.unlinkSync(audioPath);
    });
});

request.on('error', (err) => {
    console.error('Request Error:', err);
});

form.pipe(request);
