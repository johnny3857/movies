const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');

const express = require('express');
const app = express();

// registering body-parser middleware
app.use(bodyParser.urlencoded({ extended: false }));

// setting static folder middleware
app.use(express.static(path.join(__dirname, 'public')));

// set the view engine to ejs
app.set('view engine', 'ejs');
app.set('views', 'views');

/***************   ROUTES   *****************/

// GET add new film route
app.get('/add', (req, res) => {
    res.render('add', {
        path: '/add',
        pageTitle: 'Add new film',
        greeting: 'Chipper, add a new movie.'
    })
});

// POST add new film
app.post('/add', (req, res) => {

    fs.readFile('movies.json', (err, data) => {
        let movies = [];
        if (err) return res.render('error', {
            path: '/error',
            pageTitle: 'Error page',
            greeting: 'Szia Csipet, baj van! Error reading file.',
            error: err.stack
        });
        movies = JSON.parse(data);
        const newMovie = {
            title: req.body.title,
            titleEng: req.body.titleEng,
            year: req.body.year,
            status: req.body.status
        };
        movies.push(newMovie);
        moviesJson = JSON.stringify(movies);

        fs.writeFile('movies.json', moviesJson, err => {
            if (err) return res.render('error', {
                path: '/error',
                pageTitle: 'Error page',
                greeting: 'Szia Csipet, baj van! Error writing file.',
                error: err.stack
            })
            console.log('OK writing file!');
            res.redirect('/');
        });

    });


});

// GET list route
app.get('/list', (req, res) => {
    res.render('list', {
        path: '/list',
        pageTitle: 'Movie list',
        greeting: 'Itt lehet listázni a filmeket'
    })
})

// GET search route
app.get('/search', (req, res) => {
    res.render('search', {
        path: '/search',
        pageTitle: 'Search movies',
        greeting: 'Itt kereshetsz a filmek között, Csipet'
    })
})

// GET about route
app.get('/about', (req, res) => {
    res.render('about', {
        path: '/about',
        pageTitle: 'Movie Database',
        greeting: 'Chipper & Mukker\'s personal movie database'
    })
});

// home route
app.get('/', (req, res) => {
    fs.readFile('movies.json', (err, data) => {
        let movies = [];
        if (err) return res.render('error', {
            path: '/error',
            pageTitle: 'Error page',
            greeting: 'Szia Csipet, baj van!',
            error: err.stack
        });

        movies = JSON.parse(data);

        //console.log(req.query.sort);
        const sortOrder = req.query.sort;
        if (sortOrder) {
            movies.sort((a, b) => {
                let x = a[sortOrder].toLowerCase();
                let y = b[sortOrder].toLowerCase();
                if (x < y) return -1;
                if (x > y) return 1;
                return 0;
            });
        }
        
        movies.forEach(elem => {
            console.log(elem.title)
        });

        res.render('list', {
            path: '/',
            pageTitle: 'Home',
            greeting: 'Hi Chipper!',
            sortOrder: sortOrder,
            movies: movies
        });
    })
});


/******************************************* */
// starting HTTP server
const server = app.listen(3000, () => {
    console.log('Node server is running on port 3000...');
});
