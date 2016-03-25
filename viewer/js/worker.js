
var window = this;

importScripts( 'modelDecode.js', 'zlib.js', 'gzip.js', 'png.js', 'shareformatreader.js' );

function killLoading( msg )
{
	postMessage( { command: ( typeof msg === 'undefined' ? 'hideloading' : 'error' ), msg: msg } );
}

function done( jsonModel )
{
	console.log('done');
	postMessage( { command: 'model', msg: jsonModel } );
	close();
}

onmessage = function(e) {
	console.log('begin');
	processPNG( e.data );
};
