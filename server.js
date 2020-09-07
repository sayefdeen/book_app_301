'use strict';

// Librries
require('dotenv').config();
const express = require('express');
const app = express();
const superAgent = require('superagent');
const pg = require('pg');
const PORT = process.env.PORT || 3000;
app.set('view engine', 'ejs');

// Using the public folder and sunFiles
app.use(express.static('./public'));

// To Read the body of the POST HTTP requsets
app.use(express.urlencoded({ extended: true }));

// Client

const client = new pg.Client(process.env.DATABASE_URL);

// Routs
app.get('/', mainPageHandler);
app.get('/searches/new', renderNewSearch);
app.get('/books/show', renderShowBooksPage);
app.get('/getBook/:bookID', viewBookDetails);
app.post('/searches/show', postSearchHanlde);
app.post('/addBook', insertBookIntoDB);

// ******************* Handelrres ***************

// newSearchHanlde

function mainPageHandler(req, res) {
  res.render('pages/index');
}

function renderNewSearch(req, res) {
  res.render('pages/searches/new');
}

function renderShowBooksPage(req, res) {
  const selectSQL = 'SELECT * FROM books_table';
  client.query(selectSQL).then((result) => {
    res.render('pages/books/show', { books: result.rows });
  });
}

// Get the Book data From the API
function postSearchHanlde(req, res) {
  const data = req.body;
  const titleORauthor = data.select;
  const name = data.searchbox;
  const url = `https://www.googleapis.com/books/v1/volumes?q=+in${titleORauthor}:${name}`;
  superAgent.get(url).then((results) => {
    let bookArray = results.body.items.map((book) => {
      return new Books(book);
    });
    res.render('pages/searches/show', { books: bookArray });
  });
}

function insertBookIntoDB(req, res) {
  let { author, title, isbn, image_url, descriptions } = req.body;
  console.log(req.body);
  let insertSQL =
    'INSERT INTO books_table (author,title,isbn,image_url,descriptions) VALUES ($1,$2,$3,$4,$5)';
  let safeValues = [author, title, isbn, image_url, descriptions];
  client.query(insertSQL, safeValues).then(() => {
    console.log('added to dataBase');
  });
}

function viewBookDetails(req, res) {
  let selectSQL = 'SELECT * FROM books_table WHERE id =$1';
  const id = req.params.bookID;
  let values = [id];
  client.query(selectSQL, values).then((data) => {
    res.render('pages/books/detail', { books: data.rows });
  });
}

// ******************* Constructors ***************

// Books Constructor

function Books(book) {
  this.author = book.volumeInfo.authors || `There is no authors`;
  this.title = book.volumeInfo.title;
  this.isbn =
    book.volumeInfo.industryIdentifiers[0].identifier || 'There is no isbn';
  this.image_url =
    book.volumeInfo.imageLinks.thumbnail || `https://i.imgur.com/J5LVHEL.jpg`;
  this.descriptions = book.volumeInfo.description || `There is no description`;
}

// Make Sure the Server is working
client.connect().then(() => {
  app.listen(PORT, () => {
    console.log(`Listining to ${PORT}`);
  });
});
