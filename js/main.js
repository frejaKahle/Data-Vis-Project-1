console.log("Hello world");
let data, timelineCircles;

const mhiColor = '#80b810';
const elthspColor = '#ee4810';

function equ (x) {
  return 420000 / (x - 23001)
}
Promise.all([
  d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json'),
  d3.csv('data/national_health_data_2024.csv')])
  .then(_data => {
  	console.log('Data loading complete. Work with dataset.');
  	const geoData = _data[0];
    data = _data[1];
    console.log(_data);

    data.forEach(d => {
      d.mhi = parseFloat(d.median_household_income)
      d.elthsp = parseFloat(d.education_less_than_high_school_percent)
    });
    data = data.filter(d => d.mhi > 0);

    geoData.objects.counties.geometries.forEach(d => {
      for (let i = 0; i < data.length; i++) {
        if (d.id == data[i].cnty_fips) {
          d.properties.mhi = data[i].mhi;
          d.properties.elthsp = data[i].elthsp;
        }
      }
    });

    const histElthsp = new Histogram({
			'parentElement': '#hist-elthsp',
      'dataTypeDisplayName':'Percentage of Population with less than high school degree',
      'color': elthspColor,
			'containerHeight': 500,
			'containerWidth': 900,
      'bins': 30,
      'dataSuffix' : '%'
		}, data, d => d.elthsp);
    const histMhi = new Histogram({
			'parentElement': '#hist-mhi',
      'dataTypeDisplayName':'Median Individual Income',
      'color': mhiColor,
			'containerHeight': 500,
			'containerWidth': 900,
      'bins': 30,
      'dataPrefix' : '$'
		}, data, d => d.mhi);

  	// Create an instance (for example in main.js)
		const scatterPoints = new ScatterPoints({
			'parentElement': '#chart',
			'containerHeight': 500,
			'containerWidth': 900
		}, data, equ);

    const choroplethMapElthsp = new ChoroplethMap({ 
      parentElement: '#map-elthsp',
			'containerHeight': 700,
			'containerWidth': 900,
      'startColor':'#555',
      'endColor': elthspColor,
      'dataDisplayName':'Pop. % with less than high school degree'
    }, geoData, d => d.properties.elthsp);

    const choroplethMapMhi = new ChoroplethMap({ 
      parentElement: '#map-mhi',
			'containerHeight': 700,
			'containerWidth': 900,
      'dataDisplayName':'Median Household Income',
      'startColor':'#555',
      'endColor': mhiColor,
      'dataPrefix':'$'
    }, geoData, d => d.properties.mhi);




    const cutOutliersSlider = document.getElementById('cutOutliersSlider');
    cutOutliersSlider.value = cutOutliersSlider.max;
    cutOutliersSlider.onmouseup = function() {
      [histMhi,histElthsp,choroplethMapMhi,choroplethMapElthsp].forEach(vis => {
        vis.config.cutOutliers = this.value < this.max ? this.value : false;
        vis.updateVis();
      });
    }
    cutOutliersSlider.onmousemove = function() {
      d3.select('#tooltip')
        .style('display', 'block')
        .style('position','absolute')
        .style('left', (event.pageX - 20) + 'px')  
        .style('top', (event.pageY) + 'px')
        .style('transform',' translate(-100%,-50%)') 
        .html(this.value < this.max ? `Cutting data past ${this.value} standard deviation${this.value == 1 ? '' : 's'}.` : `Not cutting data.`);
    }
    
    cutOutliersSlider.onmouseleave =  function() {
      d3.select('#tooltip').style('display', 'none').style('position',null).style('transform',null);
    }
    const dataSwitch = document.getElementById('dataSwitch');
    const switchDisp = document.getElementById('switch-disp');
    dataSwitch.onclick = function() {
      if (switchDisp.classList.contains('elthsp')) {
        switchDisp.classList.remove('elthsp');
        switchDisp.classList.add('mhi');
      }
      else {
        switchDisp.classList.remove('mhi');
        switchDisp.classList.add('elthsp');
      }
    }
    const histBinsSlider = document.getElementById('histogramBinsSlider');
    histBinsSlider.onmouseup = function () {
      [histMhi,histElthsp].forEach(hist => {
        hist.config.bins = this.value;
        hist.updateVis();
      });
    }
    histBinsSlider.onmousemove = function() {
      d3.select('#tooltip')
        .style('display', 'block')
        .style('position','absolute')
        .style('left', (event.pageX - 20) + 'px')  
        .style('top', (event.pageY) + 'px')
        .style('transform',' translate(-100%,-50%)') 
        .html(`Target number of bins: ${this.value}`);
    }
    
    histBinsSlider.onmouseleave =  function() {
      d3.select('#tooltip').style('display', 'none').style('position',null).style('transform',null);
    }
    const equSwitch = document.getElementById('equSwitch');
    const scatter = document.getElementById('chart');
    equSwitch.onclick = function () {
      if (scatter.classList.contains('hide-equ')) {
        scatter.classList.remove('hide-equ');
      }
      else {
        scatter.classList.add('hide-equ');
      }
    }



    const highlightClear = document.getElementById('highlightClear');
    highlightClear.onclick = function() {
        [scatterPoints, choroplethMapElthsp, choroplethMapMhi, histElthsp, histMhi].forEach(function(vis) {
          vis.highlighted = []; vis.updateVis();
        });
      }
    const highlightConfirmation = function(vis) {
      if (vis.highlighting.length > 0) {
        vis.highlighted = vis.highlighting;
        vis.updateVis();
        vis.chart.selectAll('rect').attr('class',null);
        [scatterPoints,histElthsp,histMhi,choroplethMapElthsp,choroplethMapMhi].filter(v => v != vis).forEach(v => {
          v.highlighted = vis.highlighting;
          v.updateVis();
          v.highlighting = [];
          v.chart.selectAll('rect').attr('class',null);
        });
        vis.highlighting = [];
    }};
    [histElthsp,histMhi,choroplethMapElthsp,choroplethMapMhi].forEach(vis => vis.highlight = highlightConfirmation);
    }).catch(error => {
    console.error('Error:');
    console.log(error);
});



/**
 * Event listener: use color legend as filter
 
d3.selectAll('.legend-btn').on('click', function() {
  console.log("button! ");
  // Toggle 'inactive' class
  d3.select(this).classed('inactive', !d3.select(this).classed('inactive'));
  
  // Check which categories are active
  let selectedCategory = [];
  d3.selectAll('.legend-btn:not(.inactive)').each(function() {
    selectedCategory.push(d3.select(this).attr('category'));
  });

  // Filter data accordingly and update vis
  timelineCircles.data = data.filter(d => selectedCategory.includes(d.category)) ;
  timelineCircles.updateVis();

});


function computeDays(disasterDate){
  	let tokens = disasterDate.split("-");

  	let year = +tokens[0];
  	let month = +tokens[1];
  	let day = +tokens[2];

    return (Date.UTC(year, month-1, day) - Date.UTC(year, 0, 0)) / 24 / 60 / 60 / 1000 ;

  }
*/