// Simulates an external API call to a plagiarism detection service (e.g., Turnitin)
exports.scanDocument = async (fileUrl) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simulate a random similarity score between 0% and 40%
            // Occasionally spike to high similarity for testing
            const isHigh = Math.random() > 0.8;
            const score = isHigh ? Math.floor(Math.random() * 50) + 30 : Math.floor(Math.random() * 20);
            resolve(score);
        }, 1500); // 1.5s delay
    });
};
