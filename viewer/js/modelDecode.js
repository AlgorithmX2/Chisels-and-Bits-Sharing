
function readByte( readerState )
{
	// readerState: pixelbytes, index, c
	do
	{
		var currentValue = readerState[0][ readerState[1] + readerState[2] ];
		var alpha = readerState[0][ readerState[1] + 3 ];	
		
		readerState[2]++;
		
		if ( alpha > 128 )
		{
			var p1 = readerState[0][ readerState[1] + 0 ];
			var p2 = readerState[0][ readerState[1] + 1 ];
			var p3 = readerState[0][ readerState[1] + 2 ];
			
			currentValue = ( ( alpha & 3 ) << 6 ) | ( ( p1 & 3 ) << 4 ) | ( ( p2 & 3 ) << 2 ) | ( ( p3 & 3 ) );
			
			readerState[1] += 4;
			readerState[2] = 0;
		}
		else if ( readerState[2] >= 3 )
		{
			readerState[1] += 4;
			readerState[2] = 0;
		}
		
		break;
	}
	while ( true );
	
	return currentValue;
}

function imageDecode( pixelbytes )
{
	console.log('imageDecode');
	var readerState = [ pixelbytes, 0, 0 ];
	
	var size = readByte( readerState ) << 24;
	size |= readByte( readerState ) << 16;
	size |= readByte( readerState ) << 8;
	size |= readByte( readerState );
	
	var out = new Uint8Array(size);
	for ( var x = 0; x < size; ++x )
		out[x] = readByte( readerState );
	
	return out;
}

function processPNG( pngBytes )
{
	console.log('processPNG');
	try
	{
		var png = new PNG( pngBytes );
		var gzipData = imageDecode( png.decodePixels() );
		deflateAndLoad(gzipData);
	}
	catch( e )
	{
		killLoading('<p>Model was not validly encoded into image.</p>');
		console.log(e);
		return;
	}
}

function deflateAndLoad( gzipData )
{
	try
	{
		var binaryInflated = pako.inflate( gzipData );
	}
	catch( e )
	{
		killLoading();
		console.log(e);
		document.body.innerHTML = '<p>Could not load model, format appears to be wrong.. <a href="./">View Tests?</a></p>';
		return;
	}

	try
	{
		var reader = new shareformatreader(binaryInflated);
		var jsonModel = reader.readModel();
		
		if ( jsonModel == null || jsonModel == false ) throw {};
		done( jsonModel );
	}
	catch( e )
	{
		killLoading('<p>Model was not valid.</p>');
		return;
	}
}
