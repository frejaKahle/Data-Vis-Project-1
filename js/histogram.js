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
class Histogram {

    constructor(_config, _data, _acc) {
      this.config = {
        parentElement: _config.parentElement,
        color: _config.color,
        dataTypeDisplayName: _config.dataTypeDisplayName,
        containerWidth: _config.containerWidth || 500,
        containerHeight: _config.containerHeight || 140,
        margin: {top: 20, right: 20, bottom: 20, left: 20},
        tooltipPadding: _config.tooltipPadding || 15,
        bins: _config.bins || 30,
        cutOutliers: _config.cutOutliers || 0,
        dataPrefix: _config.dataPrefix || '',
        dataSuffix: _config.dataSuffix || ''
      }
  
      this.data = _data;
      this.accessor = _acc;

      this.highlighting = [];
      this.highlighted = [];
      this.highlight = d => null;

      this.initVis();
    }
  
    initVis() {
        //setting up the chart- things that won't need to update on user actions
  
        //console.log("Let's draw a chart!!");
  
        // I recommend avoiding simply using the this keyword within complex class code
        // involving SVG elements because the scope of this will change and it will cause
        // undesirable side-effects. Instead, we recommend creating another variable at
        // the start of each function to store the this-accessor
        let vis = this; 
    
  
        // Width and height as the inner dimensions of the chart area- as before
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
  
        // Define 'svg' as a child-element (g) from the drawing area and include spaces
        // Add <svg> element (drawing space)
        vis.svg = d3.select(vis.config.parentElement)
        .attr('viewBox',`0 0 ${vis.config.containerWidth} ${vis.config.containerHeight}`)
        .attr('width','100%');
  
        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left}, ${vis.config.margin.top})`);
  
        // Initialize linear and ordinal scales (input domain and output range)
        vis.xScale = d3.scaleLinear()
          .domain(d3.extent(vis.data, vis.accessor))
          .range([0, vis.width]).nice();
        
        var histogram = d3.histogram()
            .value(vis.accessor)
            .domain(vis.xScale.domain())
            .thresholds(vis.xScale.ticks(vis.config.bins));
        
        vis.bins = histogram(data);
  
        vis.yScale = d3.scaleLinear()
          .domain([0,d3.max(vis.bins, d => d.length)]) 
          .range([3,vis.height]);

  
        // Initialize axes
        vis.xAxis = d3.axisBottom(vis.xScale).tickFormat(e => `${vis.config.dataPrefix}${e}${vis.config.dataSuffix}`);
        vis.yAxis = d3.axisLeft(vis.yScale);

        // Draw the axis
        vis.xAxisGroup = vis.chart.append('g')
        .attr('class', 'axis x-axis') 
        .attr('transform', `translate(0, ${vis.height})`)
        .call(vis.xAxis);

        vis.yAxisGroup = vis.chart.append('g')
        .attr('class', 'axis y-axis')
        .call(vis.yAxis);
        
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
        
        
        vis.updateVis(); //call updateVis() at the end - we aren't using this yet. 
    }
updateVis() {
    let vis = this;
    let cData = vis.data;
    if (vis.config.cutOutliers) {
        let m = d3.mean(cData,vis.accessor);
        let s = d3.deviation(cData,vis.accessor);
        cData = cData.filter(d => Math.abs(vis.accessor(d) - m) <= (vis.config.cutOutliers * s))
      }
    console.log(cData);
    if (vis.highlighted.length > 0) {
        cData = cData.filter(d => vis.highlighted.includes(d.cnty_fips))
    }

    vis.xScale.domain(d3.extent(cData, vis.accessor)).range([0, vis.width]).nice();
        
    var histogram = d3.histogram()
        .value(vis.accessor)
        .domain(vis.xScale.domain())
        .thresholds(vis.xScale.ticks(vis.config.bins));
    
    vis.bins = histogram(data);
  
    vis.yScale.domain([0,d3.max(vis.bins, d => d.length)]);
    
    vis.chart.select('.axis.x-axis').call(vis.xAxis);
    vis.chart.select('.axis.y-axis').call(vis.yAxis);

    vis.rects = vis.chart.selectAll('rect')
        .filter(':not(#hlbtn)')
        .data(vis.bins)
        .join('rect')
        .attr('fill', vis.config.color )
        .attr('stroke', '#ddd')
        .attr('stroke-width', 1)
        .attr('x', 1)
        .attr('width', d => vis.xScale(d.x1) - vis.xScale(d.x0) )
        .attr("transform", d => `translate(${vis.xScale(d.x0)}, ${vis.height - vis.yScale(d.length)})`)
        .attr('height', d => vis.yScale(d.length));

    vis.rects
        .on('mousedown', (event,d) => {
            console.log(d);
            if(d.length > 0 && vis.highlighting.includes(d[0].cnty_fips)) {
                ++unhighlighting;
                let aid = [];
                d.forEach(c => {aid.push(c.cnty_fips)});
                vis.highlighting = vis.highlighting.filter(e => !aid.includes(e));
                event.srcElement.classList.remove('highlighted');
            }
            else {
                d.forEach(e => vis.highlighting.push(e.cnty_fips));
                event.srcElement.classList.add('highlighted');
            }
        })
        .on('mousemove', (event,d) => {
            //console.log("mouse over! ");
            //console.log(event);
            //console.log(d);
        if (mouseDown == 1) {
            let aid = [];
            d.forEach(c => {aid.push(c.cnty_fips)});
            if (unhighlighting == 1) {
                vis.highlighting = vis.highlighting.filter(e => !aid.includes(e));
                event.srcElement.classList.remove('highlighted');
            }
            else if (d.length > 0 && !vis.highlighting.includes(d[0].cnty_fips)){
                
                d.forEach(e => vis.highlighting.push(e.cnty_fips));
                event.srcElement.classList.add('highlighted');
            }
        }
        d3.select('#tooltip')
            .style('display', 'block')
            .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')   
            .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
            .html(`
            <ul>
                <li>Range: ${vis.config.dataPrefix}${d.x0}${vis.config.dataSuffix} - ${vis.config.dataPrefix}${d.x1}${vis.config.dataSuffix}</li>
                <li>${d.length} count${d.length == 1 ? 'y' : 'ies'}</li>
            </ul>
            `);
        })
        .on('mouseleave', () => {
        d3.select('#tooltip').style('display', 'none');
        });
    }
}