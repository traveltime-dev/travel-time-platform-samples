define(["jquery", "scripts/keys"], function($, keys){
	return {
		getPath: function(from, to, callback) {
			$.ajax({
				type: "POST",
				url: "http://api.traveltimeapp.com/v3/routes",
				data: JSON.stringify({
					target: {
						coords: from,
						travel_time: 12000,
						mode: "walking",
						"start_time": new Date()
					},
					points: {
						destination: to
				 	},
					app_id: keys.apiId,
					app_key: keys.apiKey
				}),
				success: function(response){
					callback(response.destination)
				},
				dataType: "json"				
			});
		},
		getShape: function(location, callback) {
			$.ajax({
				type: "POST",
				url: "http://api.traveltimeapp.com/v3/time_map",
				data: JSON.stringify({
					format: "hash",
					smooth: true,
					targets: {
						shape1: {
							coords: location,
							start_time: new Date(),
							travel_time: 20*60,
							mode: "public_transport"
						}
					},
						shapes: {
						shape1: {simplify: false, max_points: 0}
					},
					intersections: {},
					unions: {},
					app_id: keys.apiId,
					app_key: keys.apiKey
				}),
				success: function(response){
					callback(response.results.shape1.shape);
				},
				dataType: "json"				
			});	
		},
		swapCoords: function(coords){
			return [coords[1], coords[0]];
		}
	}		
})