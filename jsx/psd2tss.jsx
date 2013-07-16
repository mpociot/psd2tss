// EDIT THIS FOLDER
#include /Users/marcelpociot/json.jsx

/**
 * This script converts a PSD layer structure
 * into Titanium Alloy XML / TSS markup.
 * 
 * @author Marcel Pociot 
 */
 var conf = {
    // EDIT
    magick: '/opt/ImageMagick/bin/convert'
 },
 xmlLines  = [],
 outputXML = '',
 outputTSS = '',
 outputPath = '',
 numLayers = 1, // Used for imagemagick
 structure = {};
      

function run(){
    saveFile();

    // Pop up save dialog
    var targetDirectory = Folder.selectDialog("Please select your Titanium project directory:");

    // User Cancelled
    if(targetDirectory == null)
    {
        return;
    }

    // set outputPath to the one chosen in the dialog
    outputPath            = targetDirectory.absoluteURI + "/";


    // Select first layer-set
    outputXML             = "<Alloy>\n<Window id=\"Window\">\n";
    layerSet              = app.activeDocument.layerSets[0];
    structure.name        = layerSet.name;
    structure.properties  = [];
    dumpLayerSets(layerSet, structure); 
    for( var i=0,max=xmlLines.length; i < max; i++ )
    {
        outputXML += "\t" + xmlLines[i];
    }
    outputXML            += "</Window>\n</Alloy>\n";

    // Write TSS file
    var stylesPath = new Folder( outputPath + 'styles' ).create();
    var tssFile = new File( outputPath + 'styles/' + structure.name + '.tss' );
    tssFile.open( 'w' );
    tssFile.write( outputTSS );

    // Write XML file
    var viewsPath = new Folder( outputPath + 'views' ).create();
    var tssFile = new File( outputPath + 'views/' + structure.name + '.xml' );
    tssFile.open( 'w' );
    tssFile.write( outputXML );
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
            
            // Export layer as PNG
            var filename = 'psd2tss-'+numLayers+'.png';
            app.system(conf.magick + ' /tmp/temp.psd['+numLayers+'] '+ outputPath + filename);
            numLayers++;
            
            if( layer.name == 'Window' )
            {
                var layerID    = layer.name;
            } else {
                var layerID    = layer.name +'_' + numLayers;
            }
            
            var attributes = 'id="'+ layerID + '"';

            outputTSS += "\n" + '#' + layerID + ' {' + "\n";

            // Export basic properties
            outputTSS += "\t'width': '" + layerObj.width + ",' \n";
            outputTSS += "\t'height': '" + layerObj.height + "', \n";
            outputTSS += "\t'top': '" + layerObj.top + "', \n";
            outputTSS += "\t'left': '" + layerObj.left + "', \n";

            /**
             * Layer / element specific attribute mapping
             */ 
            switch( layer.name )
            {
                case 'Window':
                    outputTSS += "\t'backgroundImage': '/images/" + filename + "', \n";
                break;
                case 'ImageView':
                    outputTSS += "\t'image': '/images/" + filename + "', \n";
                break;
            }

            if( layer.name !== 'Window' )
            {
                xmlLines.unshift( 
                    '<' + layer.name + ' '+ attributes +'></' + layer.name + '>' + "\n"
                );
            }

            outputTSS += "\n" + '} ' + "\n";
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
$.writeln( outputTSS );