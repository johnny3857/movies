/***************************************************/
/***********        TMDB features        ***********/

// Close the TMDB movie info popup (& reset spinner)
function closeTmdbPopup() {
	document.querySelector('.tmdb-popup').style.display = 'none';
	document.querySelector('.tmdb-spinner').style.display = 'block';
	document.querySelector('.tmdb-wrapper').style.display = 'none';
};

// Fetch and display movie info
function getMovieInfo(tmdbid) {
	// Display popup wrapper and spinner
	document.querySelector('.tmdb-popup').style.display = 'none';
	document.querySelector('.tmdb-spinner').style.display = 'block';
	document.querySelector('.tmdb-wrapper').style.display = 'block';
	// Fetch movie info from TMDB API
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
			// Fill in director
			document.querySelector('.tmdb-director').innerHTML = `rendező: ${director.join(', ')}`;
			// Get actors array, sort and truncate to 10
			creditsInfo.cast.sort((a, b) => {
				return a.order - b.order;
			});
			let actors = creditsInfo.cast.map(actor => actor.name).slice(0, 10);
			// Fill in actors
			document.querySelector('.tmdb-stars').innerHTML = `szereplők: ${actors.join(', ')}`;
			// Extra: set popup close click handler
			document.querySelector('.tmdb-popup').addEventListener('click', closeTmdbPopup);
		})
		.catch((err) => {
			alert('Hohó, valami hiba történt!\n' + err);
			closeTmdbPopup();
		});
};
/************************************************************************************/
// Search for movies with TMDB API on Add Movie page
function searchTMDB () {
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
	document.querySelector('.search-wrapper').style.display = 'block';
	document.querySelector('.search-popup').style.display = 'none';
	document.querySelector('.search-spinner').style.display = 'block';
	
	//Send query to server
	fetch('/searchtmdb?searchtext=' + searchText)
	.then(response => response.json())
	.then(movieResults => {
		// console.log(movieResults);
		if (movieResults.error) return alert('Hiba a TMDB keresés közben.');
		// Hide spinner & display TMDB search popup
		document.querySelector('.search-spinner').style.display = 'none';
		document.querySelector('.search-popup').style.display = 'block';
		// Populate search popup with results
		let resultTab = `<div class="search-tab">
							<div class="search-res-nr">találatok: ${movieResults.total_results}</div>
							<div class="search-res-pages">
								<div class="search-res-prev"><<</div>
								<div class="search-res-pageNr">oldal: ${movieResults.page} / ${movieResults.total_pages}</div>
								<div class="search-res-next">>></div>
							</div>
							<div class="search-res-close">&times;</div>
						</div>`;

		let resultList = movieResults.results.map((movie) => {
			let listItem =`
			<div class="search-li">
				<div class="search-text">
					<div class="search-ty"><span class="search-title">${movie.title}</span><span class="search-year">(${movie.release_date.slice(0, 4)})</span></div>
					<div class="search-titleOrig">${movie.original_title}</div>
					<div class="search-btns">
						<div class="search-btn-info">info</div>
						<div class="search-btn-add">hozzáad</div>
					</div>
				</div>
				<div class="search-image"><img src="http://image.tmdb.org/t/p/w92${movie.poster_path}" alt="<->"></div>
			</div>`;
			return listItem;
		}).join('');
		// console.log(resultList);
		document.querySelector('.search-popup').innerHTML = resultTab + resultList;
		
		// Register search popup click handlers after DOM has been generated
		document.querySelector('.search-res-close').addEventListener('click', closeSearchPopup);

	})
	.catch(err => {
		console.log(err);
		closeSearchPopup();
	})
};

function closeSearchPopup(e) {
	document.querySelector('.search-popup').style.display = 'none';
	document.querySelector('.search-spinner').style.display = 'block';
	document.querySelector('.search-wrapper').style.display = 'none';
}


