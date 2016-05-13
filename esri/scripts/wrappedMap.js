define(["esri/Map",
	 	"esri/views/MapView",
	 	"esri/geometry/Polyline",
	 	"esri/symbols/SimpleLineSymbol",
	 	"esri/geometry/Polygon",
	 	"esri/symbols/SimpleFillSymbol",
		"esri/geometry/Point",
		"esri/symbols/SimpleMarkerSymbol",
	 	"esri/Graphic",
	 	"esri/geometry/geometryEngine",
	 	"esri/widgets/Popup",
	 	"scripts/api"],
	function(Map,
			MapView,
			Polyline,
			SimpleLineSymbol,
			Polygon,
			SimpleFillSymbol,
			Point,
			SimpleMarkerSymbol,
			Graphic,
			geometryEngine,
			Popup,
			api){


		function distance(a, b){
			var lat = (a.latitude - b.latitude);
			var lon = (a.longitude - b.longitude);
			return Math.sqrt(lat * lat + lon * lon)
		}

		return function(startingPosition, div){
			var self = this;

			self.map = new Map({
				basemap: "gray"
			});

			self.view = new MapView({
				center: startingPosition,
				container: div,
				map: self.map,
				zoom: 12
			});

			function asMinutes(seconds) {
				return Math.round(seconds / 60);
			}
			
			self.view.on("click", function(evt) {
				var closest = self.meetupLocations.reduce(function(a, b) {
					if(distance(evt.mapPoint, a.location) < distance(evt.mapPoint, b.location)) {
						return a;
					} else {
						return b;
					}
				});

				if(closest && 0.0016 > distance(evt.mapPoint, closest.location)) {
					evt.mapPoint.latitude = closest.location.latitude;
					evt.mapPoint.longitude = closest.location.longitude; 
					self.view.popup.open({
						title: "Lets meet at " + closest.location.name,
						content: "It only " + asMinutes(closest.firstDuration) + "  minutes from me and " + asMinutes(closest.secondDuration) + "  minutes from you",	
						location: evt.mapPoint.clone(),
						actions: [{
							id: "get-route",
							title: "Route us here",
							visible: true
						}],
					});
					self.selectedMarker = closest;
				}
			}); 


			self.view.popup.on("trigger-action", function(event){
				self.view.popup.close();
				var longestTrip = Math.max(self.selectedMarker.firstDuration,
					self.selectedMarker.secondDuration);

				var arivalDate = new Date(self.selectedMarker.leaveTime.getTime() + longestTrip);

				api.getRoutes(
					self.selectedMarker.firstLocation,
					self.selectedMarker.secondLocation,
					[self.selectedMarker.location.latitude, self.selectedMarker.location.longitude],
					arivalDate
				).then(self.drawDirections);

				
			});

			self.removeDirections = function(){
				self.view.then(function(){
					self.directions.forEach(function(f){
						self.view.graphics.remove(f);
					});
				
					self.directions = [];
				});
			}

			self.directions = [];
			self.drawDirections = function(routes){
				self.removePersons("directionStartingPoint");
				self.removeDirections();

				self.drawPerson(routes[0][0].coords[0], "directionStartingPoint");
				self.drawPerson(routes[1][0].coords[0], "directionStartingPoint");

				var route = routes[1].concat(routes[0]);

				var lineSymbol = new SimpleLineSymbol({
					color: [226, 119, 40],
					width: 3
				});


				var graphics = new Graphic({
					geometry: new Polyline({
						paths: route.map(function(f){
							return f.coords.map(api.swapCoords);
						})
					}),
					symbol: lineSymbol
				});

				self.view.then(function(){
					self.view.graphics.add(graphics);
				});

				self.directions.push(graphics);
			}


			self.drawPath = function(path){
				var lineSymbol = new SimpleLineSymbol({
					color: [226, 119, 40],
					width: 1
				});


				var graphics = new Graphic({
					geometry: new Polyline({
						paths: path.map(api.swapCoords)
					}),
					symbol: lineSymbol
				});

				self.view.then(function(){
					self.view.graphics.add(graphics);
				});
			}

			self.points = {};
			self.drawPerson = function(location, group){
				group = typeof group !== 'undefined' ? group : "default";
				var markerSymbol = new SimpleMarkerSymbol({
					color: [226, 119, 40],
					outline: { 
						color: [255, 255, 255],
						width: 2
					}
				});

				var point = new Point(api.swapCoords(location));
			 	var graphic = new Graphic({
					geometry: point,
					symbol: markerSymbol
				});	

				self.view.then(function(){
					self.view.graphics.add(graphic);
				});
				if(!(group in self.points)) {
					self.points[group] = [];
				}
				self.points[group].push(graphic);
			}

			self.removePersons = function(group){
				group = typeof group !== 'undefined' ? group : "default";
				self.view.then(function(){
					if(group in self.points) {
						self.points[group].forEach(function(f){
							self.view.graphics.remove(f);
						});
					}
					self.points[group] = [];
				});
			}

			self.shapes = {}
			self.removeShapes = function(layer){
				layer = typeof layer !== 'undefined' ? layer : "basicShape";
				if(layer in self.shapes) {
					self.view.then(function() {					
						self.shapes[layer].forEach(function(f){
							self.view.graphics.remove(f);
						});
						self.shapes[layer] = []
					});
				}
			}

			self.drawShape = function(response, color, layer){
				color = typeof color !== 'undefined' ? color : [227, 139, 79, 0.5];
				layer = typeof layer !== 'undefined' ? layer : "basicShape";
				var polygonSymbol = new SimpleFillSymbol({
					color: color,
					outline: {
						color: [255, 255, 255],
						width: 1
					}
				});

				var shapes = response.map(function(shape){
					var rings = shape.shell.map(api.swapCoords);
					var polygon =	new Polygon({rings: rings});

					return new Graphic({
						geometry: polygon,
						symbol: polygonSymbol
					});	
				});

				self.view.then(function(){
					self.view.graphics.addMany(shapes);
				})

				if(layer in self.shapes) {
					self.shapes[layer] = self.shapes[layer].concat(shapes);
				} else {
					self.shapes[layer] = shapes;
				}
			}

			self.meetupLocations = []

			self.drawMeetupLocation = function(caffee){			
				var onTheMap = self.meetupLocations.find(function(c){
				 	return c.location.latitude == caffee.location.latitude && c.location.longitude == caffee.location.longitude;
				});

				if(!onTheMap) {
					var markerSymbol = new SimpleMarkerSymbol({
						color: [50, 144, 128],
						outline: { 
							color: [255, 255, 255],
							width: 2
						}
					});

					var point = new Point(caffee.location);
				 	var graphic = new Graphic({
						geometry: point,
						symbol: markerSymbol
					});

					self.view.then(function(){
						self.view.graphics.add(graphic);
					});

					self.meetupLocations.push(caffee);
				}
			}
		}
})