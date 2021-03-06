/***************************************************/
/***********        TMDB features        ***********/
const tmdbImgBaseUrl = 'http://image.tmdb.org/t/p/';


/*********************************************************/
// Fetch movie and credits info from my server & display them
function getMovieInfo(tmdbid, searchFlag) {
	// Display popup wrapper and spinner
	document.querySelector('.tmdb-popup').style.display = 'none';
	if (searchFlag) document.querySelector('.search-popup').style.display = 'none';
	document.querySelector('.tmdb-spinner').style.display = 'block';
	document.querySelector('.tmdb-wrapper').style.display = 'block';
	// Hide pagination arrows and tab on main movie list page
	if (!searchFlag) document.querySelector('.pages-wrapper').style.display = 'none';

	// Send GET request to my server to fetch movie info from TMDB
	fetch(`/getmoviedata?tmdbid=${tmdbid}`)
	.then(response => response.json())
	.then(movieData => {
		// Alert popup if there was an error querying the TMDB server
		if (movieData.error === true) {
			alert(`Error querying TMDB server\n\n${movieData.errorText}`);
			closeTmdbPopup(searchFlag);
			return;
		};
		// Display and populate TMDB popup with movie data
		document.querySelector('.tmdb-spinner').style.display = 'none';
		document.querySelector('.tmdb-popup').style.display = 'block';

		document.querySelector('.tmdb-title').innerHTML = movieData.title;
		document.querySelector('.tmdb-year').innerHTML = `(${movieData.release_date})`;
		document.querySelector('.tmdb-rating').innerHTML = movieData.rating;
		document.querySelector('.tmdb-titleOrig').innerHTML = `${movieData.original_title}   (${movieData.prod_countries.join('-')})`;
		document.querySelector('.tmdb-runtime').innerHTML = `${movieData.runtime} perc - `;
		document.querySelector('.tmdb-genre').innerHTML = movieData.genres.join(', ');
		document.querySelector('.tmdb-plot-text').innerHTML = movieData.overview;
		document.querySelector('.tmdb-poster').src = movieData.poster_path;
		// Fill in director
		document.querySelector('.tmdb-director').innerHTML = `rendező: ${movieData.director.join(', ')}`;
		// Fill in actors
		document.querySelector('.tmdb-stars').innerHTML = `szereplők: ${movieData.actors.join(', ')}`;
		// Extra: set popup close click handler
		document.querySelector('.tmdb-popup').addEventListener('click', e => {
			closeTmdbPopup(searchFlag);
		});
		// console.log(movieData);
	})
	.catch((err) => {
		alert('Hohó, valami hiba történt!\n' + err);
		closeTmdbPopup(searchFlag);
	});
};

/************************************************************************************/
// Search for movies with TMDB API on Add Movie page
function searchTMDB (pageNr) {
	// Get movie title search string from input boxes if not empty
	const inputTitle = document.querySelector('.input-add-title');
	const inputTitleOrig = document.querySelector('.input-add-titleOrig');
	if (inputTitle.value == '' && inputTitleOrig.value == '') {
		return alert('Mit keressek?\nA szövegmezők üresek!\nFigyelj jobban!');
	};
	if (inputTitle.value.length < 3 && inputTitleOrig.value.length < 3) {
		return alert('A kereséshez legalább 3 karakter szükséges!');
	};
	// Read out movie search text (No URLencoding needed! Fetch() does it for you.)
	let searchText = (inputTitle.value.length > 2) ? inputTitle.value : inputTitleOrig.value;

	// Display wrapper and spinner
	document.querySelector('.tmdb-wrapper').style.display = 'block';
	document.querySelector('.search-popup').style.display = 'none';
	document.querySelector('.tmdb-popup').style.display = 'none';
	document.querySelector('.tmdb-spinner').style.display = 'block';
	
	//Send query to server
	fetch('/searchtmdb?searchtext=' + searchText + '&pagenr=' + pageNr)
	.then(response => response.json())
	.then(movieResults => {
		// Alert if error
		if (movieResults.error === true) {
			document.querySelector('.tmdb-wrapper').style.display = 'none';
			return alert(`Hiba a TMDB keresés közben.\n\n${movieResults.errorText}`);
		};
		if (movieResults.total_results == 0) {
			document.querySelector('.tmdb-wrapper').style.display = 'none';
			return alert('Sajnálom.\n\nNincs találat.');
		};

		// Hide spinner & display TMDB search popup
		document.querySelector('.tmdb-spinner').style.display = 'none';
		document.querySelector('.search-popup').style.display = 'block';
		// Populate search popup with results
		let resultTab = `<div class="search-tab">
							<div class="search-res-nr">találatok: ${movieResults.total_results}</div>
							<div class="search-res-pages" data-page="${movieResults.page}" data-totalpages="${movieResults.total_pages}">
								<div class="search-res-prev ${(movieResults.page == 1) ? 'hide' : ''}"><<</div>
								<div class="search-res-pageNr">oldal: ${movieResults.page} / ${movieResults.total_pages}</div>
								<div class="search-res-next ${(movieResults.page == movieResults.total_pages) ? 'hide' : ''}">>></div>
							</div>
							<div class="search-res-close">&times;</div>
						</div>`;

		let resultList = movieResults.results.map((movie) => {
			// Sanitize results (null, undefined)
			// if (movie.release_date === undefined || movie.release_date === null || movie.release_date === '') {
			if (!movie.release_date) {
				movie.release_date = '-';
				// console.log(`release_date is undefined or null: ' ${movie.title} (id: ${movie.id})`);
			};
			// Check for missing poster_path and replace with fallback image
			const posterSource = (movie.poster_path === null) ? 'no_poster-s.jpg' : `${tmdbImgBaseUrl}w92${movie.poster_path}`;

			let listItem =`
			<div class="search-li">
				<div class="search-text">
					<div class="search-ty"><span class="search-title">${movie.title}</span><span class="search-year">(${movie.release_date.slice(0, 4)})</span></div>
					<div class="search-titleOrig">${movie.original_title}</div>
					<div class="search-btns">
						<div class="search-btn-info" data-tmdbid="${movie.id}">info</div>
						<div class="search-btn-add">hozzáad</div>
					</div>
				</div>
				<div class="search-image"><img src="${posterSource}" alt="[-]"></div>
			</div>`;
			return listItem;
		}).join('');
		// console.log(resultList);
		document.querySelector('.search-popup').innerHTML = resultTab + resultList;
		
		// Register search popup click handlers after DOM has been generated
		// CLOSE button
		document.querySelector('.search-res-close').addEventListener('click', closeSearchPopup);
		// INFO button click handler (with search flag = TRUE)
		document.querySelectorAll('.search-btn-info').forEach(btn => btn.addEventListener('click', e => {
			getMovieInfo(e.target.getAttribute('data-tmdbid'), true);
		}));
		// ADD button
		document.querySelectorAll('.search-btn-add').forEach(btn => btn.addEventListener('click', fillAddForm));
		// PREV button
		document.querySelector('.search-res-prev').addEventListener('click', function (e) {
			if (this.classList.contains('hide')) return;
			const actPage = this.parentElement.getAttribute('data-page');
			searchTMDB(parseInt(actPage) - 1);
		});
		// NEXT button
		document.querySelector('.search-res-next').addEventListener('click', function (e) {
			if (this.classList.contains('hide')) return;
			const actPage = this.parentElement.getAttribute('data-page');
			searchTMDB(parseInt(actPage) + 1);
		});
	})
	.catch(err => {
		console.log(err);
		closeSearchPopup();
	})
};
/************************************************************************************/
// Close the TMDB movie info popup (& reset spinner)
function closeTmdbPopup(searchFlag) {
	document.querySelector('.tmdb-popup').style.display = 'none';
	if (!searchFlag) {
		document.querySelector('.tmdb-spinner').style.display = 'block';
		document.querySelector('.tmdb-wrapper').style.display = 'none';
		// Show pagination arrows and tab
		document.querySelector('.pages-wrapper').style.display = 'block';
	} else {
		document.querySelector('.search-popup').style.display = 'block';
	};
};

// Close the TMDB search results popup
function closeSearchPopup(e) {
	document.querySelector('.search-popup').style.display = 'none';
	document.querySelector('.tmdb-spinner').style.display = 'block';
	document.querySelector('.tmdb-wrapper').style.display = 'none';
}
// Fill in Add New Movie form with data from search result list
function fillAddForm (e) {
	const containerElem = e.target.parentElement.parentElement;
	const movieTitle = containerElem.querySelector('.search-title').textContent;
	const movieTitleOrig = containerElem.querySelector('.search-titleOrig').textContent;
	const movieYear = containerElem.querySelector('.search-year').textContent.slice(1, 5);
	const movieTmdbId = containerElem.querySelector('.search-btn-info').getAttribute('data-tmdbid');

	closeSearchPopup();

	document.querySelector('.input-add-title').value = movieTitle;
	document.querySelector('.input-add-titleOrig').value = movieTitleOrig;
	document.querySelector('.input-add-year').value = movieYear;
	document.querySelector('.input-add-tmdbid').value = movieTmdbId;
	return;
};

