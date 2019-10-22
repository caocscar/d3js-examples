async function make_bar_line_chart(filename) {
  const origdata = await d3.csv(filename, type)
  // assign new key names to array while preserving the rest
  const data = origdata.map(({date:x, value:bar, avg:line}) => ({x, bar, line}) );

  // set the dimensions and margins of the graph
  var margin = {top: 0, right: 40+40, bottom: 30+40+40, left: 50+20},
      width = 1200 - margin.left - margin.right,
      height = 440 - margin.top - margin.bottom + 40;

  // append the svg object to the body of the page
  // appends a 'group' element to 'svg'
  // moves the 'group' element to the top left margin
  var svg = d3.select(".barline").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform","translate(" + margin.left + "," + margin.top + ")");

  // set the domain and range
  var xBar = d3.scaleBand()
                .domain(data.map(d => d.x))
                .range([0, width])
                .paddingInner(0.5)
                .paddingOuter(0.25)
  var xLine = d3.scalePoint()
                .domain(data.map(d => d.x))
                .range([0, width])
                .padding(0.5);
  ymax = d3.extent(data, d => d3.max([d.bar,d.line,4]))[1]
  var yBar = d3.scaleLinear()
                .domain([0, ymax+0.2] )
                .range([height, 0]).nice();        
  var yAxis = d3.axisLeft(yBar)
                .tickValues(d3.range(ymax+1))
                .tickFormat(d3.format("d"));

  // add the y-axis gridlines
  numticks = ymax > 10 ? ymax/2 : ymax
  svg.append("g")			
      .attr("class", "grid")
      .call(d3.axisLeft(yBar)
              .ticks(numticks)
              .tickSize(-width)
              .tickFormat("") 
      )
      
  // define the line
  var valueline = d3.line()
      .x(d => xLine(d.x))
      .y(d => yBar(d.line))

  var rect = svg.selectAll("rect")
      .data(data)
  		
  rect.enter().append("rect")
  	.merge(rect)
      .attr("class", "bar")
      .attr("x", d => xBar(d.x))
      .attr("width", d => xBar.bandwidth())
      .attr("y", d => yBar(d.bar))
      .attr("height", d => height - yBar(d.bar))  

  // Add the valueline path.
  svg.append("path")
      .datum(data)
      .attr("class", "line")
      .attr("d", valueline)

  // Add the X Axis
  svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(xBar))
    .selectAll("text")
      .attr('class','x ticklabel')
      .attr("y", 5)
      .attr("x", -10)
      .attr("dy", ".35em")
      .attr("transform", "rotate(-30)")

  // Add the Y Axis
  svg.append("g")
      .attr('class','y ticklabel')
      .call(yAxis)

  // text label for the y-axis
  svg.append("text")
      .attr('class','y label')
      .attr("transform", "translate(-80,"+(height/2)+") rotate(-90)")
      .attr("dy", "2em")
      .text("Frequency");

  // Legend
  var L = svg.selectAll('.cao')
      .data(['Daily','7 Day Moving Average'])
    .enter().append('g')
      .attr('class','legend')        
      .attr("transform", (d,i) => i===0 ? "translate(400,"+(height+70)+")" : "translate(550,"+(height+70)+")")

  L.append('rect')
      .attr('x', 0)
      .attr('y', (d,i) => i===0 ? 0 : 6)
      .attr("width", (d,i) => i===0 ? 20 : 30)
      .attr("height", (d,i) => i===0 ? 20 : 4)
      .style("fill", (d,i) => i===0 ? '#FFCB05' : '#00274C' )      
  
  L.append('text')
      .attr('x' ,40)
      .attr('y', 15)
      .text(d => d)
  
  // Date Range
  // parse the date / time
  var parseTime = d3.timeParse("%Y-%m-%d")
  var dates = data.map(d => parseTime(d.x))
  var mindate = d3.min(dates)
  var maxdate = d3.max(dates)
  var formatDate = d3.timeFormat('%b. %e, %Y')
  d3.selectAll('.daterange')
      .text(formatDate(mindate) + ' - ' + formatDate(maxdate))

};

function type(d) {
  d.value = +d.value
  d.avg = +d.avg
  return d
}
