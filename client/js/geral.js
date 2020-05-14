var socket_id = null;
var data_bus =  null;
var data_filtro = null;

var omapa = null;
var omarker = [];
var olayer = null;

var linhas = {};

var ponto_inicio = {lat: -22.987, lon: -43.2047};

	$.getJSON("/client/js/linhas.json", function(json){
		linhas = json;
	});

// Inicio [socket_recebe]
socket.on("conn_init", conn_init);
socket.on("update_ok", update_ok);
socket.on("buscar_ok", buscar_ok);
// Fim [socket_recebe]

// Inicio [conn_init]
function conn_init(data){
	console.log("conn_init...");
	console.log(data);
	if(data && data.socket_id){
		socket_id = data.socket_id;
	}
	bi.LightboxEsconde({lightbox: "load"});
	//socket.emit("buscar", {socket: socket_id, linha: 525});
	update();
	return false;
}
// Fim [conn_init]

// Inicio [buscar_ok]
function buscar_ok(data){
	console.log("buscar_ok...");
	console.log(data.body);
	return false;
}
// Fim [buscar_ok]

// Inicio [update_ok]
function update_ok(data){
	data_bus = $.parseJSON(data.body);
	if(data_bus){
		buscar();
	}
	return false;
}
// Fim [update_ok]

// Inicio [init_map]
function init_map(){
	omapa = new ol.Map({
		target: "mapa",
		layers: [
			new ol.layer.Tile({
				source: new ol.source.OSM(),
				title: "Default"
			})
		],
		view: new ol.View({
			center: ol.proj.fromLonLat([ponto_inicio.lon, ponto_inicio.lat]),
			zoom: 14
		})
	});

	omapa.on("click", function(e){
		removeOverlay();
		omapa.forEachFeatureAtPixel(e.pixel, function(feature, layer){

			var datahora = feature.get("datahora");
			var ordem = feature.get("ordem");
			var linha = feature.get("linha");
			var lat = feature.get("lat");
			var lon = feature.get("lon");
			var vel = feature.get("vel");
			console.log(datahora, ordem, linha, lat, lon, vel);

			var view = omapa.getView();
			view.animate({
				center: ol.proj.fromLonLat([lon, lat]),
				zoom: 16
			});
			//view.setCenter(ol.proj.fromLonLat([lon, lat]));
			//view.setZoom(16);

			var div = $("<div class='overlay' id='"+ordem+"'></div>");
			var span = $("<span class='overlay_body'></span>");
			var span_datahora = $("<span class='item'>datahora: "+datahora+"</span>");
			var span_ordem = $("<span class='item'>ordem: "+ordem+"</span>");
			var span_linha = $("<span class='item'>linha: "+linha+"</span>");
			var span_lat = $("<span class='item'>latitude: "+lat+"</span>");
			var span_lon = $("<span class='item'>longitude: "+lon+"</span>");
			var span_vel = $("<span class='item'>velocidade: "+vel+"km/h</span>");
			var span_end = $("<span class='end'></span>");
			var canvas = $("<canvas width='50' height='50'></canvas>");
			ctx = canvas[0].getContext("2d");
			ctx.lineWidth = 1;
			ctx.strokeStyle = "#ccc";
			ctx.fillStyle = "#fff";
			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.lineTo(25, 50);
			ctx.lineTo(50, 0);
			ctx.closePath();
			ctx.stroke();
			ctx.fill();

			span.append(span_datahora);
			span.append(span_ordem);
			span.append(span_linha);
			span.append(span_lat);
			span.append(span_lon);
			span.append(span_vel);
			span_end.append(canvas);
			div.append(span);
			div.append(span_end);
			$("body").prepend(div);

			var coords = feature.getGeometry().getCoordinates();
			olayer = new ol.Overlay({element: div[0], position: coords, positioning: "bottom-center", offset: [0, -75]});
			omapa.addOverlay(olayer);

			//var pixel = omapa.getPixelFromCoordinate(coords);
			//var x = pixel[0]-div.outerWidth()/2;
			//var y = pixel[1]-div.outerHeight()-75;
			//div.css({left: x, top: y});
			//olayer.setPosition(coords);
		});
		//console.log(ol.proj.toLonLat(e.coordinate));
	});

	return false;
}
// Fim [init_map]

// Inicio [removeOverlay]
function removeOverlay(){
		$(".overlay").remove();
		if(olayer){
			olayer.setPosition(undefined);
			omapa.removeOverlay(olayer);
		}
		return false;
}
// Fim [removeOverlay]

// Inicio [add_marker]
function add_marker(pt){
	var marker = [];
	var iconFeature = new ol.Feature({
		geometry: new ol.geom.Point(ol.proj.transform([pt.lon, pt.lat], "EPSG:4326", "EPSG:3857")),
		datahora: pt.datahora,
		ordem: pt.ordem,
		linha: pt.linha,
		lat: pt.lat,
		lon: pt.lon,
		vel: pt.vel
	});

	var iconStyle = new ol.style.Style({
		image: new ol.style.Icon(({
		anchor: [0.5, 1],
		//src: "http://cdn.mapmarker.io/api/v1/pin?text=B&size=50&hoffset=1"
		src: "https://cdn.mapmarker.io/api/v1/pin?size=50&background=%234D4D4D&text=B&color=%23FFFFFF&voffset=-1&hoffset=1&"
		}))
	});
	iconFeature.setStyle(iconStyle);
	marker.push(iconFeature);

	var ovectorSource = new ol.source.Vector({
		features: marker
	});

	var ovectorLayer = new ol.layer.Vector({
		source: ovectorSource
	});

	//var coordinate = ovectorLayer.getSource().getFeatures()[0].getGeometry().getCoordinates();
	//var pixel = omapa.getPixelFromCoordinate(coordinate);
	//console.log(pixel);
	//var span = $("<span class='square'></span>");
	//span.css({left: pixel[0], top: pixel[1]});
	//$("body").append(span);

	omarker.push(ovectorLayer);
	omapa.addLayer(ovectorLayer);
	//omapa.removeLayer(ovectorLayer);
	return false;
}
// Fim [add_marker]

// Inicio [render]
function render(arr){
	for(var layer in omarker){
		var l = omarker[layer];
		omapa.removeLayer( l );
	}
	omarker = [];
	for(var bus in arr){
		var b = arr[bus];
		add_marker({lat: b[3], lon: b[4], datahora: b[0], ordem: b[1], linha: b[2], vel: b[5]});
	}
	//console.log(omapa.getLayers());
	return false;
}
// Fim [render]

// Inicio [buscar]
function buscar(){
	removeOverlay();
	data_filtro = [];
	var linha = $("#linha").val();
	var linha_html = $(".linha");
	linha_html.html("");
	//console.log(linhas);
	for(var line in linhas){
		var l = linhas[line];
		if(l.hasOwnProperty(linha)){
			linha_html.html(l[linha].nome);
		}
	}
	if(data_bus){
		var linha = parseInt(linha);
		for(var item in data_bus.DATA){
			var i = data_bus.DATA[item];
			if(i[2] == linha){
				data_filtro.push(i);
			}
		}
		render(data_filtro);
	}else{
		app_alerta({alerta:{txt: "Servidor fora..."}});
	}
	return false;
}
// Fim [buscar]

// Inicio [app_alerta]
function app_alerta(data){
	data_old = data;
	var alerta = $("#alerta");
	if(data.alerta){
		//console.log("app_alerta...");
		alerta.html(data.alerta.txt);
		bi.LightboxExibe({lightbox: "alerta"});
		setTimeout(function(){ bi.LightboxEsconde({lightbox: "alerta"}); }, 1500);
	}
	return false;
}
// Fim [app_alerta]

// Inicio [update]
function update(){
		console.log("update...");
		socket.emit("update", {socket: socket_id});
		/*
		$.ajax({ url: "http://dadosabertos.rio.rj.gov.br/apiTransporte/apresentacao/rest/index.cfm/obterTodasPosicoes", context: "", success: function(resposta, status, xhr){
			//console.log(resposta);
			data_bus = resposta;
			//jogo_alerta({alerta: {txt:"idle ping..."}});
		}});
		*/

	/*
	$.getJSON("/client/js/dados.json", function(json){
		data_bus = json;
	});
	*/
	
	return false;
}
// Fim [update]

// Inicio [help_buscar]
function help_buscar(num){
	bi.LightboxEsconde({lightbox: "bus_linhas"});
	$("#linha").val(num);
	buscar();
	return false;
}
// Fim [help_buscar]

// Inicio [buz_help]
function buz_help(){
	var div = $("#bus_linhas");
	div.html("");
	for(var linha in linhas){
		var l = linhas[linha];
		var grupo = $("<span class='linhas_grupo'></span>");
		var head = $("<span class='linhas_head'>"+linha+"</span>");
		var body = $("<span class='linhas_body'></span>");
		//console.log(l);
		for(var bus in l){
			var nome = l[bus].nome
			//console.log(bus, nome);
			body.append("<span class='linhas_item' onclick=\"return help_buscar('"+bus+"');\">"+bus+" - "+nome+"</span>");
		}
		grupo.append(head);
		grupo.append(body);
		div.append(grupo);
	}
	bi.LightboxExibe({lightbox: "bus_linhas"});
	return false;
}
// Fim [buz_help]

$(function(){
	bi.LightboxExibe({lightbox: "load"});
	init_map();
	//omapa.removeLayer( omapa.getLayers().array_[0] );
	//add_marker(ponto_inicio);
	//add_marker({lat:-22.983468, lon:-43.199917});
	 setInterval(function(){update();}, 1000*60);
});
