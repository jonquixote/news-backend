module.exports = (req, res) => {
    if (req.method === 'POST') {
      console.log('Received POST request to /api/uploadvideo');
      res.status(200).json({ message: 'Video upload endpoint reached successfully' });
    } else if (req.method === 'GET') {
      console.log('Received GET request to /api/uploadvideo');
      res.status(200).json({ message: 'Video upload endpoint is accessible' });
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  };