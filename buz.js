var io;
var gameSocket;
var data_bus = null;

var dados = "http://dadosabertos.rio.rj.gov.br/apiTransporte/apresentacao/rest/index.cfm/obterTodasPosicoes";
//var dados = "http://monitoramento.subpav.rio/COVID19/dados_abertos/Dados_indiv_MRJ_covid19.csv";

// Inicio [init]
exports.initGame = function(sio, socket){
	io = sio;
	gameSocket = socket;

	gameSocket.on("buscar", buscar);
	gameSocket.on("update", update);

	gameSocket.emit("conn_init", { socket_id: socket.id });
}
// Fim [init]

// Inicio [buscar]
function buscar(data){
	console.log("-----------------");
	console.log("buscar...");
	console.log(data);
	//var res = ajax("www.google.com");
	//ajax(dados, function(resp){
		//io.sockets.sockets[data.socket].emit("buscar_ok", {body: resp});
	//});
	return false;
}
// Fim [buscar]

// Inicio [update]
function update(data){
	console.log("-----------------");
	console.log("update...");
	console.log(data);
	io.sockets.sockets[data.socket].emit("update_ok", {body: data_bus});
}
// Fim [update]

// Inicio [update_serv]
function update_serv(){
	console.log("-----------------");
	console.log("update_serv...");
	//data_bus = require("./client/js/dados.json");
	ajax(dados, function(resp){
		//console.log(resp);
		data_bus = resp;
	});
}
// Fim [update_serv]

// Inicio [ajax]
function ajax(url, cb){
	console.log("-----------------");
	console.log("ajax...");
	console.log(url);

	var data_res = "";
	var http = require("http");
	var options = {host: "dadosabertos.rio.rj.gov.br", path: '/apiTransporte/apresentacao/rest/index.cfm/obterTodasPosicoes', headers: {
		"Host": "dadosabertos.rio.rj.gov.br",
		"User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:56.0) Gecko/20100101 Firefox/56.0",
		"Accept": "text/html",
		//"Accept-Language": "en-US,en;q=0.5",
		//"Accept-Encoding": "gzip, deflate",
		"DNT": 1,
		"Connection": "keep-alive",
		"Upgrade-Insecure-Requests": "1",
		"Cache-Control": "max-age=0"
	}};

	var req = http.get(options, function(res) {
		console.log("Resposta: " + res.statusCode);

		res.on("data", function(chunk) {
			data_res += chunk;
		});

		res.on("end", function () {
			cb(data_res);
		});

		res.on("error", function (e) {
			console.log(e.message);
		});

	});

	req.on("error", function (e) {
	console.log("-----------------");
	console.log("servidor fora...");
	console.log(e.message);
	});

}
// Fim [ajax]

update_serv();
setInterval(function(){update_serv();}, 1000*60);