define(["dojo/request", "scripts/keys"], function(request, keys){
	return {
		getPath: function(from, to) {
			return request.post("http://api.traveltimeapp.com/v3/routes", {
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
				handleAs: "json"
			}).then(function(response){
				return response.destination.parts
					.map(function(f){
						return f.coords;
					}).reduce(function(a, b){
						return a.concat(b);
					});
			});
		},

		getShape: function(first, second) {
			return request.post("http://api.traveltimeapp.com/v3/time_map", {
					data: JSON.stringify({
						format: "hash",
						smooth: true,
						targets: {
							shape1: {
								coords: first,
								start_time: new Date(),
								travel_time: 20*60,
								mode: "public_transport"
							},
							shape2: {
								coords: second,
								start_time: new Date(),
								travel_time: 20*60,
								mode: "public_transport"
							}
						},
							shapes: {
								shape1: {simplify: false, max_points: 0},
								shape2: {simplify: false, max_points: 0}
						},
						intersections: {
							intersection1: {
								simplify: false,
								max_points: 0,
								targets : ["shape1", "shape2"]
							}
						},
						unions: {},
						app_id: keys.apiId,
						app_key: keys.apiKey
					}),
					handleAs: "json"
				}).then(function(response){
					return {
						first: response.results.shape1.shape,
						second: response.results.shape2.shape,
						intersection: response.results.intersection1.shape
					}
				});
		},
		swapCoords: function(coords){
			return [coords[1], coords[0]];
		}
	}		
})