// Click handlers attached to global document object
init();

// Assign event handlers on Add Movie page
function init() {
	// TMDB search button click handler
	document.querySelector('.btn-tmdb-search').addEventListener('click', e => {
		const pageNr = 1;
		searchTMDB(pageNr);
	});

};
