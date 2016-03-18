/**
 * Author: AlgorithmX2
**/

var BYTE_FIRST_BIT = 0x80;

function shareformatreader( bytes /* Uint8Array */ )
{
	this.bytes = bytes;
	this.byteIndex = 0;
	this.bitIndex = 0;
	this.getInt();
}

shareformatreader.prototype.getInt = function()
{
	var byteIndex = this.byteIndex;
	this.currentInt = ( this.bytes[byteIndex] << 24 ) | ( this.bytes[byteIndex+1] << 16 ) | ( this.bytes[byteIndex+2] << 8 ) | ( this.bytes[byteIndex+3] );
}

shareformatreader.prototype.readModel = function()
{
	var model = {
		materials: [],
		model: [],
		textures: {}
	};
	
	var version = this.readInt();
	
	if ( version != 1 )
	{
		throw "Invalid Format, was not shared model version 1.";
	}
	
	var x = this.readInt();
	var y = this.readInt();
	var z = this.readInt();
	var bits = this.readInt();
	
	console.log("x: " + x);
	console.log("y: " + y);
	console.log("z: " + z);
	console.log("bits: " + bits);
	
	var stuctureNodes = x * y * z;
	for ( var t = 0; t < stuctureNodes; ++t )
		this.readBits(bits);
	
	this.snapToByte();
	
	var modelCount = this.readInt();
	console.log("modelCount: " + modelCount);
	
	for ( var t = 0; t < modelCount; ++t ) this.readBytes(); // we don't need these either.
	
	var textureCount = this.readInt();
	console.log("textureCount: " + textureCount);
	
	for ( var t = 0; t < textureCount; ++t ) 
	{
		model.textures[ this.readInt() ] = this.readBytes();
	}
	
	var materialCount = this.readInt();
	console.log("materialCount: " + materialCount);
	
	for ( var t = 0; t < materialCount; ++t ) 
	{
		var col = this.readBits(8) | 
		( this.readBits(8) << 8 ) |
		( this.readBits(8) << 16 ) | 
		( this.readBits(8) << 24 );
				
		var layer = this.readInt();
		var texture = this.readInt();
		
		switch( layer ) {
			case 0: layer = 's'; break;
			case 1: layer = 'a'; break;
			case 2: layer = 't'; break;
		}
		
		model.materials.push( [layer,col,texture] );
	}

	var faceGroupCount = this.readInt();
	console.log("faceGroupCount: " + faceGroupCount);
	
	for ( var t = 0; t < faceGroupCount; ++t ) 
	{
		var material = this.readInt();
		var group = { m: material, f: [] };
		
		var verts = this.readInt();
		var faces = verts / 4;
		
		for ( var g = 0; g < faces; ++g )
		{
			group.f.push( [ [this.readInt(),0,0,0,0], [this.readInt(),0,0,0,0], [this.readInt(),0,0,0,0], [this.readInt(),0,0,0,0] ] ); 
		}
		
		// read the rest of the data...
		for ( var idx = 1; idx < 5; ++idx )
		{
			for ( var g = 0; g < faces; ++g )
			{
				for ( var q = 0; q < 4; ++q )
				{
					group.f[ g ][ q ][ idx ] = this.readInt();
				}
			}
		}
		
		model.model.push( group );
	}
	
	console.log(model);
	
	return model;
};

shareformatreader.prototype.readBool = function()
{
	var myBit = ( this.currentInt & (1 << this.bitIndex) ) != 0;
	
	this.bitIndex++;
	
	if ( this.bitIndex >= 32 )
	{
		this.bitIndex = 0;
		this.byteIndex+=4;
		this.getInt();
	}
	
	return myBit != 0;
};

shareformatreader.prototype.readBits = function( bits )
{
	var assemble = 0;
	var offset = 0;
	
	while ( bits-- > 0 )
	{
		assemble = assemble | ( this.readBool() ? 1 << offset : 0 );
		++offset;
	}
	
	return assemble;
};

shareformatreader.prototype.readInt = function()
{
	var repeat = this.readBool();
	var myInt = this.readBits( 7 );
	var limit = 4;
	
	var offset = 7;
	while ( repeat && --limit >= 0 )
	{
		repeat = this.readBool();
		myInt |= this.readBits( 7 ) << offset;
		offset += 7;
	}
	
	return myInt;
};

shareformatreader.prototype.readBytes = function()
{
	var dataLength = this.readInt();
	var a = new Uint8Array(dataLength);
	
	for ( var x = 0; x < dataLength; ++x )
	{
		a[x] = this.readBits(8);
	}
	
	return a;
};

shareformatreader.prototype.snapToByte = function()
{
	while ( this.bitIndex % 8 != 0 )
	{
		this.readBool();
	}
};
