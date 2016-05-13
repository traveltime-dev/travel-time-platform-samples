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
		getRoutes: function(firstSource, secondSource, destination, time) {
			return request.post("http://api.traveltimeapp.com/v3/routes", {
					data: JSON.stringify(
						{
							target: {
								coords: destination,
								arrival_time: time,
								travel_time: 20 * 60 * 2,
								mode: "public_transport"
							},
							points: {
								p1: firstSource,
								p2: secondSource
							},
							app_id: keys.apiId,
							app_key: keys.apiKey
						}),
					handleAs: "json"
				}).then(function(response){
					return [response.p1.parts, response.p2.parts];
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
								travel_time: 25*60,
								mode: "public_transport"
							},
							shape2: {
								coords: second,
								start_time: new Date(),
								travel_time: 25*60,
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
		timeFilter: function(first, second, locations){
			var pointMap = locations.reduce(function(o, item, index){
				o[index] = [item.latitude, item.longitude];
				return o;
			}, {});
			var startTime = new Date();
			return request.post("http://api.traveltimeapp.com/v3/time_filter", {
					data: JSON.stringify({
						points: pointMap,
						sources: {
							source1: {
								coords: first,
								start_time: startTime,
								travel_time: 20*60,
								mode: "public_transport",
								properties: ["time"]
							},
							source2: {
								coords: second,
								start_time: startTime,
								travel_time: 20*60,
								mode: "public_transport",
								properties: ["time"]
							}
						},
						destinations: {},
						app_id: keys.apiId,
						app_key: keys.apiKey
					}),
					handleAs: "json"
				}).then(function(response){
					if("points" in response.sources.source1 && "points" in response.sources.source2) {
						var reachableByFirst = response.sources.source1.points;
						var reachableBySecond = response.sources.source2.points;

						var intersection = locations.reduce(function(intersection, item, index){
							if(index in reachableByFirst && index in reachableBySecond) {
								intersection.push({
									location: item,
									firstDuration: reachableByFirst[index].time,
									secondDuration: reachableBySecond[index].time,
									firstLocation: first,
									secondLocation: second,
									leaveTime: startTime
								});
							}
							return intersection;
						}, []);
						return intersection;
					}
				});
		},
		swapCoords: function(coords){
			return [coords[1], coords[0]];
		}
	}		
})