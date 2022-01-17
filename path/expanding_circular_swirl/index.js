function highlightStep(step) {
  d3.selectAll("#instructions li").classed("highlight", (d,i) => i == step-1);
}

const drawPath = () => {
  let pieces = splitPath();
  let segments = g.selectAll("g.segment")
    .data(pieces)
    .join('g')

  arrayPts = [];
  pieces.map((d,i) => {
    let keep = d.segs.filter((seg,k) => k%4 === 2) // dot spacing
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

  highlightStep(3)
  dots.transition()
      .delay((d,i) => i*5) // delay in drawing the next dot
      .attr("r", 3)
      .on("end", (d,i) => {if (i === points.length-1) {drawSegments(pieces)}; });

};

function splitPath() {
  highlightStep(2)
  let numPieces = 20,
      pieces = [],
      total = 0;
  const sampleInterval = .25;

  pieceSizes = [...Array(numPieces)].map(() => Math.floor(Math.random()*20) + 5)
  pieceSizes.sort((a,b) => b-a)
  let size = d3.sum(pieceSizes);
  let pieceSize = pLength / size; // avg pieceSize

  pieceSizes.map(d => {
    let pt, segs = []; 
    for (let k=0; k <= d+sampleInterval; k+=sampleInterval) {
      pt = p.getPointAtLength((k*pieceSize)+(total*pieceSize));
      segs.push([pt.x, pt.y]);
    }
    angle = Math.atan2(segs[1][1] - segs[0][1], segs[1][0] - segs[0][0]) * 180 / Math.PI;
    pieces.push({segs: segs, angle: angle}); // angle is for segment separator
    total += d;
  });
  return pieces;
}

function drawSegments(pieces) {
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
      .attr("x1", -24)
      .attr("y1", 0)
      .attr("x2", 24)
      .attr("y2", 0);                    

  highlightStep(4)
  const T = 150
  lines.transition().duration(0)
      .delay((d,i) => i*T)
      .style("stroke", (d,i) => colors[i])
      .on("end", (d,i) => {if (i === pieces.length-1) d3.selectAll("#instructions li").classed("highlight", false)})

  seps.transition().duration((pieces.length-2)*T)
      .style("stroke-width", '6');
}

// main section
let margin = {top: 20, right: 20, bottom: 20, left: 20},
    width = 500 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom,
    c1 = d3.schemePRGn[11],
    c2 = d3.schemeSpectral[9],
    colors = c1.concat(c2),
    a = 1,
    b = 9.4,
    theta = d3.range(0,100,1);

// define pts to draw
theta = theta.map(d => d/4)
let pts = theta.map(t => [(a+b*t)*Math.cos(t)+width/2, (a+b*t)*Math.sin(t)+height/2])//A*(2 + Math.sin(0.07*x) + Math.cos(0.05*x))])

let g = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

let line = d3.line().curve(d3.curveNatural)
let path = g.append("path")
    .attr("class", "init")
    .attr("d", line(pts))
let p = path.node()
let pLength = p.getTotalLength()

highlightStep(1)
path.attr("stroke-dasharray", `${pLength} ${pLength}`) // dashLength spaceLength
    .attr("stroke-dashoffset", pLength) // offset in negative x direction
  .transition().duration(1000).ease(d3.easeLinear)
    .attr("stroke-dashoffset", 0) // no offset
    .on("end", drawPath);
