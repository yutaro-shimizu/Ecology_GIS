// 気温　temperature
// 積雪深　snow depth (降雪量とは別に)
// 植被率　coverage
// 樹種名　name of tree
// 基質の状態　substrate

///////////////////////////////////////////////////////////////
//    1) Import Landsat and SMAP image collections           //
///////////////////////////////////////////////////////////////
var l4 = ee.ImageCollection('LANDSAT/LT04/C02/T1_L2');
var l5 = ee.ImageCollection('LANDSAT/LT05/C02/T1_L2');
var l7 = ee.ImageCollection('LANDSAT/LE07/C02/T1_L2');
var l8 = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2');
var l9 = ee.ImageCollection('LANDSAT/LC09/C02/T1_L2');
var smap = ee.ImageCollection('NASA/SMAP/SPL4SMGP/007');

///////////////////////////////////////////////////////////////
//    2) Set up map appearance and app layers                //
///////////////////////////////////////////////////////////////
Map.setOptions('Satellite') //Set up a satellite background
Map.setControlVisibility(true, true, false, true, true, false)
Map.setCenter(138.325000, 36.081111,12); // Center on K.Yamashita plot.

//Change style of cursor to 'crosshair'
Map.style().set('cursor', 'crosshair');

//Apply scaling factors to Landsat 8 images
function applyScaleFactors(input) {
  var opticalBands = input.select('SR_B.').multiply(0.0000275).add(-0.2);
  var thermalBands = input.select('ST_B.*').multiply(0.00341802).add(-124.5);
  return input.addBands(opticalBands, null, true)
              .addBands(thermalBands, null, true);
}
var l4 = l4.map(applyScaleFactors);
var l5 = l5.map(applyScaleFactors);
var l7 = l7.map(applyScaleFactors);
var l8 = l8.map(applyScaleFactors);
var l9 = l9.map(applyScaleFactors);

//Change band names for convenience
l4 = l4.select(['SR_B1','SR_B2','SR_B3','SR_B4','ST_B6','QA_PIXEL','QA_RADSAT'],['blue','green','red','nearIR','LST','QA_PIXEL','QA_RADSAT']);
l5 = l5.select(['SR_B1','SR_B2','SR_B3','SR_B4','ST_B6','QA_PIXEL','QA_RADSAT'],['blue','green','red','nearIR','LST','QA_PIXEL','QA_RADSAT']);
l7 = l7.select(['SR_B1','SR_B2','SR_B3','SR_B4','ST_B6','QA_PIXEL','QA_RADSAT'],['blue','green','red','nearIR','LST','QA_PIXEL','QA_RADSAT']);
l8 = l8.select(['SR_B2','SR_B3','SR_B4','SR_B5','ST_B10','QA_PIXEL','QA_RADSAT'],['blue','green','red','nearIR','LST','QA_PIXEL','QA_RADSAT']);
l9 = l9.select(['SR_B2','SR_B3','SR_B4','SR_B5','ST_B10','QA_PIXEL','QA_RADSAT'],['blue','green','red','nearIR','LST','QA_PIXEL','QA_RADSAT']);

var l_series = ee.ImageCollection([])
l_series = l_series.merge(l4);
l_series = l_series.merge(l5);
l_series = l_series.merge(l7);
l_series = l_series.merge(l8);
l_series = l_series.merge(l9);

function l_image(startDate, endDate,radius){
  return ee.Image(
  l_series.filterDate(startDate,endDate)
    .filterBounds(geometry.buffer(radius))
    .sort('CLOUD_COVER')
    .first())}

//True color image
function l_display(image, selectedlayer, radius){
  var truecolor = image.select('red', 'green', 'blue')
  var truecolorPalette = {
    min: 0.0,
    max: 0.3,
  }
  
  //Land Surface Temperature
  var lst = image.select('LST')
  var lstParams = {
    min: -10,
    max: 30,
    palette: ['30638E','003D5B','00798C','EDAE49','D1495B']
  };
  
  //Vegetation Index
  var ndvi = image.normalizedDifference(['nearIR','red']);
  var ndviParams = {
    min: -1, 
    max: 1, 
    palette: ['blue', 'white', 'green']}
  var truecolor_layer = ui.Map.Layer(truecolor.clip(Map.drawingTools().layers().get(0).getEeObject().buffer(radius)),truecolorPalette,'True color');
  var lst_layer = ui.Map.Layer(lst.clip(Map.drawingTools().layers().get(0).getEeObject().buffer(radius)), lstParams, 'LST');
  var ndvi_layer = ui.Map.Layer(ndvi.clip(Map.drawingTools().layers().get(0).getEeObject().buffer(radius)), ndviParams, 'NDVI');
  
  if (selectedlayer==tc_select){
    Map.add(truecolor_layer)}
  else if (selectedlayer==lst_select){
    Map.add(lst_layer)}
  else {
    Map.add(ndvi_layer)}
}

// Load SMAP images for soil moisture
function smap_image(startDate, endDate){
  return ee.Image(
  smap.filterDate(startDate, endDate)
    .first()
)}

function smap_display(image, radius){
  var soilMoisture = image.select('sm_surface');
  var soilMoistureParams = {
    min: 0.0,
    max: 0.7,
    palette: ['A67C00', 'FFE625', 'C2E5D3', '90DCD0',
              '2FBDBD', '0C9BBD', '068682'],
  };
  
  //2.3) Create variables for GUI layers for each layer
  //We set each layer to \"false\" so the user can turn them on later

  var soilmoisture_layer = ui.Map.Layer(soilMoisture.clip(Map.drawingTools().layers().get(0).getEeObject().buffer(radius)), soilMoistureParams, 'Soil Moisture');
  
  Map.add(soilmoisture_layer)
}

///////////////////////////////////////////////////////////////
//      3) Set up panels and widgets for display             //
///////////////////////////////////////////////////////////////

//3.1) Set up title and summary widgets

//App title
var header = ui.Label('Forest Microclimate Explorer', 
                      {color: '292929', fontSize: '16px', fontWeight: '500', backgroundColor: 'rgba(0,0,0,0.0)'})

var text_style = {fontSize: '11px',
    fontWeight: '500', 
      position: 'top-left',
      margin: '0px',
      backgroundColor: 'rgba(0,0,0,0)'
    }
    
//App summary
var intro_text = ui.Label(
  'This website maps key microclimate variables: Land Surface Temperature, Normalized Difference Vegetation Index and Soil Moisture from Landsat and SMAP satellites. ',
    text_style);
var landsat_text = ui.Label(
  "Landsat Series: Since the launch of Landsat 4 in 1982, the series have used visible and near-IR wavelengths to capture the Earth's key socio-ecological land-use changes."+
  "The dataset is available since 1982-08-22T14:19:55Z at 30 meters resolution. "+
  "Important notice: the satellites orbit over the same region every 16 days. "+
  "Therefore, this data alone cannot defnitively provide min/max lst and ndvi as Landsat does not provide 24/7 geostationary monitoring. "+
  "This data should be supplemented alongside other stationary data (e.g., on-the-ground measuremenets) to compensate for the missing values. "+
  "For more details, visit https://developers.google.com/earth-engine/datasets/catalog/landsat",
    text_style);
var smap_text = ui.Label(
  'NASA-USDA Enhanced SMAP Global Soil Moisture Data: SMAP is a microwave satellite that measures on-surface moisture of the whole globe every 2-3 days. The dataset is available since 2015-04-02 T12:00:00Z at 10000 meters resolution. The latest image gets processed in about a week.'+
  'More details available at https://developers.google.com/earth-engine/tutorials/community/smap-soil-moisture',
    text_style);
    
// Function to create reference panel.
function referencecreate() {
    var referenceOne = ui.Label({
        value: 'Advances in Microclimate Ecology Arising from Remote Sensing',
        style: text_style,
        targetUrl: 'https://www.cell.com/trends/ecology-evolution/pdf/S0169-5347(18)30304-5.pdf'
    });
    var referenceTwo = ui.Label({
        value: 'Forest microclimates and climate change: Importance, drivers and future research agenda',
        style: text_style,
        targetUrl: 'https://onlinelibrary.wiley.com/doi/10.1111/gcb.15569'
    });
    var referenceThree = ui.Label({
        value: 'Forest microclimate dynamics drive plant responses to warming',
        style: text_style,
        targetUrl: 'https://www.science.org/doi/epdf/10.1126/science.aba6880'
    });
    var referenceFour = ui.Label({
        value: 'On the measurement of microclimate',
        style: text_style,
        targetUrl: 'https://besjournals.onlinelibrary.wiley.com/doi/epdf/10.1111/2041-210X.13627'
    });
    var referenceFive = ui.Label({
        value: 'Applications in Remote Sensing to Forest Ecology and Management',
        style: text_style,
        targetUrl: 'https://www.cell.com/one-earth/pdf/S2590-3322(20)30206-2.pdf'
    });
    var referenceSix = ui.Label({
        value: 'From Space to Species: ecological applications for remote sensing',
        style: text_style,
        targetUrl: 'https://www.sciencedirect.com/science/article/abs/pii/S0169534703000715'
    });
    var referenceSeven = ui.Label({
        value: 'Integrating network ecology with applied conservation: a synthesis and guide to implementation',
        style: text_style,
        targetUrl: 'https://academic.oup.com/aobpla/article/doi/10.1093/aobpla/plv076/1797602'
    });
    var referenceEight = ui.Label({
        value: 'Landsat continuing to improve everyday life',
        style: text_style,
        targetUrl: 'https://landsat.gsfc.nasa.gov/wp-content/uploads/2013/11/Landsat_Improve_Life1.pdf'
    });
    var referenceNine = ui.Label({
        value: 'Source code',
        style: text_style,
        targetUrl: 'https://github.com/yutaro-shimizu/Forest_Microclimate_Visualizer',
        imageUrl: 'https://cdn-icons-png.flaticon.com/512/25/25231.png'
    });
    // Add reference to the panel.
    panel_refs.add(referenceOne);
    panel_refs.add(referenceTwo);
    panel_refs.add(referenceThree);
    panel_refs.add(referenceFour);
    panel_refs.add(referenceFive);
    panel_refs.add(referenceSix);
    panel_refs.add(referenceSeven);
    panel_refs.add(referenceEight);
    panel_refs.add(referenceNine);
}

//3.2) Create a panel to hold text
var base_panel = ui.Panel({
  widgets:panel_buttons,
//Adds header and text
  style:{margin: '2 px',
        position:'top-left',
        backgroundColor: 'rgba(242,242,242, 0)'
  }});

//3.2) Create a panel to hold text
var panel = ui.Panel({
  widgets:[header],
//Adds header and text
  style:{margin: '2 px',
        position:'top-left',
        width: '274.48px',
        backgroundColor: 'rgba(242,242,242, 0.8)'
  }});
  
//3.2) Create a panel to hold text
var panel_about = ui.Panel({
  widgets:[intro_text,landsat_text,smap_text],//Adds header and text
  style:{margin: '2 px',
        position:'top-left',
        width: '274.48px',
        backgroundColor: 'rgba(242,242,242, 0.8)'
  }});
  
//3.2) Create a panel to hold text
var panel_refs = ui.Panel({
//Adds header and text
  style:{margin: '2 px',
        position:'top-left',
        width: '274.48px',
        backgroundColor: 'rgba(242,242,242, 0.8)'
  }});
// Call the reference panel creation function.
referencecreate();
  
var button_home = ui.Button({label: 'Home', onClick: 
                            function(){base_panel.clear()
                                                 .add(panel_buttons)
                                                 .add(panel)},
style: {stretch: 'horizontal', 
                            position:'top-left',
                            padding: (0,0,0,0),
                            margin: (0,0,0,0),
                            backgroundColor: 'rgba(60, 60, 60, 0)'
}});
var button_about = ui.Button({label: 'About', onClick: 
                            function(){base_panel.clear()
                                                 .add(panel_buttons)
                                                 .add(panel_about)
                            },
                            style: {stretch: 'horizontal', 
                            position:'top-left',
                            padding: (0,0,0,0),
                            margin: (0,0,0,0),
                            backgroundColor: 'rgba(60, 60, 60, 0)'
}});
var button_refs = ui.Button({label: 'References',onClick: 
                            function(){base_panel.clear()
                                                 .add(panel_buttons)
                                                 .add(panel_refs)
                            }, 
                            style: {stretch: 'horizontal', 
                            position:'top-left',
                            padding: (0,0,0,0),
                            margin: (0,0,0,0),
                            backgroundColor: 'rgba(60, 60, 60, 0)'
}});

//3.2) Create a panel to hold text
var panel_buttons = ui.Panel({
                    widgets: [button_home, button_about, button_refs],
                    layout: ui.Panel.Layout.flow('horizontal'),
                    style: {stretch: 'horizontal', 
                            position:'top-left',
                            padding: (0,0,0,0),
                            margin: (0,0,0,0),
                            backgroundColor: 'rgba(60, 60, 60, 0)'
  }});


base_panel.add(panel_buttons)
          .add(panel);
Map.add(base_panel);
  
//3.3) Create variable for additional text and separators

//This creates another panel to house a line separator and instructions for the user

  
var thumb_panel = ui.Panel({
  widgets:[ui.Label({
    style: {fontWeight: 'bold',  
    backgroundColor: 'rgba(242,242,242, 0)'
    }
  })],
  style: {
    fontWeight: 'bold',  
    backgroundColor: 'rgba(242,242,242, 0)'}})

//3.4) Add our main panel to the root of our GUI


///////////////////////////////////////////////////////////////
//          4) Gather user inputs                            //
///////////////////////////////////////////////////////////////

var start_asterisk = ui.Label({value: '* ', 
                               style: {color: '#ff0000', 
                                       fontSize: '11px',  
                                       fontWeight: '500', 
                                       margin: '8px 8px 8px 0px', 
                                       backgroundColor: 'rgba(0,0,0,0.0)'}});

var startLabel = ui.Label({value: 'Start Date', 
                           style: {color: '292929', 
                                   fontSize: '11px', 
                                   fontWeight: '500',
                                   margin: '8px 0px 8px 8px',
                                   backgroundColor: 'rgba(0,0,0,0.0)'}});
var startDate = null;
var start_textBox = ui.Textbox({placeholder: 'YYYY-MM-DD',
                                onChange: function(startMDY) {
                                startDate = startMDY},
                                style: {fontSize: '11px',  
                                        fontWeight: '500', 
                                        width: '150px',
                                        margin: '0px 0px 0px 28px'}
})
var startPanel = ui.Panel({widgets: [startLabel, start_asterisk, start_textBox],
                           layout: ui.Panel.Layout.flow('horizontal'),
                           style: {stretch: 'horizontal', 
                                   position: 'bottom-left', 
                                   padding: '4px',
                                   backgroundColor: 'rgba(0,0,0,0.0)'  }});
 
var end_asterisk = ui.Label({value: '* ', 
                               style: {color: '#ff0000', 
                                       fontSize: '11px',  
                                       fontWeight: '500', 
                                       margin: '8px 8px 8px 0px', 
                                       backgroundColor: 'rgba(0,0,0,0.0)'}});
                                       
var endLabel = ui.Label({value: 'End Date', 
                         style: {color: '#292929', 
                                 fontSize: '11px',  
                                 fontWeight: '500', 
                                 margin: '8px 0px 8px 8px', 
                                 backgroundColor: 'rgba(0,0,0,0.0)'}});
var endDate = null;
var end_textBox = ui.Textbox({
  placeholder: 'YYYY-MM-DD',
  onChange: function(endMDY) {endDate = endMDY},
                              style: {fontSize: '11px',  
                              fontWeight: '500', 
                              width: '150px',
                              margin: '0px 0px 0px 33px'}
})
var endPanel = ui.Panel({widgets: [endLabel, end_asterisk, end_textBox],
                        layout: ui.Panel.Layout.flow('horizontal'),
                         style: {stretch: 'horizontal', 
                         position: 'bottom-left', 
                         padding: '4px',
                         backgroundColor: 'rgba(0,0,0,0.0)'  }});

var radiusLabel = ui.Label({value: 'Radius (meters):', 
                           style: {color: '#292929', 
                                   fontSize: '11px',  
                                   fontWeight: '500', 
                                   backgroundColor: 'rgba(0,0,0,0.0)'}});
var radiusValue = 1000;
var radius_textBox = ui.Textbox({
  placeholder: '1000',
  onChange: function(radiusInput) {
  radiusValue = radiusInput},
  style: {fontSize: '11px',  fontWeight: '500', width: '150px', margin: '1px'}
})
var radiusPanel = ui.Panel({widgets: [radiusLabel, radius_textBox],
                            layout: ui.Panel.Layout.flow('horizontal'),
                            style: {stretch: 'horizontal', position: 'bottom-left', padding: '4px',
                            backgroundColor: 'rgba(0,0,0,0.0)'  }});
  
start_textBox.size = "5";
panel.add(startPanel)
     .add(endPanel)
     .add(radiusPanel);
     

///////////////////////////////////////////////////////////////
//          5) Create colormap for each band                 //
///////////////////////////////////////////////////////////////
//Set Subheading for each variable

function makeColormap (imageParam) {
  var lon = ee.Image.pixelLonLat().select('longitude');
  var gradient = lon.multiply((imageParam.max-imageParam.min)/100.0).add(imageParam.min);
  var legendImage = gradient.visualize(imageParam);
  
  var thumb = ui.Thumbnail({
    image: legendImage, 
    params: {bbox:'0,0,100,8', dimensions:'256x20'},  
    style: {position: 'bottom-center',
            backgroundColor: 'rgba(0, 0, 0, 0)',
            margin: '0px'
    }
  });
  var panel2 = ui.Panel({
    widgets: [
      ui.Label(imageParam.min,
              {color: '#292929', 
               fontSize: '11px',  
               margin: '0px', 
               fontWeight: '500', 
               backgroundColor: 'rgba(0, 0, 0, 0)'}),
      ui.Label({style: {stretch: 'horizontal', 
                        margin: '0px', 
                        backgroundColor: 'rgba(0, 0, 0, 0)'}}), 
      ui.Label(imageParam.max,{color: '#292929', 
                               fontSize: '11px',  
                               margin: '0px', 
                               fontWeight: '500', 
                               backgroundColor: 'rgba(0, 0, 0, 0)'}),
    ],
    layout: ui.Panel.Layout.flow('horizontal'),
    style: {stretch: 'horizontal', 
            maxWidth: '270px', 
            padding: '0px 0px 0px 0px', 
            margin: '0px', 
            backgroundColor: 'rgba(0, 0, 0, 0)'}
  });
  
  return ui.Panel({style:{backgroundColor: 'rgba(0, 0, 0, 0)',padding:'0px'}}).add(thumb).add(panel2);
}
       
function setColormap(){

  var lstParams = {
  min: -10,
  max: 30,
  palette: ['30638E','003D5B','00798C','EDAE49','D1495B']}
  
  var ndviParams = {
  min: -1, 
  max: 1, 
  palette: ['blue', 'white', 'green']}
  
  var soilMoistureParams = {
  min: 0.0,
  max: 1.0,
  palette: ['A67C00', 'FFE625', 'C2E5D3', '90DCD0',
              '2FBDBD', '0C9BBD', '068682']}
  
  panel.remove(thumb_panel)
  panel.add(thumb_panel)
  thumb_panel.clear()
  if (graphSelect.getValue() == lst_select){
    thumb_panel.add(makeColormap (lstParams));
  }
  else if (graphSelect.getValue() == ndvi_select){
    thumb_panel.add(makeColormap (ndviParams));
  }
  else if (graphSelect.getValue() == soil_select){
    thumb_panel.add(makeColormap (soilMoistureParams));
  }
  else {
    null
}
}

///////////////////////////////////////////////////////////////
//          7) Display chart                                 //
///////////////////////////////////////////////////////////////
// Function to cloud mask from the pixel_qa band of Landsat 8 SR data.
var maskL8sr = function(image) {
  // Bit 0 - Fill
  // Bit 1 - Dilated Cloud
  // Bit 2 - Cirrus
  // Bit 3 - Cloud
  // Bit 4 - Cloud Shadow
  var qaMask = image.select('QA_PIXEL').bitwiseAnd(parseInt('11111', 2)).eq(0);
  var saturationMask = image.select('QA_RADSAT').eq(0);

  // Replace the original bands with the scaled ones and apply the masks.
  return image
    .updateMask(qaMask)
    .updateMask(saturationMask);
};

// Function to add NDVI, time, and constant variables to Landsat 8 imagery.
var l_addVariables = function(image) {
  return image
  // Add an NDVI band.
  .addBands(image.normalizedDifference(['nearIR', 'red']).rename('NDVI'))
  // Add a constant band.
  .addBands(ee.Image.constant(1));
};
// Remove clouds, add variables and filter to the area of interest.
function chart_image(selected_layer, startDate, endDate){
  if (selected_layer == soil_select){
    return smap.filterDate(startDate, endDate)
               .select(['sm_surface', 'sm_rootzone']);
    }
  else {
    return l_series.filterDate(startDate, endDate)
             .map(maskL8sr)
             .map(l_addVariables)
  }}

function chart(dataset, selected_layer){ 
  var custom_scale = 200
  if (selected_layer == lst_select){
    var band = "LST"
  }
  else if (selected_layer == ndvi_select)
  {
    band= "NDVI"
  }
  else if (selected_layer == soil_select){
    band = ['sm_surface', 'sm_rootzone']
    custom_scale = 10000
  }
  else{
    return null
  }
  
  var image = chart_image(selected_layer, startDate, endDate)
  var result =  ui.Chart.image.series({
  imageCollection: image.select(band),
  region: Map.drawingTools().layers().get(0).getEeObject(),
  reducer: ee.Reducer.mean(),
  xProperty: 'system:time_start',
  scale: custom_scale})
  
  result.style().set({
  position: 'bottom-right',
  width: '500px',
  height: '250px'
});

  var chartStyle = {
    title:'Average '+selected_layer+' over the selected region',
    hAxis: {
      title: 'Time',
      titleTextStyle: {italic: false},
    minorGridlines:{count:0},
    },
    vAxis: {
      title: selected_layer,
      titleTextStyle: {italic: false},
    minorGridlines:{count:0},
      format: 'short',
    },
    series: {
      0: {lineWidth: 0, pointSize: 3},
      1: {lineWidth: 1, lineDashStyle: [2, 2]},
    },
    // chartArea: {backgroundColor: 'EBEBEB'},
    dataOpacity: '0.8',
    titleTextStyle: {italic: false, bold: true},
    legend:{textStyle: {italic: false, bold: false}},
  };
  result.setOptions(chartStyle);
  
  Map.add(result)
}

///////////////////////////////////////////////////////////////
//          8) Create dropdown to select layer               //
///////////////////////////////////////////////////////////////
//Add a panel to hold graphs within main panel

//Create key of items for dropdown
var tc_select  = 'True Color';
var lst_select = 'LST (Celcius)';
var ndvi_select= 'NDVI';
var soil_select = 'Soil Moisture (m^3/m^3)';
var none_select = 'None';

var smap_warning_style = {fontSize: '11px',
    fontWeight: '500',
      margin: '0px 0px 0px 8px',
      color: 'red',
      backgroundColor: 'rgba(0,0,0,0)'
    }

var smap_warning = ui.Label(
  'Warning: (End Date - Start Date) should be set < 6 months as SMAP data is computationally expensive',
    smap_warning_style);

//Construct Dropdown
var layer = null
var graphSelect = ui.Select({
  items:[tc_select,lst_select,ndvi_select,soil_select,none_select],
  placeholder:'Choose layer',
  onChange: function(selected) {
                                panel.remove(thumb_panel)
                                panel.remove(smap_warning)
                                if (selected == soil_select){
                                  panel.add(smap_warning)
                                }
  }
})

function displayLayer(selectedlayer)
{
    Map.clear()
    Map.setControlVisibility(true, true, false, true, true, false)
    Map.add(base_panel)
    // panel.remove(smap_warning)
    var image = null;
    if (graphSelect.getValue()==none_select){
      null
    }
    else if (graphSelect.getValue()==soil_select){
      setColormap()
      image = smap_image(startDate, endDate,radiusValue);
      smap_display(image,graphSelect.getValue(),radiusValue);
      chart(image,graphSelect.getValue())
    }
    else{
      setColormap()
      image = l_image(startDate, endDate, radiusValue);
      l_display(image,graphSelect.getValue(),radiusValue)
      chart(image,graphSelect.getValue())
    }}

    
var sayGo = ui.Button({label: "Go",onClick: displayLayer});

var selectGo = ui.Panel({widgets: [graphSelect, sayGo],
                            layout: ui.Panel.Layout.flow('horizontal'),
                            style: {stretch: 'horizontal', position: 'bottom-left', padding: '4px',
                            backgroundColor: 'rgba(0,0,0,0.0)'  }});

panel.add(selectGo)

