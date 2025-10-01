
// js/config.js - API Configuration
(function() {
    const isLocal = (window.location.hostname.includes('localhost') || window.location.hostname === '127.0.0.1');
    
    window.API_BASE_URL = isLocal
        ? 'http://localhost:3000/v1'
        : '/v1';

    // Test backend availability (non-blocking) - endast localhost
    if (isLocal) {
        setTimeout(() => {
            fetch(`${window.API_BASE_URL}/health`)
                .catch(error => {
                    console.warn('⚠️ Backend health check failed:', error.message);
                });
        }, 1000);
    }
})();
