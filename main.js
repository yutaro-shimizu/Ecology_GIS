// 気温　temperature
// 積雪深　snow depth (降雪量とは別に)
// 植被率　coverage
// 樹種名　name of tree
// 基質の状態　substrate

///////////////////////////////////////////////////////////////
//                    1) Import Layers of Interest           //
///////////////////////////////////////////////////////////////
var l8 = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
var smap = ee.ImageCollection('NASA/SMAP/SPL4SMGP/007');

///////////////////////////////////////////////////////////////
//      2) Begin setting up map appearance and app layers   //
///////////////////////////////////////////////////////////////
Map.setOptions('Satellite') //Set up a satellite background
Map.setControlVisibility(false)

//Change style of cursor to 'crosshair'
Map.style().set('cursor', 'crosshair');

Map.setCenter(138.325000, 36.081111,12); // Center on K.Yamashita plot.

//Set up layers for the images of interest
//Apply scaling factors to Landsat 8 images
function applyScaleFactors(input) {
  var opticalBands = input.select('SR_B.').multiply(0.0000275).add(-0.2);
  var thermalBands = input.select('ST_B.*').multiply(0.00341802).add(149.0);
  return input.addBands(opticalBands, null, true)
              .addBands(thermalBands, null, true);
}
var l8 = l8.map(applyScaleFactors);

function l8_image(startDate, endDate,cloudCover){
  return ee.Image(
  l8.filterBounds(geometry)
    .filterDate(startDate,endDate)
    .filter(ee.Filter.lessThanOrEquals('CLOUD_COVER', cloudCover))
    .first())}

//True color image
function l8_display(image, selectedlayer){
var truecolor = image.select('SR_B4', 'SR_B3', 'SR_B2')
var truecolorPalette = {
  min: 0.0,
  max: 0.3,
}

//Land Surface Temperature
var lst = image.select('ST_B10')
var lstParams = {
  min: 270,
  max: 310,
  palette: ['30638E','003D5B','00798C','EDAE49','D1495B']
};

//Vegetation Index
var ndvi = image.normalizedDifference(['SR_B5','SR_B4']);
var ndviParams = {
  min: -1, 
  max: 1, 
  palette: ['blue', 'white', 'green']}
  
var truecolor_layer = ui.Map.Layer(truecolor, truecolorPalette, 'True Color');
var lst_layer = ui.Map.Layer(lst, lstParams, 'LST');
var ndvi_layer = ui.Map.Layer(ndvi, ndviParams, 'NDVI');

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
  smap.filterBounds(geometry)
    .filterDate(startDate, endDate)
    .first()
)}

function smap_display(image){
var soilMoisture = image.select('sm_surface');
var soilMoistureParams = {
  min: 0.0,
  max: 0.7,
  palette: ['A67C00', 'FFE625', 'C2E5D3', '90DCD0',
            '2FBDBD', '0C9BBD', '068682'],
};

//2.3) Create variables for GUI layers for each layer
//We set each layer to "false" so the user can turn them on later

var soilmoisture_layer = ui.Map.Layer(soilMoisture, soilMoistureParams, 'Soil Moisture');

Map.add(soilmoisture_layer)}

///////////////////////////////////////////////////////////////
//      3) Set up panels and widgets for display             //
///////////////////////////////////////////////////////////////

//3.1) Set up title and summary widgets

//App title
var header = ui.Label('Forest Microclimate Explorer', 
                      {color: 'FFF', fontSize: '16px', backgroundColor: 'rgba(0,0,0,0.0)',  margin: '3px 4px 2px 4px'})

//App summary
var text = ui.Label(
  'This website maps key microclimate indicators derived from Landsat 8 and SMAP Global Soil Moisture Data. ' +
  'Use the tools below to explore changes in land surface temperature (LST), normalized difference vegetation index (NDVI) and soil moisture since mid-2010s.',
    {fontSize: '15px',
      position: 'top-left'
    });

//3.2) Create a panel to hold text
var panel = ui.Panel({
  widgets:[header,
  // text
  ],//Adds header and text
  style:{margin: '2 px',
        position:'top-left',
        backgroundColor: 'rgba(60, 60, 60, 0.8)'
  }});
  
//3.3) Create variable for additional text and separators

//This creates another panel to house a line separator and instructions for the user

  
var thumb_panel = ui.Panel({
  widgets:[ui.Label({
    style: {fontWeight: 'bold',  
    position:'top-left',
    backgroundColor: 'rgba(0, 0, 0, 0)'
    }
  })],
  style: {fontWeight: 'bold',  
    position:'top-left',
    backgroundColor: 'rgba(0,0,0, 0)'}})

//3.4) Add our main panel to the root of our GUI
Map.add(panel)

///////////////////////////////////////////////////////////////
//          5) Gather user inputs                            //
///////////////////////////////////////////////////////////////


var startLabel = ui.Label({value: 'Start Date*:', style: {color: 'FFF', fontSize: '11px',  fontWeight: '500', backgroundColor: 'rgba(0,0,0,0.0)'}});
var startDate = null;
var start_textBox = ui.Textbox({
  placeholder: 'YYYY-MM-DD',
  onChange: function(startMDY) {
 startDate = startMDY},
  style: {fontSize: '11px',  fontWeight: '500', margin: '1px'}
})
var startPanel = ui.Panel({widgets: [startLabel, start_textBox],
                            layout: ui.Panel.Layout.flow('horizontal'),
                            style: {stretch: 'horizontal', position: 'bottom-left', padding: '4px',
                            backgroundColor: 'rgba(0,0,0,0.0)'  }});
 
var endLabel = ui.Label({value: 'End Date*:', style: {color: 'FFF', fontSize: '11px',  fontWeight: '500', backgroundColor: 'rgba(0,0,0,0.0)'}});
var endDate = null;
var end_textBox = ui.Textbox({
  placeholder: 'YYYY-MM-DD',
  onChange: function(endMDY) {
 endDate = endMDY},
  style: {fontSize: '11px',  fontWeight: '500', margin: '1px'}
})
var endPanel = ui.Panel({widgets: [endLabel, end_textBox],
                            layout: ui.Panel.Layout.flow('horizontal'),
                            style: {stretch: 'horizontal', position: 'bottom-left', padding: '4px',
                            backgroundColor: 'rgba(0,0,0,0.0)'  }});
 


var cloudLabel = ui.Label({value: 'Cloud Cover (%):', style: {color: 'FFF', fontSize: '11px',  fontWeight: '500', backgroundColor: 'rgba(0,0,0,0.0)'}});
var cloudPercentage = 30;
var cloud_textBox = ui.Textbox({
  placeholder: 'ex., 20',
  onChange: function(cloud) {
  cloudPercentage = cloudPercentage},
  style: {fontSize: '11px',  fontWeight: '500', margin: '1px'}
})
var cloudPanel = ui.Panel({widgets: [cloudLabel, cloud_textBox],
                            layout: ui.Panel.Layout.flow('horizontal'),
                            style: {stretch: 'horizontal', position: 'bottom-left', padding: '4px',
                            backgroundColor: 'rgba(0,0,0,0.0)'  }});
  
start_textBox.size = "5";
panel.add(startPanel)
     .add(endPanel)
     .add(cloudPanel);
     

///////////////////////////////////////////////////////////////
//          6) Create date slider to define duration         //
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
            backgroundColor: 'rgba(0, 0, 0, 0)'}
  });
  var panel2 = ui.Panel({
    widgets: [
      ui.Label(imageParam.min), 
      ui.Label({style: {stretch: 'horizontal',backgroundColor: 'rgba(0, 0, 0, 0)'}}), 
      ui.Label(imageParam.max)
    ],
    layout: ui.Panel.Layout.flow('horizontal'),
    style: {stretch: 'horizontal', 
            maxWidth: '270px', 
            padding: '0px 0px 0px 0px', 
            backgroundColor: 'rgba(0, 0, 0, 0)'}
  });
  
  return ui.Panel().add(panel2).add(thumb);
}
       
function setColormap(){

  var lstParams = {
  min: 270,
  max: 310,
  palette: ['30638E','003D5B','00798C','EDAE49','D1495B']}
  
  var ndviParams = {
  min: -1, 
  max: 1, 
  palette: ['blue', 'white', 'green']}
  
  var soilMoistureParams = {
  min: 0.0,
  max: 28.0,
  palette: ['0300ff', '418504', 'efff07', 'efff07', 'ff0303']}
  
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
//          4) Display chart                                 //
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
var l8_addVariables = function(image) {
  return image
  // Add an NDVI band.
  .addBands(image.normalizedDifference(['SR_B5', 'SR_B4']).rename('NDVI'))
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
    return l8.filterBounds(geometry)
             .filterDate(startDate, endDate)
             .map(maskL8sr)
             .map(l8_addVariables)
  }}

function chart(dataset, selected_layer){ 
  var custom_scale = 200
  if (selected_layer == lst_select){
    var band = "ST_B10"
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
  region: geometry,
  reducer: ee.Reducer.mean(),
  xProperty: 'system:time_start',
  scale: custom_scale})
  
  result.style().set({
  position: 'bottom-right',
  width: '500px',
  height: '300px'
});

  var chartStyle = {
    title: 'Mean '+selected_layer+ ' over the selected region',
    hAxis: {
      title: 'Time',
      titleTextStyle: {italic: false, bold: true},
      gridlines: {color: 'FFFFFF'}
    },
    vAxis: {
      title: selected_layer,
      titleTextStyle: {italic: false, bold: true},
      gridlines: {color: 'FFFFFF'},
      format: 'short',
      baselineColor: 'FFFFFF'
    },
    series: {
      0: {lineWidth: 1, pointSize: 3},
      1: {lineWidth: 1, lineDashStyle: [2, 2]}
    },
  };
  result.setOptions(chartStyle);
  
  Map.add(result)
}

///////////////////////////////////////////////////////////////
//          4) Create dropdown to select layer               //
///////////////////////////////////////////////////////////////
//Add a panel to hold graphs within main panel

//Create key of items for dropdown
var tc_select  = 'True Color';
var lst_select = 'LST';
var ndvi_select= 'NDVI';
var soil_select = 'Soil Moisture';
var none_select = 'None';

//Construct Dropdown
var layer = null
var graphSelect = ui.Select({
  items:[tc_select,lst_select,ndvi_select,soil_select,none_select],
  placeholder:'Choose layer'})

function displayLayer(selectedlayer){
    Map.clear()
    Map.setControlVisibility(false)
    Map.add(panel)
    var image = null;
    if (graphSelect.getValue()==none_select){
      null
    }
    else if (graphSelect.getValue()==soil_select){
      setColormap()
      image = smap_image(startDate, endDate);
      smap_display(image,graphSelect.getValue());
      chart(image,graphSelect.getValue())
    }
    else{
      setColormap()
      image = l8_image(startDate, endDate, cloudPercentage);
      l8_display(image,graphSelect.getValue())
      chart(image,graphSelect.getValue())
    }}
    
var sayGo = ui.Button({label: "Go",onClick: displayLayer});
panel.add(graphSelect)
     .add(sayGo)
     .add(thumb_panel);


