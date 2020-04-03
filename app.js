const path = require('path');
const request = require('request');
const axios = require('axios');
const bodyParser = require('body-parser');
const mongodb = require('mongodb');
const myData = require('./config.js');

const express = require('express');
const app = express();
let port = process.env.PORT;
if (port == null || port == '') {
	port = 3000;
};

// MongoDB database connection
let db;
let connectionString = `mongodb+srv://${myData.mongoUser}:${myData.mongoPwd}@cluster0-symjw.mongodb.net/moviesdb?retryWrites=true&w=majority`;
mongodb.connect(connectionString, {useNewUrlParser: true, useUnifiedTopology: true}, function (err, client) {
	if (err) {
		console.log('Hoppá, mongoDB hiba van!\nError: ' + err);
	};
	db = client.db()

	// starting HTTP server
	const server = app.listen(port, () => {
		console.log('Node server is running on port 3000...');
	});
});

// registering body-parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
// json parser middleware
app.use(express.json());

// setting static folder middleware
app.use(express.static(path.join(__dirname, 'public')));

// set the view engine to ejs
app.set('view engine', 'ejs');
app.set('views', 'views');

// authentication middleware
function auth (req, res, next) {
	res.set('WWW-Authenticate', 'Basic realm="My movie app"');
	// console.log(req.headers.authorization);
	if (req.headers.authorization == 'Basic OmNzaXBldA==') {
		next();
	} else {
		res.status(401).send('Sorry, ide be kell jelentkezni.');
	}
}

// use auth() for all routes
app.use(auth);
/***********************************************************/
/**********************   ROUTES   *************************/
// GET getmoviedata from TMDB route
app.get('/getmoviedata', (req, res) => {
	let movieData = {};
	const tmdbUrl = `${myData.tmdbBaseUrl}movie/${req.query.tmdbid}?api_key=${myData.tmdbAPIKey}&language=hu`;
	let creditsUrl = `${myData.tmdbBaseUrl}movie/${req.query.tmdbid}/credits?api_key=${myData.tmdbAPIKey}`;
	function getMovieInfo() {return axios.get(tmdbUrl)};
	function getCreditsInfo() {return axios.get(creditsUrl)};
	axios.all([getMovieInfo(), getCreditsInfo()])
	.then(axios.spread(function (movie, credits) {
		// console.log(response.data)
		// Sanitizing & extracting useful movie data
		movieData.title = movie.data.title || '(nincs cím)';
		movieData.original_title = movie.data.original_title || '(nincs cím)';
		movieData.release_date = movie.data.release_date.substr(0, 4) || '????';
		movieData.runtime = movie.data.runtime || '?';
		let genreArr = [];
		movie.data.genres.forEach(item => genreArr.push(item.name.toLowerCase()));
		movieData.genres = genreArr;
		movieData.overview = movie.data.overview;
		if (movie.data.poster_path === null || movie.data.poster_path === '' || movie.data.poster_path === undefined) {
			movieData.poster_path = 'no_poster-m.jpg';
		} else {
			movieData.poster_path = `${myData.tmdbImgBaseUrl}w154${movie.data.poster_path}`;
		};
		// Extracting useful credits data
		movieData.director = [];
		credits.data.crew.forEach(item => {
			if (item.job === 'Director') movieData.director.push(item.name);
		});
		
		movieData.actors = [];
		credits.data.cast.sort((a, b) => {
			return a.order - b.order;
		});

		movieData.actors = credits.data.cast.map(actor => actor.name).slice(0, 10);
		res.send(movieData);
	}))
	.catch(error => {
		if (error.response) {
			// console.log(error.response.data);
			// console.log(error.response.status);
			// console.log(error.response.statusText);
			error.response.data.error = true;
			error.response.data.errorText = error.response.data.status_message;
			return res.send(error.response.data);
		}
		// else if (error.request) console.log(error.request);
		// else console.log('Error!', error.message);
		// consol.log(error.config);
		res.send({ error: true, errorText: 'Unknown error while querying TMDB server.'} );
	});
});

// GET search TMDB route
app.get('/searchtmdb', (req, res) => {
	// console.log(req.query.searchtext);
	const searchText = encodeURIComponent(req.query.searchtext);
	const tmdbUrl = `${myData.tmdbBaseUrl}search/movie?api_key=${myData.tmdbAPIKey}&language=hu&query=${searchText}&page=${req.query.pagenr}&include_adult=false`;
	axios.get(tmdbUrl)
	.then(response => {
		res.send(response.data);
	})
	.catch(error => {
		if (error.response) {
			error.response.data.error = true;
			error.response.data.errorText = error.response.data.status_message;
			return res.send(error.response.data);
		}
		res.send({ error: true, errorText: 'Unknown error while querying TMDB server.'} );
	});
	
});

/*/ GET search TMDB route
app.get('/searchtmdb', (req, res) => {
	// console.log(req.query.searchtext);
	const searchText = encodeURIComponent(req.query.searchtext);
	const tmdbUrl = `${myData.tmdbBaseUrl}search/movie?api_key=${myData.tmdbAPIKey}&language=hu&query=${searchText}&page=${req.query.pagenr}&include_adult=false`;
	request({ url: tmdbUrl, json: true }, (err, response) => {
		if (err) return res.json({error: 'Error'});
		// console.log(response.body);
		res.json(response.body);
	});
	
});
//*/

// GET add new film route
app.get('/add', (req, res) => {
	res.render('add', {
		path: '/add',
		pageTitle: 'Új film hozzáadása',
		greeting: 'Írj be egy új filmet!'
	});
});

// POST add new film
app.post('/add', (req, res) => {
	db.collection('movies').insertOne({
			title: req.body.title,
			titleEng: req.body.titleEng,
			year: req.body.year,
			status: req.body.status,
			tmdbid: req.body.tmdbid
		}, function () {
			res.redirect('/');
	});
});

// POST delete film route
app.post('/delete', (req, res) => {
	// console.log(req.body.id);
	db.collection('movies').deleteOne({_id: new mongodb.ObjectId(req.body.id)}, function() {
		// console.log('successful delete');
		return res.redirect('/');
	});
});

// GET edit film route
app.get('/edit', (req, res) => {
	db.collection('movies').find({_id: new mongodb.ObjectId(req.query.id)}).toArray(function(err, data) {
		// console.log(data[0]);
		res.render('edit', {
			path: '/edit',
			pageTitle: 'Vackorfilm szerkesztése',
			greeting: 'Itt módosíthatod a filmet.',
			movie: data[0]
		});
	})
});

// POST edit film route
app.post('/edit', (req, res) => {
	// console.log(req.body);
	db.collection('movies').findOneAndReplace({_id: new mongodb.ObjectId(req.query.id)}, 
	{
		title: req.body.title,
		titleEng: req.body.titleEng,
		year: req.body.year,
		status: req.body.status,
		tmdbid: req.body.tmdbid
	}, function () {
		res.redirect('/');
	});
});


// GET list route
app.get('/list', (req, res) => {
	db.collection('movies').find().toArray(function (err, movies) {
		if (err) res.send('There was an error reading from the database: ' + err);
		// console.log(movies);
		res.json(movies);
	});
});

// GET home route
app.get('/', function (req, res) {
	db.collection('movies').find().toArray( function (err, movies) {
		if (err) res.send('There was an error reading from the database: ' + err);
		// console.log(movies);

		res.render('list', {
			path: '/',
			pageTitle: 'Vackorfilmek listája',
			movies: movies
		});
	});
});


