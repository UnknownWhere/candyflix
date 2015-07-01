fetcher.scrappers.t4p_movies = function(genre, keywords, page, callback){

		// if(genre=='all')
		// 	genre = !1;

		var page = ui.home.catalog.page;
		//var url = 'http://api.torrentsapi.com/list?sort=seeds&format=mp4&cb='+Math.random()+'&quality=720p,1080p,3d&page=' + ui.home.catalog.page;
		var url = 'http://api.stream.nontonfilm21.com/list_movies.json?sort_by=seeds&limit=50&with_rt_ratings=true'
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

				if (data.error || typeof data.data.movies === 'undefined') {
					callback(false)
					return;
				}
				data.data.movies.forEach(function (movie){
					// No imdb, no movie.
					if( typeof movie.imdb_code != 'string' || movie.imdb_code.replace('tt', '') == '' ){ return;}

					try{
					var torrents = {};
					
					// Keep only yify releases
					// for(var i=movie.torrents.length-1; i>=0; i--) {
					// 	var torrent = movie.torrents[i];
					// 	var file = torrent.file;
					// 	if(file.toLowerCase().indexOf('yify') === -1 || file.indexOf('1080p.3D') !== -1) {
					// 		movie.torrents.splice(i, 1);
					// 	}
					// }

					movie.torrents.forEach(function(torrent){
						if(torrent.type===0 && !torrents[torrent.quality]){
							torrents[torrent.quality] = torrent.url
						}
					});

					// Temporary object
					var movieModel = {
						imdb:       movie.imdb_code,
						title:      movie.title_long,
						year:       movie.year ? movie.year : '&nbsp;',
						runtime:    movie.runtime,
						synopsis:   "",
						voteAverage:parseFloat(movie.rating),

						image:      movie.medium_cover_image,
						bigImage:   movie.medium_cover_image,
						backdrop:   movie.background_image,

						quality:    movie.torrents[0].quality,
						torrent:    movie.torrents[0].url,
						torrents:   movie.torrents,
						videos:     {},
						seeders:    movie.torrents[0].seeds,
						leechers:   movie.torrents[0].peers,
						trailer:"",
						//trailer:	movie.trailer ? 'http://www.youtube.com/embed/' + movie.trailer + '?autoplay=1': false,
						stars:		utils.movie.rateToStars(parseFloat(movie.rating)),

						hasMetadata:false,
						hasSubtitle:false
					};



					var stored = memory[movie.imdb_code];

					// Create it on memory map if it doesn't exist.
					if (typeof stored === 'undefined') {
						stored = memory[movie.imdb_code] = movieModel;
					}

					if (stored.quality !== movieModel.quality && movieModel.quality === '720p') {
						stored.torrent = movieModel.torrent;
						stored.quality = '720p';
					}

					// Set it's correspondent quality torrent URL.
					stored.torrents[movie.quality] = movie.torrents;
					console.log(stored);
					// Push it if not currently on array.
					if (movies.indexOf(stored) === -1) {
						movies.push(stored);
					}
					
			}catch(e){
				console.log(e);
			}
				});
				
				callback(movies)
			},
		});

}
