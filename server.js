'use strict';

// Librries
require('dotenv').config();
const express = require('express');
const app = express();
const superAgent = require('superagent');
const PORT = process.env.PORT || 3000;
app.set('view engine', 'ejs');

// Using the public folder and sunFiles
app.use(express.static('./public'));

// To Read the body of the POST HTTP requsets
app.use(express.urlencoded());

// Routs
app.get('/', getSearchHanlde);
app.post('/searches/show', postSearchHanlde);

// Functions

// newSearchHanlde

function getSearchHanlde(req, res) {
  res.render('pages/searches/new');
}

function postSearchHanlde(req, res) {
  const data = req.body;
  const titleORauthor = Object.keys(data)[1];
  const name = data.searchbox;
  const url = `https://www.googleapis.com/books/v1/volumes?q=${name}+in${titleORauthor}`;
  superAgent.get(url).then((results) => {
    let bookArray = results.body.items.map((book) => {
      return new Books(book);
    });
    res.render('pages/searches/show', { books: bookArray });
  });
}

// Books Constructor

function Books(book) {
  this.title = book.volumeInfo.title;
  this.image =
    book.volumeInfo.imageLinks.thumbnail || `https://i.imgur.com/J5LVHEL.jpg`;
  this.author = book.volumeInfo.authors || `There is no authors`;
  this.description = book.volumeInfo.description || `There is no description`;
}

// Make Sure the Server is working
app.listen(PORT, () => {
  console.log(`Listening in port ${PORT}`);
});
