fetcher.scrappers.t4p_tv = function(genre, keywords, page, callback){



		if(genre=='all')
			genre = !1;


		var url = 'http://api.stream.nontonfilm21.com/shows/'+ui.home.catalog.page+'?cb='+Math.random()+'&sort=seeds';

        if (keywords) {
            url += '&keywords=' + keywords;
        }

        if (genre) {
            url += '&genre=' + genre;
        }

        if (page && page.toString().match(/\d+/)) {
           url += '&page=' + page;
        }

		$.ajax({
			url: url,
			dataType:'json',
			error:function(){callback(false)},
			success:function(data){

				var movies = [],
					memory = {};

				if (data.error || typeof data === 'undefined') {
					callback(false)
					return;
				}

				data.forEach(function (movie){
					// No imdb, no movie.

					if( typeof movie.imdb_id != 'string' || movie.imdb_id.replace('tt', '') == '' ){ return;}

			try{

					// Temporary object
					var movieModel = {
						imdb:       movie.imdb_id,
						title:      movie.title,
						year:       movie.year ? movie.year : '&nbsp;',
						runtime:    "",
						synopsis:   movie.overview,
						voteAverage:parseFloat(movie.rating),

						image:      movie.images.lowres,
						bigImage:   movie.images.lowres,
						backdrop:   movie.images.fanart,
						videos:     {},
						seeders:    0,
						leechers:   0,
						trailer:	movie.trailer ? 'http://www.youtube.com/embed/' + movie.trailer + '?autoplay=1': false,
						stars:		utils.movie.rateToStars(parseFloat(movie.rating)),
						
						hasMetadata:false,
						hasSubtitle:false
					};



					var stored = memory[movie.imdb];

					// Create it on memory map if it doesn't exist.
					if (typeof stored === 'undefined') {
						stored = memory[movie.imdb] = movieModel;
					}

					// Push it if not currently on array.
					if (movies.indexOf(stored) === -1) {
						movies.push(stored);
					}
			}catch(e){ console.log(e.message);}

				});

				callback(movies)
			},
		});

}
