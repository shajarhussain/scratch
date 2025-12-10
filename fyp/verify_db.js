const mongoose = require('mongoose');

// Attempting to clean the URI:
// Original: mongodb+srv://shajarmalik5582_db: Shajar@12345 @cluster0.kvfp64r.mongodb.net/?appName=Cluster0
// Cleaned: Remove spaces, URL encode password '@' to '%40'
// Password seems to be 'Shajar@12345'
const password = encodeURIComponent('Shajar@12345');
const uri = `mongodb+srv://shajarmalik5582_db:${password}@cluster0.kvfp64r.mongodb.net/?appName=Cluster0`;

console.log("Attempting to connect to:", uri.replace(password, '****'));

mongoose.connect(uri)
    .then(() => {
        console.log("SUCCESS: Connected to MongoDB!");
        process.exit(0);
    })
    .catch(err => {
        console.error("ERROR: Connection failed.");
        console.error(err.message);
        process.exit(1);
    });
