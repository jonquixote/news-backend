const aws = require('aws-sdk');
const Busboy = require('busboy');

// Initialize S3 client
const s3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        const busboy = new Busboy({ headers: req.headers });
        const uploads = [];

        busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
            const params = {
                Bucket: process.env.AWS_S3_BUCKET_NAME,
                Key: `${Date.now()}_${filename}`,
                Body: file,
                ContentType: mimetype,
                ACL: 'public-read' // Adjust as needed
            };
            uploads.push(s3.upload(params).promise());
        });

        busboy.on('finish', async () => {
            try {
                const results = await Promise.all(uploads);
                const videoUrls = results.map(result => result.Location);
                res.status(200).json({ message: 'Video uploaded successfully', videoUrls });
            } catch (error) {
                console.error('Error uploading videos:', error);
                res.status(500).json({ message: 'Error uploading videos', error: error.message });
            }
        });

        busboy.on('error', (error) => {
            console.error('Busboy error:', error);
            res.status(500).json({ message: 'Error parsing the form', error: error.message });
        });

        req.pipe(busboy);
    } else if (req.method === 'GET') {
        res.status(200).json({ message: 'Video upload endpoint is accessible' });
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
};