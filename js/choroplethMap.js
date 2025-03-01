var mouseDown = 0;
var unhighlighting = 0;
document.body.onmousedown = function() { 
    ++mouseDown;
  }
  document.body.onmouseup = function() {
    --mouseDown;
    if (unhighlighting ==1) {
        unhighlighting = 0;
    }
  }
class ChoroplethMap {

  /**
   * Class constructor with basic configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data, _acc) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 500,
      containerHeight: _config.containerHeight || 400,
      margin: _config.margin || {top: 0, right: 0, bottom: 0, left: 0},
      tooltipPadding: 10,
      legendBottom: 50,
      legendLeft: 50,
      legendRectHeight: 12, 
      legendRectWidth: 150,
      dataDisplayName: _config.dataDisplayName,
      dataPrefix: _config.dataPrefix || '',
      startColor: _config.startColor || '#cfe2f2',
      endColor: _config.endColor || '#0d306b',
      cutOutliers: _config.cutOutliers || 0
    }
    this.data = _data;
    this.accessor = _acc;
  
    this.highlighting = [];
    this.highlighted = [];
    this.highlight = d => null;

    this.initVis();
  }
  
  /**
   * We initialize scales/axes and append static elements, such as axis titles.
   */
  initVis() {
    let vis = this;

    // Calculate inner chart size. Margin specifies the space around the actual chart.
    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    // Define size of SVG drawing area
    vis.svg = d3.select(vis.config.parentElement).append('svg')
      .attr('viewBox',`0 0 ${vis.config.containerWidth} ${vis.config.containerHeight}`)
      .attr('width','100%');


    // Append group element that will contain our actual chart 
    // and position it according to the given margin config
    vis.chart = vis.svg.append('g')
        .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    // Initialize projection and path generator
    vis.projection = d3.geoAlbersUsa()
    .translate([vis.width /2 , vis.height / 2])
    .scale(vis.width);

    vis.geoPath = d3.geoPath().projection(vis.projection);

    vis.colorScale = d3.scaleLinear()
        .range([vis.config.startColor, vis.config.endColor])
        .interpolate(d3.interpolateHcl);


    // Initialize gradient that we will later use for the legend
    vis.linearGradient = vis.svg.append('defs').append('linearGradient')
        .attr("id", `legend-gradient-${vis.config.parentElement.slice(1)}`);

    // Append legend
    vis.legend = vis.chart.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${vis.config.legendLeft},${vis.height - vis.config.legendBottom})`);
    
    vis.legendRect = vis.legend.append('rect')
        .attr('width', vis.config.legendRectWidth)
        .attr('height', vis.config.legendRectHeight);

    vis.legendTitle = vis.legend.append('text')
        .attr('class', 'legend-title')
        .attr('dy', '.35em')
        .attr('font-size',16)
        .attr('y', -10)
        .text(vis.config.dataDisplayName)
        .attr('fill','#ddd')
    vis.chart.append('text')
        .attr('x',800-vis.config.margin.right)
        .attr('y', 57)
        .attr('text-anchor','middle')
        .attr('fill','#ddd')
        .attr('font-size',20)
        .attr('alignment-baseline','middle')
        .text('Confirm Selection');
    vis.hlbtn = vis.chart.append('rect')
        .attr('fill','#ffffff05')
        .attr('width',200)
        .attr('height',100)
        .attr('id','hlbtn')
        .attr('x',700 - vis.config.margin.right -1)
        .attr('stroke','#ddd')
        .attr('stroke-width',2)
        .on('click', event => vis.highlight(vis));
    vis.updateVis();
  }

  updateVis() {
    let vis = this;
    let cData = vis.data.objects.counties.geometries;
    if (vis.config.cutOutliers) {
      let m = d3.mean(cData,vis.accessor);
      let s = d3.deviation(cData,vis.accessor);
      cData = cData.filter(d => Math.abs(vis.accessor(d) - m) <= (vis.config.cutOutliers * s))
    }
    if(vis.highlighted.length > 0) {
      cData = cData.filter(d => vis.highlighted.includes(d.id));
    }
    const dataExtent = d3.extent(cData, vis.accessor);
    
    // Update color scale
    vis.colorScale.domain(dataExtent);

    // Define begin and end of the color gradient (legend)
    vis.legendStops = [
      { color: vis.config.startColor, value: dataExtent[0], offset: 0},
      { color: vis.config.endColor, value: dataExtent[1], offset: 100},
    ];

    vis.renderVis();
  }


  renderVis() {
    let vis = this;

    // Convert compressed TopoJSON to GeoJSON format
    const counties = topojson.feature(vis.data, vis.data.objects.counties)

    // Defines the scale of the projection so that the geometry fits within the SVG area
    vis.projection.fitSize([vis.width, vis.height], counties);

    // Append world map
    const countyPath = vis.chart.selectAll('.county')
        .data(counties.features)
      .join('path')
        .attr('class', 'county')
        .attr('d', vis.geoPath)
        .attr('stroke', '#ddd')
        .attr('stroke-width',d => 0.1)
        .attr('fill', d => {
          if (vis.accessor(d) && vis.accessor(d) <= vis.colorScale.domain()[1] && vis.accessor(d) >= vis.colorScale.domain()[0] && (vis.highlighted.length > 0 ? vis.highlighted.includes(d.id) : true))
            {
            return vis.colorScale(vis.accessor(d));
          } else {
            return 'url(#lightstripe)';
          }
        });

    countyPath
        .on('mousedown', (event,d) => {
          if(vis.highlighting.includes(d.id)) {
              ++unhighlighting;
              vis.highlighting = vis.highlighting.filter(e => e != d.id)
              event.srcElement.classList.remove('highlighted');
          }
          else {
              vis.highlighting.push(d.id);
              event.srcElement.classList.add('highlighted');
          }
        })  
        .on('mousemove', (event,d) => {
          if (mouseDown == 1) {
            if (unhighlighting == 1) {
                vis.highlighting = vis.highlighting.filter(e => e != d.id);
                event.srcElement.classList.remove('highlighted');
            }
            else if (!vis.highlighting.includes(d.id)){
                vis.highlighting.push(d.id);
                event.srcElement.classList.add('highlighted');
            }
          }
          const point = vis.accessor(d) ? `<strong>${vis.config.dataPrefix}${vis.accessor(d)}</strong> ${vis.config.dataDisplayName}` : 'No data available'; 
          d3.select('#tooltip')
            .style('display', 'block')
            .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')   
            .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
            .html(`
              <div class="tooltip-title">${d.properties.name}</div>
              <div>${point}</div>
            `);
        })
        .on('mouseleave', () => {
          d3.select('#tooltip').style('display', 'none');
        });

    // Add legend labels
    vis.legend.selectAll('.legend-label')
        .data(vis.legendStops)
      .join('text')
        .attr('class', 'legend-label')
        .attr('text-anchor', 'middle')
        .attr('dy', '.35em')
        .attr('y', 20)
        .attr('fill','#ddd')
        .attr('font-size',12)
        .attr('x', (d,index) => {
          return index == 0 ? 0 : vis.config.legendRectWidth;
        })
        .text(d => Math.round(d.value * 10 ) / 10);

    // Update gradient for legend
    vis.linearGradient.selectAll('stop')
        .data(vis.legendStops)
      .join('stop')
        .attr('offset', d => d.offset)
        .attr('stop-color', d => d.color);

    vis.legendRect.attr('fill', `url(#legend-gradient-${vis.config.parentElement.slice(1)})`);
  }
}