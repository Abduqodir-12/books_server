const express = require('express');
const fileUpload = require('express-fileupload');
const { v4 } = require('uuid');
const cors = require('cors')

const fs = require('fs');
const path = require('path');

const app = express();

const PORT = process.env.PORT || 4001;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());

let deleteFile = (addr) => {
    try {
      fs.unlinkSync(path.join(__dirname, "public", addr))
    } catch (error) {
        console.log(error);
    }
}

const readData = () => {
    try {
        return JSON.parse(fs.readFileSync(path.join(__dirname, 'database', 'data.txt'), "utf-8"));
    } catch (error) {
        console.error('Error reading data:', error);
        return [];
    }
};

const writeData = (data) => {
    try {
        fs.writeFileSync(path.join(__dirname, 'database', 'data.txt'), JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error writing data:', error);
    }
};

app.get('/', (req, res) => {
    res.send('Welcome to bookApp');
});

app.get('/book', (req, res) => {
    const books = readData();
    res.send({ message: 'All books', books });
});

app.post('/book', (req, res) => {
    try {
        const { title, price, author, desc } = req.body;
        const { image } = req.files;

        const imgName = v4() + path.extname(image.name);
        image.mv(path.join(__dirname, 'public', imgName), (err) => {
            if (err) {
                throw err;
            }
        });

        const newBook = {
            id: v4(),
            title,
            price,
            author,
            desc,
            image: imgName,
            views: 0,
            createdAdd: new Date().toLocaleString()
        };
        const books = readData();
        books.push(newBook);
        writeData(books);
        res.send({ message: "Book added successfully", book: newBook });
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: error.message });
    }
});

app.get('/book/:id', (req, res) => {
    try {
        const { id } = req.params;
        const books = readData();
        const book = books.find(kitob => kitob.id === id);
        if (book) {
            return res.send({ message: 'Found book: ', book });
        }
        res.status(404).send({ message: 'Book not found' });
    } catch (error) {
        console.error('Error fetching book:', error);
        res.status(500).send({ message: 'Server error' });
    }
});

app.get('/search', (req, res) => {
    const { keyString } = req.query;
    const books = readData();
    const filteredBooks = books.filter(book => (book.title.toLowerCase()).includes(keyString.toLowerCase()));
    res.send({ message: 'Books found', books: filteredBooks });
});

app.delete('/book/:id', (req, res) => {
    let id = req.params.id;
    let books = readData();
    let book = books.find(book => book.id === id);
   
    deleteFile(book.image)

    books = books.filter(book => book.id != id);
    writeData(books)
    res.send({message:"deleted successfully!"})
});

app.put('/book/:id', (req, res) => {
    try {
        const { title, price, author, desc } = req.body;
        const { id } = req.params;
        const books = readData();
        const book = books.find(kitob => kitob.id === id);
        if (book) {
            title && (book.title = title)
            price && (book.price = price)
            author && (book.author = author)
            desc && (book.desc = desc)
            if(req.files) {
                const {image} = req.files
                fs.unlink(path.join(__dirname, 'public', book.img))
                const imgName = v4() + path.extname(image.name);
                image.mv(path.join(__dirname, 'public', imgName), (err) => {
                    if (err) {
                        throw err;
                    }
                });
                book.image = imgName
            }
            writeData(books)
            return res.send({ message: 'Updated ', book });
        }
        res.status(404).send({ message: 'Book not found' });
    } catch (error) {
        console.error('Error fetching book:', error);
        res.status(500).send({ message: 'Server error' });
    }
});
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));