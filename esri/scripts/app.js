define(["scripts/keys",
	 	"scripts/api",
	 	"scripts/wrappedMap",
	 	"dojo/domReady!"],
	function(keys,
			api,
			WrappedMap
			) {

		if(keys.apiId == ""){
			console.error("Please update api key");
		}

		var map = new WrappedMap([-0.089, 51.5], "viewDiv");


		var batman = [[51.53053285458183, -0.0487518310546875],
			[51.52903776845088, -0.234832763671875]];

		var superman = [[51.48533822311959, 0.00274658203125],
			[51.46898018751687, -0.1682281494140625]];


		api.getPath(batman[0], batman[1], map.drawPath);
		api.getPath(superman[0], superman[1], map.drawPath);

		api.getShape(batman[0], map.drawShape);
		api.getShape(superman[0], map.drawShape);

	}
);