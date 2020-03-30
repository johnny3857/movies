let sortAndFilter = {
	sort: 'title',
	filter: 'all'
};
let allMoviesArr = [];
let searchObj = {
	searching: false,
	searchText: ''
};
let searchResultArr = [];
init();

document.addEventListener('click', function (e) {
	// Delete movie button event handler
	if (e.target.classList.contains('delete-me') || e.target.classList.contains('btn-delete-me')) {
		let movieTitle = e.target.closest('li').querySelector('.movie-title').innerHTML;
		if (confirm(movieTitle + '\n\nTényleg töröljük?')) {
			const anchorDelete = e.target.closest('div').querySelector('.delete-me');
			fetch('/delete', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: anchorDelete.getAttribute('data-id') })
			}).then((data) => {
				window.location.href = "/";
			}).catch((error) => {
				alert('Valami hiba van. Később próbáld újra!\n\nError: ' + error);
			});
		}
	}

	// Sort & filter buttons click event handler
	// Update sortAndFilter global object based on button click
	if (e.target.classList.contains('sort-button')) {
		if (e.target.classList.contains('active')) return;
		document.querySelectorAll('.sort-button').forEach((btn) => btn.classList.remove('active'));
		e.target.classList.add('active');
		sortAndFilter.sort = e.target.getAttribute('data-sort');
		populateList();
	};
	if (e.target.classList.contains('filter-button')) {
		if (e.target.classList.contains('active')) return;
		document.querySelectorAll('.filter-button').forEach((btn) => btn.classList.remove('active'));
		e.target.classList.add('active');
		sortAndFilter.filter = e.target.getAttribute('data-filter');
		populateList();
	};
	// Reset search field button event handler
	if (e.target.classList.contains('btn-reset-search')) {
		document.querySelector('.input-search').value = '';
		searchObj.searching = false;
		populateList();
	};
});

/*******************************************************/
// Fetch all movies from db and store in global allMoviesArr array
function init () {
	// Get movies list from server
	fetch('/list')
	.then((response) => {
		return response.json();
	})
	.then((data) => {
		// console.log(data);
		allMoviesArr = data;
		populateList();
		initAfterFetch();
	})
	.catch((error) => {
		alert('Valami hiba van. Később próbáld újra!\n\nError: ' + error);
	});
	// Search field event handler
	document.querySelector('.input-search').addEventListener('keyup', function(e) {
		if (e.target.value.length > 2 && e.target.value.toLowerCase() !== searchObj.searchText) {
			searchObj.searching = true;
			searchObj.searchText = e.target.value.toLowerCase();
			searchMovies();
		};
	});

	// Reset search field value
	document.querySelector('.input-search').value = '';
};
// Initialization that can only run after fetching movies from server
function initAfterFetch() {
	const listitemsArr = document.querySelectorAll('.listitem-text');
	listitemsArr.forEach(listitem => {
		listitem.removeEventListener('click', listitemClickHandler);
		listitem.addEventListener('click', listitemClickHandler);
	}); 
};
// Movie listitem event handler
function listitemClickHandler (e) {
	// Read out TMDB id from listitem data-tmdbid
	const tmdbid = this.getAttribute('data-tmdbid');
	// Alert if tmdbid is missing
	if (tmdbid == '') {
		alert('Ehhez a filmhez nincs megadva TMDB azonosító.');
		return;
	};
	// Otherwise fetch movie data from tmdb API
	getMovieInfo(tmdbid);
	// document.querySelector('.tmdb-wrapper').style.display = 'block';
	// Display fetched TMDB movie data in popup
};

/****************************************************************************/
// Fill up the movies UL with LIs in HTML
function populateList () {
	// console.log(searchResultArr);
	let sortedMoviesArr = sortFilterMovies(searchObj.searching ? searchResultArr : allMoviesArr);
	let moviesList = sortedMoviesArr.map((movie) => {
		let listItem =`
		<li>
			<div class="listitem-text" data-tmdbid="${movie.tmdbid}">
				<p><span class="movie-title">${movie.title}</span> (${movie.year})<span class="movie-status">${movie.status}</span></p>
				<p>${movie.titleEng}</p>
			</div>
			<div class="listitem-buttons">
				<a class="edit-me" href="/edit?id=${movie._id}"><img class="btn-edit-me" src="edit-icon.gif" alt="edit button"></a>
				<a data-id="${movie._id}" class="delete-me"><img class="btn-delete-me" src="delete-icon.gif" alt="delete button"></a>
			</div>
		</li>`;
		return listItem;
	}).join('');
	// console.log(moviesList);
	document.querySelector('.list-movies').innerHTML = moviesList;
	// Extra: update number of results
	document.querySelector('.nr-of-results').innerHTML = sortedMoviesArr.length.toString();
	replaceStatus();
	// Listitem click handlers must be set each time after populating the list
	initAfterFetch();
};

// Filter & sort movies based on sortAndFilter global object
function sortFilterMovies (moviesArr) {
	let filteredMovies = [];
	// Begin with filtering (if any)
	if (sortAndFilter.filter === 'all') {
		filteredMovies = moviesArr;
	} else {
		filteredMovies = moviesArr.filter(movie => movie.status === sortAndFilter.filter);
	};
	// Now comes the sorting
/* 	if (sortAndFilter.sort === 'none') {
		// console.log(sortAndFilter);
		return filteredMovies;
	}; */
	if (sortAndFilter.sort === 'title') {
		return filteredMovies.sort(function (a, b) {
			if (a.title.toLowerCase() < b.title.toLowerCase()) return -1;
			if (a.title.toLowerCase() > b.title.toLowerCase()) return 1;
			return 0;
		});
	};
	if (sortAndFilter.sort === 'titleEng') {
		return filteredMovies.sort(function (a, b) {
			if (a.titleEng.toLowerCase() < b.titleEng.toLowerCase()) return -1;
			if (a.titleEng.toLowerCase() > b.titleEng.toLowerCase()) return 1;
			return 0;
		});
	};
	if (sortAndFilter.sort === 'year') {
		return filteredMovies.sort((a, b) => a.year - b.year);
	};
	// console.log(sortAndFilter);
	// console.log(filteredMovies);
};

// Do the searching
function searchMovies () {
	searchResultArr = allMoviesArr.filter(movie => movie.title.toLowerCase().includes(searchObj.searchText) || movie.titleEng.toLowerCase().includes(searchObj.searchText));
	populateList();
};

// Replace English status words with Hungarian ones
function replaceStatus() {
	let statusArr = document.querySelectorAll('.movie-status');
	const statusNames = {
		wanted: 'kell',
		downloaded: 'letöltve',
		seen: 'megnézve'
	};
	statusArr.forEach((item) => {
		item.innerHTML = ' - ' + statusNames[item.innerHTML];
	});
};
/***************************************************/
/***********        TMDB features        ***********/

// Close the TMDB movie info popup
function closeTmdbPopup () {
	document.querySelector('.tmdb-popup').style.display = 'none';
	document.querySelector('.tmdb-spinner').style.display = 'block';
	document.querySelector('.tmdb-wrapper').style.display = 'none';
};

function getMovieInfo (tmdbid) {
	document.querySelector('.tmdb-popup').style.display = 'none';
	document.querySelector('.tmdb-spinner').style.display = 'block';
	document.querySelector('.tmdb-wrapper').style.display = 'block';

	let movieUrl = `https://api.themoviedb.org/3/movie/${tmdbid}?api_key=44e45b401447defd78533a2105a91b82&language=hu`;
	fetch(movieUrl)
	.then(response => response.json())
	.then(movieInfo => {
		// console.log(movieInfo);
		// Display and populate TMDB popup with movie data
		document.querySelector('.tmdb-spinner').style.display = 'none';
		document.querySelector('.tmdb-popup').style.display = 'block';

		document.querySelector('.tmdb-title').innerHTML = movieInfo.title;
		document.querySelector('.tmdb-year').innerHTML = `(${movieInfo.release_date.substr(0, 4)})`;
		document.querySelector('.tmdb-titleOrig').innerHTML = movieInfo.original_title;
		document.querySelector('.tmdb-runtime').innerHTML = `${movieInfo.runtime} perc - `;
		let genre = [];
		movieInfo.genres.forEach(item => genre.push(item.name));
		document.querySelector('.tmdb-genre').innerHTML = genre.join(', ').toLowerCase();
		document.querySelector('.tmdb-plot-text').innerHTML = movieInfo.overview;
		document.querySelector('.tmdb-poster').src = `http://image.tmdb.org/t/p/w154${movieInfo.poster_path}`;

		// Fetch credits info from TMDB
 		let creditsUrl = `https://api.themoviedb.org/3/movie/${tmdbid}/credits?api_key=44e45b401447defd78533a2105a91b82`;
		return fetch(creditsUrl)

	})
	// Populate TMDB popup with credits data
	.then(response => response.json())
	.then((creditsInfo) => {
		// Get director(s) array
		let director = [];
		creditsInfo.crew.forEach(item => {
			if (item.job === 'Director') director.push(item.name);
		});
		document.querySelector('.tmdb-director').innerHTML = `rendező: ${director.join(', ')}`;
		// Get actors array
		creditsInfo.cast.sort((a, b) => {
			return a.order - b.order;
		})
		let actors = creditsInfo.cast.map(actor => actor.name).slice(0, 10);
		document.querySelector('.tmdb-stars').innerHTML = `szereplők: ${actors.join(', ')}`;
	})
	.catch((err) => {
		alert('Hohó, valami hiba történt!\n' + err);
		closeTmdbPopup();
	});
 

};

