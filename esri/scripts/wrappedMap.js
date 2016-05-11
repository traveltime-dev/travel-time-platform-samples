define(["esri/Map",
	 	"esri/views/MapView",
	 	"esri/geometry/Polyline",
	 	"esri/symbols/SimpleLineSymbol",
	 	"esri/geometry/Polygon",
	 	"esri/symbols/SimpleFillSymbol",
	 	"esri/Graphic",
	 	"scripts/api"],
	function(Map,
			MapView,
			Polyline,
			SimpleLineSymbol,
			Polygon,
			SimpleFillSymbol,
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

			self.drawPath = function(response){
				var lineSymbol = new SimpleLineSymbol({
					color: [226, 119, 40],
					width: 1
				});

				var lines = response.parts.map(function(segment){
					path = segment.coords.map(api.swapCoords);

					return new Graphic({
						geometry: new Polyline({paths: path}),
						symbol: lineSymbol
					});
				});

				self.view.then(function(){
					self.view.graphics.addMany(lines);
				});
			}

			self.removeShapes = function(shapes){
				shapes.forEach(function(f){
					self.view.graphics.remove(f);
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
					var polygon =  new Polygon({rings: rings});

					return new Graphic({
						geometry: polygon,
						symbol: polygonSymbol
					});	
				});

				self.view.then(function(){
					self.view.graphics.addMany(shapes);
				})

				return shapes;
			}
		}
})