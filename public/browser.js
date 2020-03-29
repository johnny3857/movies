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

document.addEventListener('click', function (e) {
	// Delete movie button event handler
	if (e.target.classList.contains('delete-me')) {
		let movieTitle = e.target.closest('li').querySelector('.movie-title').innerHTML;
		if (confirm(movieTitle + '\n\nTényleg töröljük?')) {
			fetch('/delete', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: e.target.getAttribute('data-id') })
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
// Search field event handler
document.querySelector('.input-search').addEventListener('keyup', function(e) {
	if (e.target.value.length > 2 && e.target.value.toLowerCase() !== searchObj.searchText) {
		searchObj.searching = true;
		searchObj.searchText = e.target.value.toLowerCase();
		searchMovies();
	};
});
/*******************************************************/
// Fetch all movies from db and store in global allMoviesArr array
function init () {
	document.querySelector('.input-search').value = '';
	fetch('/list')
	.then((response) => {
		return response.json();
	})
	.then((data) => {
		// console.log(data);
		allMoviesArr = data;
		populateList();
	})
	.catch((error) => {
		alert('Valami hiba van. Később próbáld újra!\n\nError: ' + error);
	});
};

// Fill up the movies UL with LIs in HTML
function populateList () {
	// console.log(searchResultArr);
	let sortedMoviesArr = sortFilterMovies(searchObj.searching ? searchResultArr : allMoviesArr);
	let moviesList = sortedMoviesArr.map((movie) => {
		let listItem =`
		<li>
			<div class="listitem-text">
				<p><span class="movie-title">${movie.title}</span> (${movie.year})<span class="movie-status">${movie.status}</span></p>
				<p>${movie.titleEng}</p>
			</div>
			<div class="listitem-buttons">
				<a class="edit-me" href="/edit?id=${movie._id}">módosít</a>
				<a data-id="${movie._id}" class="delete-me">töröl</a>
			</div>
		</li>`;
		return listItem;
	}).join('');
	// console.log(moviesList);
	document.querySelector('.list-movies').innerHTML = moviesList;
	// Extra: update number of results
	document.querySelector('.nr-of-results').innerHTML = sortedMoviesArr.length.toString();
	replaceStatus();
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


init();


