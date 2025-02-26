class ScatterPoints {

  constructor(_config, _data, _equ) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 500,
      containerHeight: _config.containerHeight || 140,
      margin: {top: 20, right: 20, bottom: 20, left: 30},
      tooltipPadding: _config.tooltipPadding || 15
    }

    this.data = _data; 
    this.equ = _equ;

    this.highlighted = [];

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
        .domain(d3.extent(data, d => d.mhi))
        .range([0, vis.width]);


      vis.yScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.elthsp)) 
        .range([vis.height,0]);

        // Initialize axes
        vis.xAxis = d3.axisBottom(vis.xScale).tickFormat(e => `$${e}`);
        vis.yAxis = d3.axisLeft(vis.yScale).tickFormat(e => `${e}%`);


        // Draw the axis
        vis.xAxisGroup = vis.chart.append('g')
          .attr('class', 'axis x-axis') 
          .attr('transform', `translate(0, ${vis.height})`)
          .call(vis.xAxis);

        vis.yAxisGroup = vis.chart.append('g')
          .attr('class', 'axis y-axis')
          .call(vis.yAxis);
        
        let arr = [];
        for (let i = 0; i < vis.width; i++) {
          let y = vis.equ(vis.xScale.invert(i));
          //console.log(y);
          if (y >= 0 && y <= 42.5) {
            arr.push([i,this.yScale(y)]);
          }
        }
        let equline = d3.line();

        vis.svg.append('path')
          .attr('d', equline(arr))
          .attr('fill', 'none')
          .attr('stroke','red')
          .attr('class','equline')
          .attr('opacity','0.7')
          .attr('stroke-width', 2)
          .attr('transform', `translate(${vis.config.margin.left}, ${vis.config.margin.top})`)
          .on('mousemove', (event,d) => {
            //console.log("mouse over! ");
            //console.log(event);
            //console.log(d);
          
          d3.select('#tooltip')
            .style('display', 'block')
            .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')   
            .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
            .html(`
              <i>f</i>(<b><i>x</i></b>) = 420000 / (<b><i>x</i></b> - 23001)
            `);
        })
        .on('mouseleave', () => {
          d3.select('#tooltip').style('display', 'none');
        });

      vis.updateVis(); //call updateVis() at the end - we aren't using this yet. 
  }


 updateVis() {
    let vis = this;

     //Add circles for each event in the data

     //TO DO- how can you change this so that it updates, based on the new data
     //  if some elements have been removed or added, we need to use 'join' rather than enter and append
      vis.circles = vis.chart.selectAll('circle')
          .data(vis.data)
          .join('circle')
         .attr('fill', '#40c8ff' )
          .attr('opacity', d => vis.highlighted.length > 0 ? vis.highlighted.includes(d.cnty_fips) ? .8 : .05 : .8)
          .attr('class', d => vis.highlighted.length > 0 ? vis.highlighted.includes(d.cnty_fips) ? 'highlighted' : '' : 'highlighted')
          .attr('stroke', "#666b")
          .attr('stroke-width', 1)
          .attr('r', 4 ) 
          .attr('cy', (d) => vis.yScale(d.elthsp) ) 
          .attr('cx',(d) =>  vis.xScale(d.mhi) );;

        vis.circles.filter('.highlighted')
          .on('mousemove', (event,d) => {
            //console.log("mouse over! ");
            //console.log(event);
            //console.log(d);
          
          d3.select('#tooltip')
            .style('display', 'block')
            .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')   
            .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
            .html(`
              <ul>
                <li>${d.display_name}</li>
                <li>${d.elthsp}% less than high school degree</li>
                <li>$${d.mhi} median income</li>
              </ul>
            `);
        })
        .on('mouseleave', () => {
          d3.select('#tooltip').style('display', 'none');
        });
         

 }

 renderVis() { 

  }



}