define(["scripts/keys",
	 	"scripts/api",
	 	"scripts/wrappedMap",
	 	"esri/geometry/Polygon",
	 	"esri/geometry/Point",
	 	"esri/geometry/geometryEngine",
	 	"dojo/promise/all",
	 	"scripts/caffeList",
	 	"jquery",
	 	"dojo/domReady!"],
	function(keys,
			api,
			WrappedMap,
			Polygon,
			Point,
			geometryEngine,
			all,
			caffeList,
			$
			) {

		if(keys.apiId == ""){
			console.error("Please update api key");
		}

		var map = new WrappedMap([-0.089, 51.5], "viewDiv");

		var batman = [[51.50903776845088, -0.164832763671875], [51.51053285458183, -0.0487518310546875]];

		var superman = [[51.46898018751687, -0.1682281494140625], [51.48533822311959, 0.00274658203125]];

		all([
			api.getPath(batman[0], batman[1]),
			api.getPath(superman[0], superman[1]),
		]).then(function(results){
			var batmanPath = results[0];
			var supermanPath = results[1];

			map.drawPath(batmanPath);
			map.drawPath(supermanPath);
			var steps = 12;
			var batmanStep = batmanPath.length / steps;
			var supermanStep = supermanPath.length / steps;
			var i = 0;
			var direction = 0;

			$("#reverse").click(function(){
				direction = -1;
			});
			$("#pause").click(function(){
				direction = 0;
			});
			$("#forward").click(function(){
				direction = 1;
			});
			var shouldRestart = false;
			$("#restart").click(function(){
				shouldRestart = true;
			});

			window.setInterval(function(){
				i = i + direction;
				if(i > steps || i < 0) {
					i = i - direction;
					return;
				}
				var nextBatmanPosition = batmanPath[Math.min(batmanPath.length - 1, Math.round(batmanStep * i))];
				var nextSupermanPosition = supermanPath[Math.min(supermanPath.length - 1, Math.round(supermanStep * i))];
				all([api.getShape(nextBatmanPosition, nextSupermanPosition),
					api.timeFilter(nextBatmanPosition, nextSupermanPosition, caffeList)])
				.then(function(results){
					var shapeResult = results[0];
					map.removeShapes();
					map.drawShape(shapeResult.first);
					map.drawShape(shapeResult.second);

					map.drawShape(shapeResult.intersection, [50, 144, 128, 0.5], "intersection");

					map.removePersons();
					map.drawPerson(nextBatmanPosition);
					map.drawPerson(nextSupermanPosition);

					var meetingLocations = shapeResult.intersection.map(function(shape){
						var rings = shape.shell.map(api.swapCoords);
						if(rings.length > 0)
							return new Polygon({rings: rings});
						else
							return null;
					});

					var filterResults = results[1];
					filterResults.forEach(function(f){
						var location = meetingLocations.find(function(region) {
							if(region){
								return geometryEngine.within(new Point(f.location), region);
							} else {
								return false;
							}
						});

						if(location) {
							map.drawMeetupLocation(f);
						}
					});

					if(shouldRestart) {
						i = 0;
						direction = 0;
						map.restart();
						shouldRestart = false;
					}
				})
			}, 12 * 1000 / steps);
		});

	}
);