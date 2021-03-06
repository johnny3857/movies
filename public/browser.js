let sortAndFilter = {
	sort: '',
	filter: 'all'
};
let allMoviesArr, foundMoviesArr = [];
let searchText = '';
let maxMoviePerPage = 20;
const statusNames = {
	wanted: 'kell',
	downloaded: 'letöltve',
	seen: 'megnézve'
};
init();

// Click handlers attached to global document object
document.addEventListener('click', function (e) {
	// Delete movie button click handler
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

	// Sort & filter buttons click handlers
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
	// Reset search field button click handler
	if (e.target.classList.contains('btn-reset-search')) {
		document.querySelector('.input-search').value = '';
		searchText = '';
		foundMoviesArr = allMoviesArr;
		populateList();
	};
	// Movie list PREV button click handler
	if (e.target.classList.contains('btn-prev')) {
		populateList(e.target.getAttribute('data-page'));
	};
	// Movie list NEXT button click handler
	if (e.target.classList.contains('btn-next')) {
		populateList(e.target.getAttribute('data-page'));
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
		allMoviesArr = data;
		// Reverse order of allMoviesArr based on _id (=addition date)
		allMoviesArr.sort(function (a, b) {
			if (a._id.toLowerCase() < b._id.toLowerCase()) return 1;
			if (a._id.toLowerCase() > b._id.toLowerCase()) return -1;
			return 0;
		});
		foundMoviesArr = allMoviesArr;

		populateList();
		initAfterFetch();
	})
	.catch((error) => {
		alert('Valami hiba van. Később próbáld újra!\n\nError: ' + error);
	});

	// Search field keyup handler
	document.querySelector('.input-search').addEventListener('keyup', function(e) {
		if (e.target.value.length > 2 && e.target.value.toLowerCase() !== searchText) {
			searchText = e.target.value.toLowerCase();
			searchMovies();
		};
	});

	// Reset search field value
	document.querySelector('.input-search').value = searchText;
};

// Initialization that can only run after fetching movies list from server
function initAfterFetch() {
	// Movies listitem click handler assignment
	const listitemsArr = document.querySelectorAll('.listitem-text');
	listitemsArr.forEach(listitem => {
		listitem.removeEventListener('click', listitemClickHandler);
		listitem.addEventListener('click', listitemClickHandler);
	});
};
// Movie listitem click handler
function listitemClickHandler (e) {
	// Read out TMDB id from listitem data-tmdbid
	const tmdbid = this.getAttribute('data-tmdbid');
	// Alert if tmdbid is missing
	if (tmdbid == '') {
		alert('Ehhez a filmhez nincs megadva TMDB azonosító.');
		return;
	};
	// Otherwise fetch and display movie data from tmdb API
	const searchFlag = false;
	getMovieInfo(tmdbid, searchFlag);
};

/***************************************************************************/
/***************************************************************************/
// Fill up the movies UL with LIs in HTML
function populateList (pageNr = 1) {
	// Sorting & filtering
	let showMoviesArr = sortFilterMovies();
	// Pagination
	showMoviesArr = paginate(showMoviesArr, pageNr);

	let moviesList = showMoviesArr.map((movie) => {
		let listItem =`
		<li>
			<div class="listitem-text" data-tmdbid="${movie.tmdbid}">
				<p><span class="movie-title">${movie.title}</span> (${movie.year})<span class="movie-status">${statusNames[movie.status]}</span></p>
				<p>${movie.titleEng}</p>
			</div>
			<div class="listitem-buttons">
				<a class="edit-me" href="/edit?id=${movie._id}"><img class="btn-edit-me" src="edit-icon.gif" alt="edit button"></a>
				<a data-id="${movie._id}" class="delete-me"><img class="btn-delete-me" src="delete-icon.gif" alt="delete button"></a>
			</div>
		</li>`;
		return listItem;
	}).join('');

	document.querySelector('.list-movies').innerHTML = moviesList;

	// Listitem click handlers must be set each time after showing the list
	initAfterFetch();
};

// Filter & sort movies based on sortAndFilter global object
function sortFilterMovies () {
	let filteredMovies = foundMoviesArr;

	// Begin with filtering (if any)
	if (sortAndFilter.filter !== 'all') {
		filteredMovies = foundMoviesArr.filter(movie => movie.status === sortAndFilter.filter);
	};
	// Now comes the sorting
	if (sortAndFilter.sort === 'title') {
		filteredMovies.sort(function (a, b) {
			if (a.title.toLowerCase() < b.title.toLowerCase()) return -1;
			if (a.title.toLowerCase() > b.title.toLowerCase()) return 1;
			return 0;
		});
	};
	if (sortAndFilter.sort === 'titleEng') {
		filteredMovies.sort(function (a, b) {
			if (a.titleEng.toLowerCase() < b.titleEng.toLowerCase()) return -1;
			if (a.titleEng.toLowerCase() > b.titleEng.toLowerCase()) return 1;
			return 0;
		});
	};
	if (sortAndFilter.sort === 'year') {
		filteredMovies.sort((a, b) => a.year - b.year);
	};
	return filteredMovies;
};
// Paginating movie list
function paginate (moviesArr, pageNr) {
	// Handle PREV button
	let btnPrev = document.querySelector('.btn-prev');
	btnPrev.setAttribute('data-page', 1 * pageNr - 1);
	if (pageNr > 1) btnPrev.style.display = 'block';
	else btnPrev.style.display = 'none';

	// Handle NEXT button
	let btnNext = document.querySelector('.btn-next');
	let lastPage = Math.ceil(moviesArr.length / maxMoviePerPage);
	btnNext.setAttribute('data-page', 1 * pageNr + 1);
	if (pageNr < lastPage) btnNext.style.display = 'block';
	else btnNext.style.display = 'none';

	document.querySelector('.list-res-nr').innerHTML = `találatok: ${(1 * pageNr - 1) * maxMoviePerPage + 1}-${Math.min(1 * pageNr * maxMoviePerPage, moviesArr.length)} / ${moviesArr.length}`;
	document.querySelector('.list-res-pages').innerHTML = `oldal: ${1 * pageNr} / ${lastPage}`;
	if (moviesArr.length === 0) {
		document.querySelector('.list-res-nr').innerHTML = 'nincs találat';
		document.querySelector('.list-res-pages').innerHTML = 'oldal: -';
	};
	return moviesArr.slice((1 * pageNr - 1) * maxMoviePerPage, 1 * pageNr * maxMoviePerPage);
};


// Do the searching
function searchMovies () {
	foundMoviesArr = allMoviesArr.filter(movie => movie.title.toLowerCase().includes(searchText) || movie.titleEng.toLowerCase().includes(searchText));
	populateList();
};


