#include /Users/marcelpociot/json.jsx
/**
 * This script converts a PSD layer structure
 * into Titanium Alloy XML / TSS markup.
 * 
 * @author Marcel Pociot 
 */
 var conf = {
    magick: '/opt/ImageMagick/bin/convert',
    root:   '/Users/marcelpociot/'
 },
 xmlLines  = [],
 outputXML = '',
 numLayers = 1, // Used for imagemagick
 structure = {};
      

function run(){
    saveFile();

    // Select first layer-set
    outputXML             = "<Alloy>\n<Window>\n";
    layerSet              = app.activeDocument.layerSets[0];
    structure.name        = layerSet.name;
    structure.properties  = [];
    dumpLayerSets(layerSet, structure); 
    for( var i=0,max=xmlLines.length; i < max; i++ )
    {
        outputXML += xmlLines[i];
    }
    outputXML            += "</Window>\n</Alloy>\n";
}

/**
 * Save the current document to a temporary location
 * so that imagemagick can parse the file
 */
function saveFile()
{
    // Save document
    var tmpFile                 = new File( '/tmp/temp.psd');
    psdOpts                     = new PhotoshopSaveOptions();
    psdOpts.embedColorProfile   = true;
    psdOpts.alphaChannels       = true;
    psdOpts.layers              = true;
    app.activeDocument.saveAs(tmpFile, psdOpts, true, Extension.LOWERCASE);
}
 
function dumpLayerSets(layerSet, currentElement)
{
    // current layerset contains layers
    if( layerSet.artLayers.length > 0 )
    {
        for( var i=0, max=layerSet.artLayers.length; i<max; i++ )
        {
            layer = layerSet.artLayers[i];

            layerObj = {
                    name:   layer.name,
                    top:    layer.bounds[0].as("px"),
                    left:   layer.bounds[1].as("px"),
                    width:  ( layer.bounds[2].as("px") - layer.bounds[0].as("px") ),                    
                    height: ( layer.bounds[3].as("px") - layer.bounds[1].as("px") )
             };
            currentElement.properties.unshift( layerObj );
            var filename = 'psd2tss-'+numLayers+'.png';
            app.system(conf.magick + ' /tmp/temp.psd['+numLayers+'] '+ conf.root + filename);
            numLayers++;
            
            var attributes = '';

            if( layer.name !== 'Window' )
            {

                switch( layer.name )
                {
                    case 'ImageView':
                        attributes = 'src="/images/'+filename+'"';
                    break;
                }

                xmlLines.unshift( 
                    '<' + layer.name + ' '+ attributes +'></' + layer.name + '>' + "\n"
                );
            }
        }
    }
    // Current layerset contains other layersets
    if( layerSet.layerSets.length > 0 )
    {        
        for( var i=0, max=layerSet.layerSets.length; i<max; i++ )
        {
            _layerSet               = layerSet.layerSets[i];
            layerSetObj             = {};
            layerSetObj.name        = _layerSet.name;
            layerSetObj.properties  = [];
            currentElement.properties.unshift( layerSetObj );
            // Iterate
            dumpLayerSets( _layerSet, layerSetObj );
        }
    }
}
 

run();
$.writeln( JSON.stringify( structure, undefined, 2 ) );
$.writeln( outputXML );