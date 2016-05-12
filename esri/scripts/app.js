define(["scripts/keys",
	 	"scripts/api",
	 	"scripts/wrappedMap",
	 	"esri/geometry/Polygon",
	 	"esri/geometry/Point",
	 	"esri/geometry/geometryEngine",
	 	"dojo/promise/all",
	 	"scripts/caffeList",
	 	"dojo/domReady!"],
	function(keys,
			api,
			WrappedMap,
			Polygon,
			Point,
			geometryEngine,
			all,
			caffeList
			) {

		if(keys.apiId == ""){
			console.error("Please update api key");
		}

		var map = new WrappedMap([-0.089, 51.5], "viewDiv");

		var batman = [[51.52053285458183, -0.0487518310546875],
			[51.52903776845088, -0.234832763671875]];

		var superman = [[51.46898018751687, -0.1682281494140625], [51.48533822311959, 0.00274658203125]];

		all([
			api.getPath(batman[0], batman[1]),
			api.getPath(superman[0], superman[1]),
		]).then(function(results){
			var batmanPath = results[0];
			var supermanPath = results[1];

			map.drawPath(batmanPath);
			map.drawPath(supermanPath);
			var steps = 20;
			var batmanStep = batmanPath.length / steps;
			var supermanStep = supermanPath.length / steps;
			var i = 1;	
			var direction = -1;
			
			window.setInterval(function(){
				i = i + direction;
				if(i == 0 || i == steps) {
					direction = - direction;
				}
				var nextBatmanPosition = batmanPath[Math.min(batmanPath.length - 1, Math.round(batmanStep * i))];
				var nextSupermanPosition = supermanPath[Math.min(supermanPath.length - 1, Math.round(supermanStep * i))];
				
				api
				.getShape(nextBatmanPosition, nextSupermanPosition)
				.then(function(results){
					map.removeShapes();
					map.drawShape(results.first);
					map.drawShape(results.second);

					map.drawShape(results.intersection, [50, 144, 128, 0.5]);

					map.removePersons();
					map.drawPerson(nextBatmanPosition);
					map.drawPerson(nextSupermanPosition);


					var meetingLocations = results.intersection.map(function(shape){
						var rings = shape.shell.map(api.swapCoords);
						if(rings.length > 0)
							return new Polygon({rings: rings});
						else 
							return null;
					});

					caffeList.forEach(function(f){
						var location = meetingLocations.find(function(region) {
							if(region){
								return geometryEngine.within(new Point(f), region);
							} else {
								return false;
							}
						});

						if(location) {						
							map.drawPerson([f.latitude, f.longitude]);
						}
					});
				})
			}, 20 * 1000 / steps);
		});

	}
);