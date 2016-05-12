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
		
			self.view.on("click", function(evt) {
			    var closest = self.meetupLocations.reduce(function(a, b) {
			    	console.log(evt.mapPoint.distance(a), evt.mapPoint.distance(b))
			    	if(evt.mapPoint.distance(a) < evt.mapPoint.distance(b)) {
			    		return a;
			    	} else {
			    		return b;
			    	}
			    }, NaN);
			    if(closest) {
				    evt.mapPoint.latitude = closest.latitude;
				    evt.mapPoint.longitude = closest.longitude; 
				    self.view.popup.open({
				        title: "Lets meet here",
				        location: evt.mapPoint.clone() // Set the location of the popup to the clicked location
				    });
				}
			}); 

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

			self.points = [];
			self.drawPerson = function(location){
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
				self.points.push(graphic);
			}

			self.removePersons = function(){
				self.view.then(function(){
					self.points.forEach(function(f){
						self.view.graphics.remove(f);
					});
				
					self.points = [];
				});
			}

			self.shapes = []
			self.removeShapes = function(){
				self.view.then(function() {
					self.shapes.forEach(function(f){
						self.view.graphics.remove(f);
					});
					self.shapes = []
				});
			}

			self.drawShape = function(response, color){
				color = typeof color !== 'undefined' ? color : [227, 139, 79, 0.5];
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
				self.shapes = self.shapes.concat(shapes);
			}

			self.meetupLocations = []
			self.drawMeetupLocation = function(location){
				var onTheMap = self.meetupLocations.find(function(c){
				 return c[0] == location[0] && c[1] == location[1];
				});
				if(!onTheMap) {
					var markerSymbol = new SimpleMarkerSymbol({
						color: [50, 144, 128],
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

					self.meetupLocations.push(point);

					
				}
			}
		}
})