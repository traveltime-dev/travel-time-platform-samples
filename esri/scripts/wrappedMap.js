define(["esri/Map",
	 	"esri/views/MapView",
	 	"esri/geometry/Polyline",
	 	"esri/symbols/SimpleLineSymbol",
	 	"esri/geometry/Polygon",
	 	"esri/symbols/SimpleFillSymbol",
		"esri/geometry/Point",
		"esri/symbols/SimpleMarkerSymbol",
	 	"esri/Graphic",
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

			self.shapes = []
			self.removeShapes = function(){
				self.view.then(function() {
					self.shapes.forEach(function(f){
						self.view.graphics.remove(f);
					});
					self.shapes = []
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

			self.drawShape = function(response){
				var polygonSymbol = new SimpleFillSymbol({
					color: [227, 139, 79, 0.5],
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
		}
})