const https = require('https');
const fs = require('fs');

function downloadFile(url, filename, callback = (error) => {
}) {
    const dir = filename.substring(0, filename.lastIndexOf('/') + 1);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {recursive: true});
    }
    const file = fs.createWriteStream(filename);

    https.get(url, response => {
        response.pipe(file);

        file.on('finish', () => {
            file.close();
            callback(null);
        });
    }).on('error', err => {
        fs.unlink(filename);
        callback(err);
    });
}

module.exports = downloadFile;
