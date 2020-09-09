'use strict';

// Librries
require('dotenv').config();
const express = require('express');
const app = express();
const superAgent = require('superagent');
const pg = require('pg');
const methodOverRide = require('method-override');
const PORT = process.env.PORT || 3000;
app.set('view engine', 'ejs');

// Using the public folder and sunFiles
app.use(express.static('./public'));
app.use(methodOverRide('_method'));

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
app.put('/updateBook/:bookID', updateBook);
app.delete('/deletBook/:bookID', deleteBook);

// ******************* Handelrres ***************

// newSearchHanlde

function mainPageHandler(req, res) {
  res.render('pages/index');
}

function renderNewSearch(req, res) {
  res.render('pages/searches/new');
}

async function renderShowBooksPage(req, res) {
  const count = await client
    .query('SELECT COUNT(id) FROM books_table')
    .then((result) => result.rows[0].count);
  const selectSQL = 'SELECT * FROM books_table';
  client
    .query(selectSQL)
    .then((result) => {
      res.render('pages/books/show', {
        books: result.rows,
        numberOfBooks: count,
      });
    })
    .catch(() => {
      errorPage(
        req,
        res,
        'There is an error in rendering the data from database'
      );
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
  // .catch(() => {
  //   errorPage(req, res, 'There is an error in the search API');
  // });
}

function insertBookIntoDB(req, res) {
  let { author, title, isbn, image_url, descriptions } = req.body;
  let insertSQL =
    'INSERT INTO books_table (author,title,isbn,image_url,descriptions) VALUES ($1,$2,$3,$4,$5)';
  let safeValues = [author, title, isbn, image_url, descriptions];
  client
    .query(insertSQL, safeValues)
    .then(() => {
      let sql = 'select * from books_table ORDER BY id DESC LIMIT 1';
      client.query(sql).then((result) => {
        res.redirect(`/getBook/${result.rows[0].id}`);
      });
    })
    .catch(() => {
      errorPage(req, res, 'There is an error in the insert query');
    });
}

function viewBookDetails(req, res) {
  let selectSQL = 'SELECT * FROM books_table WHERE id =$1';
  const id = req.params.bookID;
  let values = [id];
  client
    .query(selectSQL, values)
    .then((data) => {
      res.render('pages/books/detail', { books: data.rows });
    })
    .catch(() => {
      errorPage(req, res, 'There is an error in viewing details');
    });
}

// Update book inside the data base

function updateBook(req, res) {
  let updateSQL =
    'UPDATE books_table SET author=$1,title=$2,isbn=$3,image_url=$4,descriptions=$5 WHERE id=$6';
  let { author, title, isbn, image_url, descriptions } = req.body;
  let safeValues = [
    author,
    title,
    isbn,
    image_url,
    descriptions,
    req.params.bookID,
  ];
  client.query(updateSQL, safeValues).then(() => {
    res.redirect(`/getBook/${req.params.bookID}`);
  });
}

// Delete book from the data base

function deleteBook(req, res) {
  let deleteSQL = 'DELETE FROM books_table WHERE id=$1';
  let safeValue = [req.params.bookID];
  client.query(deleteSQL, safeValue).then(() => {
    res.redirect('/books/show');
  });
}

// ******************* Constructors ***************

// Books Constructor

function Books(book) {
  this.author = book.volumeInfo.authors || `There is no authors`;
  this.title = book.volumeInfo.title;
  this.isbn = book.volumeInfo.industryIdentifiers
    ? book.volumeInfo.industryIdentifiers[0].identifier || 'There is no isbn'
    : 'There is no isbn in the API';
  this.image_url = book.volumeInfo.thumbnail
    ? book.volumeInfo.thumbnail
    : `https://i.imgur.com/J5LVHEL.jpg`;
  this.descriptions = book.volumeInfo.description
    ? book.volumeInfo.description.substring(0, 200).trim() ||
      `There is no description`
    : 'There is no description in the API';
}

// Error Function
function errorPage(req, res, massage = `Sorry,something went wrong`) {
  res.render('pages/error', { error: massage });
}

// Make Sure the Server is working
client.connect().then(() => {
  app.listen(PORT, () => {
    console.log(`Listining to ${PORT}`);
  });
});
