// set the dimensions and margins of the graph
let margin = {top: 0, right: 0, bottom: 0, left: 0},
    W = 500, H = 600,
    width = W - margin.left - margin.right,
    height = H - margin.top - margin.bottom;

// create SVG element and append map to the SVG
let svg = d3.select("#map")
  .append('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('preserveAspectRatio', 'xMidYMin meet')
    .attr('class', 'svg-container')
  .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

const intervals = [10,100,1000,10000,100000]
let colorScale = d3.scaleThreshold()
    .domain(intervals)
    .range(d3.schemeYlGnBu[6])

// Legend
const xLegend = 20
const yLegend = 0.65*height
const side = 20
const legendIntervals = [0].concat(intervals)
const legendFmt = d3.format(',')
let legend = svg.selectAll(".legend")
  .data(legendIntervals)
  .join("g")
    .attr("class", "legend")
    .attr("transform", (d,i) => `translate(${xLegend},${yLegend+15+i*side})`);

legend.append("rect")
    .attr("width", side)
    .attr("height", side)
    .style("fill", d => colorScale(d));

legend.append("text")
    .attr("class", "legendLabel")
    .attr("x", side+5)
    .attr("y", side/2)
    .attr("dy", ".35em")
    .text((d,i,arr) => i < legendIntervals.length-1 ? `${legendFmt(d)}-${legendFmt(arr[i+1].__data__ - 1)}` : `${legendFmt(d)}+`);

svg.append("text")
    .attr("class", "legendLabel")
    .attr("x", xLegend)
    .attr("y", yLegend)
    .attr("dy", ".35em")
    .text("Population");

// Load map data
async function makeHexMap(filename) {
    MIgeo = await d3.json(filename)

    // D3 projection
    projection = d3.geoMercator()
        .fitSize([width, height], MIgeo)

    // Define path generator
    path = d3.geoPath() // path generator that will convert GeoJSON to SVG paths
        .projection(projection);

    svg.selectAll("path")
      .data(MIgeo.features)
      .join("path")
        .attr('class', 'hex')
        .attr("d", path)
        .attr("fill", d => colorScale(d.properties.POP))
        .attr("data-toggle", "tooltip")
        .attr("data-html", true)
        .attr("title", d => {
          txt = `Pop: ${d3.format(',')(d.properties.POP)}`
          txt += `<br>Cases: ${d.properties.Cases}`
          txt += `<br>Case Rate: ${d3.format('.6f')(d.properties.RawCsRt)}`
          return txt
        })

    $(function () {
        $('[data-toggle="tooltip"]').tooltip()
    })
};
