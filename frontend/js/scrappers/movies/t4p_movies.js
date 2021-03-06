fetcher.scrappers.t4p_movies = function(genre, keywords, page, callback){

		if(genre=='all')
			genre = !1;


		var url = 'http://api.torrentsapi.com/list?sort=seeds&format=mp4&cb='+Math.random()+'&quality=720p,1080p,3d&page=' + ui.home.catalog.page;

        if (keywords) {
            url += '&keywords=' + keywords;
        }

        if (genre) {
            url += '&genre=' + genre;
        }

        if (page && page.toString().match(/\d+/)) {
           url += '&set=' + page;
        }

		$.ajax({
			url: url,
			dataType:'json',
			error:function(){callback(false)},
			success:function(data){

				var movies = [],
					memory = {};

				if (data.error || typeof data.MovieList === 'undefined') {
					callback(false)
					return;
				}

				data.MovieList.forEach(function (movie){
					// No imdb, no movie.
					if( typeof movie.imdb != 'string' || movie.imdb.replace('tt', '') == '' ){ return;}

			try{
					var torrents = {};

					// Keep only yify releases
					for(var i=movie.items.length-1; i>=0; i--) {
						var torrent = movie.items[i];
						var file = torrent.file;
						if(file.toLowerCase().indexOf('yify') === -1 || file.indexOf('1080p.3D') !== -1) {
							movie.items.splice(i, 1);
						}
					}

					movie.items.forEach(function(torrent){
						if(torrent.type===0 && !torrents[torrent.quality]){
							torrents[torrent.quality] = torrent.torrent_url
						}
					});

					// Temporary object
					var movieModel = {
						imdb:       movie.imdb,
						title:      movie.title,
						year:       movie.year ? movie.year : '&nbsp;',
						runtime:    movie.runtime,
						synopsis:   "",
						voteAverage:parseFloat(movie.rating),

						image:      movie.poster_med,
						bigImage:   movie.poster_big,
						backdrop:   "",

						quality:    movie.items[0].quality,
						torrent:    movie.items[0].torrent_url,
						torrents:   movie.items,
						videos:     {},
						seeders:    movie.torrent_seeds,
						leechers:   movie.torrent_peers,
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

					if (stored.quality !== movieModel.quality && movieModel.quality === '720p') {
						stored.torrent = movieModel.torrent;
						stored.quality = '720p';
					}

					// Set it's correspondent quality torrent URL.
					stored.torrents[movie.Quality] = movie.TorrentUrl;

					// Push it if not currently on array.
					if (movies.indexOf(stored) === -1) {
						movies.push(stored);
					}
			}catch(e){}

				});

				callback(movies)
			},
		});

}
