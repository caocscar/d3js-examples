let margin = {top: 0, right: 20, bottom: 0, left: 20},
    width = 960 - margin.left - margin.right,
    height = 350 - margin.top - margin.bottom,
    c1 = d3.schemePRGn[11],
    c2 = d3.schemeYlGnBu[9],
    colors = c1.concat(c2),
    pts = [],
    cycles = 7;

for (let i=0; i<cycles; i++) {
    pts.push([i*(width/cycles), 50]);
    pts.push([i*(width/cycles), height-50]);
    pts.push([i*(width/cycles)+50, height-50]);
    pts.push([i*(width/cycles)+50, 50]);
}

let line = d3.line().curve(d3.curveCardinal)
let g = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

let path = g.append("path")
    .attr("class", "hidden init")
    .attr("d", line(pts))

let p = path.node()
let pLength = p.getTotalLength()

let cumu = 0
const sampleInterval = .25;

function drawPath(callback) {
  path.classed("hidden", false)
      .attr("stroke-dasharray", `${pLength} ${pLength}`)
      .attr("stroke-dashoffset", pLength)
    .transition().duration(1000).ease(d3.easeLinear)
      .attr("stroke-dashoffset", 0)
      .on("end", () => callback());
}

function splitPath() {
  let numPieces = 20,
      pieces = [];

  const pieceSizes = [...Array(numPieces)].map(() => Math.floor(Math.random()*20) + 5)
  let size = d3.sum(pieceSizes);
  let pieceSize = pLength / size; // avg pieceSize

  pieceSizes.map(d => {
    let pt, segs = []; 
    for (let k=0; k <= d+sampleInterval; k+=sampleInterval) {
      pt = p.getPointAtLength((k*pieceSize)+(cumu*pieceSize));
      segs.push([pt.x, pt.y]);
    }
    angle = Math.atan2(segs[1][1] - segs[0][1], segs[1][0] - segs[0][0]) * 180 / Math.PI;
    pieces.push({segs: segs, angle: angle});
    cumu += d;
  });
  return pieces;
}

drawPath(() => {
  // step 3
  d3.selectAll("#instructions li").classed("highlight", function() {
    return this.getAttribute("data-id") === "3";
  });

  let pieces = splitPath();
  let segments = g.selectAll("g.segment")
    .data(pieces)
    .join('g')

  arrayPts = [];
  pieces.map((d,i) => {
    let keep = d.segs.filter((seg,k) => k>0 && k%4 === 0) // dot spacing
    let pts = keep.map(d => {return {id: i, seg: d}})
    arrayPts.push(pts)
  });
  let points = [].concat(...arrayPts)

  let dots = g.selectAll("circle")
    .data(points)
    .join("circle")
      .attr("cx", d => d.seg[0])
      .attr("cy", d => d.seg[1])
      .attr("r", 0)
      .style("fill", d => colors[d.id])

  dots.transition()
      .delay((d,i) => i*5) // delay in drawing the next dot
      .attr("r", 3)
      .on("end", (d,i) => {if (i === points.length-1) {drawSegments(pieces)}; });

});

function drawSegments(pieces) {
  // step 4
  d3.selectAll("#instructions li").classed("highlight", function() {
    return this.getAttribute("data-id") === "4";
  });

  let lines = g.selectAll("path.piece")
    .data(pieces)
    .join("path")
      .attr("class", "piece")
      .attr("d", d => line(d.segs));

  let seps = g.selectAll("line.sep") // covered up
    .data(pieces)
    .join("line")
      .attr("class", "sep")
      .attr("transform", d => `translate(${d.segs[0][0]},${d.segs[0][1]}) rotate(${(d.angle-90)},0,0)`)
      .attr("x1", -12)
      .attr("y1", 0)
      .attr("x2", 12)
      .attr("y2", 0);                    

  const T = 150
  lines.transition().duration(0)
      .delay((d,i) => i * T)
      .style("stroke", (d,i) => colors[i])
      .on("end", (d,i) => {if (i === pieces.length-1) d3.selectAll("#instructions li").classed("highlight", false)})

  seps.transition().duration((pieces.length-2)*T)
      .style("stroke-width", '6');
}