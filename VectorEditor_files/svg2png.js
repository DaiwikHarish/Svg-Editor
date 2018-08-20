var svg = document.querySelector( "svg" );
var svgData = new XMLSerializer().serializeToString( svg );

var canvas = document.createElement( "canvas" );
var ctx = canvas.getContext( "2d" );

var img = document.createElement( "img" );
img.setAttribute( "src", "data:image/svg+xml;base64," + btoa( svgData ) );

img.onload = function() {
    ctx.drawImage( img, 0, 0 );
    
    // Now is done
    console.log( canvas.toDataURL( "image/png" ) );
};