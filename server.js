// Importing dependencies
const express = require('express');
const multer = require('multer');
const path = require('path');
const mysql = require('mysql2');
const fs = require('fs');

// Initialize Express app
const app = express();
const port = 3000;

// Middleware for parsing JSON and serving static files
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // To handle form submissions
app.use(express.static(path.join(__dirname, 'admin'))); // Serve frontend
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploaded files

// Database connection
const db = mysql.createConnection({
  host: 'localhost', // Database host
  user: 'root', // Database username
  password: '', // Database password
  database: 'INDUCKT', // Database name
});

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Connected to database!');
  }
});

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/'); // Set the upload directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // Unique filename
  },
});

const upload = multer({ storage });

// Serve the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

app.get('/fetch-blogs', (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : 9;
  const offset = req.query.offset ? parseInt(req.query.offset) : 0;

  // Query to get blogs
  const query = 'SELECT * FROM blogs LIMIT ? OFFSET ?';
  db.query(query, [limit, offset], (err, results) => {
    if (err) {
      console.error('Error fetching blogs:', err);
      return res.status(500).json({ error: 'Failed to fetch blogs.' });
    }
    res.json(results); // Send blogs as JSON
  });
});

// Dynamic route to fetch uploaded files
app.get('/file/:fileName', (req, res) => {
  const fileName = req.params.fileName; // Get file name from the request
  const filePath = path.join(__dirname, 'uploads', fileName);

  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found.');
  }

  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(500).send('Error serving the file.');
    }
  });
});


// Handle form submission and insert into database
app.post('/submit-blog', upload.single('imageUpload'), (req, res) => {
  const { newsHeadline, shortDescription, blogContent, blogLink } = req.body;
  const filePath = req.file ? `/uploads/${req.file.filename}` : null;

  // Insert into the database
  const query = `
    INSERT INTO blogs (headline, short_description, content, link, image_url)
    VALUES (?, ?, ?, ?, ?)
  `;
  const values = [newsHeadline, shortDescription, blogContent, blogLink, filePath];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error inserting into database:', err);
      return res.status(500).json({ error: 'Failed to save blog data.' });
    }

    const blogId = result.insertId; // Get the newly generated ID from the database
    // Send back the blog data along with the id
    res.status(200).json({
      message: 'Blog submitted successfully!',
      blogId: blogId,
      blog: {
        headline: newsHeadline,
        shortDescription: shortDescription,
        content: blogContent,
        link: blogLink,
        filePath: filePath,
        id: blogId  // Send the ID to the frontend
      }
    });
  });
});



// Handle blog deletion
app.delete('/delete-blog/:id', (req, res) => {

    const blogId = parseInt(req.params.id, 10); // Convert to integer

    if (isNaN(blogId)) {
      return res.status(400).json({ error: 'Invalid blog ID.' });
    }

    const query = 'DELETE FROM blogs WHERE blog_id = ?';
    db.query(query, [blogId], (err, result) => {
      if (err) {
        console.error('Error deleting blog:', err);
        return res.status(500).json({ error: 'Failed to delete blog.' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Blog not found.' });
      }

      res.status(200).json({ message: 'Blog deleted successfully.' });
    });

});


// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
