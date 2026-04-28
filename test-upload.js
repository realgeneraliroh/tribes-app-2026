const fs = require('fs');
fetch('http://localhost:9002/api/upload', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': 'test'
  },
  body: new FormData()
}).then(res => res.text()).then(console.log).catch(console.error);
