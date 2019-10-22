async function make_donut_chart(filename) {
  const data = await d3.csv(filename)

  var margin = {top: 10, right: 10, bottom: 10, left: 10},
      width = 600 - margin.left - margin.right,
      height = 650 - margin.top - margin.bottom + 50,
      radius = Math.min(width, height) / 2;
  var color = d3.schemePaired.slice(6);

  var pie = d3.pie()
      .value(d => d.value)
      .sort(null);

  var arc = d3.arc()
      .outerRadius(radius * 0.9)
      .innerRadius(radius * 0.5)

  var svg = d3.select("body").append("svg")
      .attr("width", width)
      .attr("height", height)
    .append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  // arc slice
  var angles = []
  var path = svg.datum(data).selectAll("path")
      .data(pie)
    .enter().append("path")
      .attr("fill", (d,i) => (color[i]) )
      .attr("d", arc)
      .each(function(d) {return this._current = d} ) // store the initial angles

  // label placement
  var label = svg.datum(data).selectAll('text')
      .data(pie)
    .enter().append('text')
      .attr('transform', d => 'translate(' + arc.centroid(d) + ')')
      .attr('dy','0.35em')
      .style('opacity', d => d.data['value']==0 ? 0 : 1)
  
  // label line 1
  label.append("tspan")
      .attr('class', 'age-group')
      .attr("x", 0)
      .attr("y", "-0.7em")
      .text(d => d.data['index'])
  
  // label line 2
  label.append("tspan")
      .attr('class', 'count')
      .attr("x", 0)
      .attr("y", "1em")
      .text(d => d.data['value'])

  // Center text
  var total = d3.sum(data.map(d => d['value']))
  svg.append('text')
      .attr('class', 'total')
      .attr('dy', '0.35em')
      .text(total) // add text to the circle.

  svg.append('text')
      .attr('class', 'chart_title')
      .attr('x', 0)
      .attr('y', -height/2+25)
      .attr('dy', '0.35em')
      .text('Age')

  d3.selectAll("input")
      .on("change", update);
    
  function update() {
    var value = this.value;
    pie.value(d => d[value]); // change the value function
    path = path.data(pie); // compute the new angles
    path.transition().duration(1000)
        .attrTween("d", arcTween); // redraw the arcs
    var label = svg.datum(data).selectAll('text')
        .data(pie)
    label.attr('transform', d => 'translate(' + arc.centroid(d) + ')')
        .attr('dy','0.35em')
        .style('opacity', 0) // make text invisible
      .transition().ease(d3.easeSin).duration(1000) // and fade in if needed
        .style('opacity', d => d.data[value]==0 ? 0 : 1)
    label.selectAll('.count')
        .text(d => d.data[value])
    svg.selectAll('.total')
        .text(d3.sum(data.map(d => d[value])))
      // .transition()
      //   .duration(750) // fade out time
      //   .on('start', function crossfade() {
      //     var t = d3.active(this)
      //         .style("opacity", 0)
      //         .remove()
      //     svg.append("text")
      //         .attr('class', 'total')
      //         .attr('dy', '0.35em')
      //         .style("opacity", 0)
      //         .text(d3.sum(data.map(d => d[value])))
      //       .transition(t).duration(750) // fade in time
      //         .style("opacity", 1)          
      //   })        
  }

  function arcTween(a) {
    var i = d3.interpolate(this._current, a);
    this._current = i(0);
    return t => arc(i(t));
  }
};

