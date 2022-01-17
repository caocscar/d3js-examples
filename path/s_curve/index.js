function highlightStep(step) {
    d3.selectAll("#instructions li").classed("highlight", (d, i) => i == step-1);
}

function drawPath() {
    let N = 4;
    let pieces = splitPath(N);
    arrayPts = [];
    pieces.map((d, i) => {
        let keep = d.segs.filter((seg, k) => k % N === 0) // dot spacing
        let pts = keep.map(d => ({id: i, seg: d}))
        arrayPts.push(pts)
    });
    let wayPts = [].concat(...arrayPts)

    startingCircles = drawStartingDates();

    drawSegments(pieces);

    let ppl = svg.selectAll(".ppl")
      .data(startingCircles)
      .join("circle")
        .attr("class", "ppl")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", 5)
        .style("fill", "black")

    // let dots = svg.selectAll(".waypoints")
    //   .data(wayPts)
    //   .join("circle")
    //     .attr("class", "waypoints")
    //     .attr("cx", d => d.seg[0])
    //     .attr("cy", d => d.seg[1])
    //     .attr("r", 0)
    //     .style("fill", d => colors[d.id])

    // highlightStep(3)
    // dots.transition()
    //     .delay((_, i) => i * 10) // delay in drawing the next dot
    //     .attr("r", 3)
        // .on("end", (_, i) => {
        //     if (i === wayPts.length - 1) {
        //         drawSegments(pieces);
        //     };
        // });
};

function splitPath(N) {
    highlightStep(2)
    const numPieces = years * 4; // Quarters
    let pieces = [];
    let total = 0;
    const sampleInterval = 1 / N;

    const pieceSizes = Array(numPieces).fill(12)
    let size = d3.sum(pieceSizes);
    let pieceSize = pathLength / size; // avg pieceSize so wayPts are evenly spaced

    pieceSizes.forEach(d => {
        let pt, segs = []; 
        for (let k=0; k <= d+sampleInterval; k+=sampleInterval) {
            pt = p.getPointAtLength((k * pieceSize) + (total * pieceSize));
            segs.push([pt.x, pt.y]);
        }
        angle = Math.atan2(segs[1][1] - segs[0][1], segs[1][0] - segs[0][0]) * 180 / Math.PI;
        pieces.push({segs: segs, angle: angle}); // angle is for segment separator
        total += d;
    });
    return pieces;
}

function drawSegments(pieces) {
    let lines = svg.selectAll("path.piece")
      .data(pieces)
      .join("path")
        .attr("class", "piece")
        .attr("d", d => line(d.segs));

    highlightStep(4);
    const T = 150;
    lines.transition().duration(0)
        .delay((_, i) => i*T)
        .style("stroke", (_, i) => colors[i])
        .on("end", (_, i) => {
            if (i === pieces.length - 1) {
                d3.selectAll("#instructions li").classed("highlight", false)
            }
        })
}

function drawStartingDates() {
    return days.map(day => {
        let pt = p.getPointAtLength(day * pathLength / numDays);
        return {x: pt.x, y: pt.y};
    })
}

let data = [
  {date: "2017-05-01"},
  {date: "2018-01-01"},
  {date: "2018-05-01"},
  {date: "2019-01-01"},
  {date: "2019-05-01"},
  {date: "2020-01-01"},
  {date: "2020-05-01"},
  {date: "2020-10-19"},
  {date: "2021-01-01"},
  {date: "2021-05-01"},
  {date: "2022-01-01"},
  {date: "2022-03-31"},
];
data = data.map(d => d3.timeParse("%Y-%m-%d")(d.date));

// main section
let margin = {top: 20, right: 20, bottom: 20, left: 20};
let c1 = d3.schemePRGn[11];
let c2 = d3.schemeSpectral[9];
let colors = c1.concat(c2);
let years = 5;
let yrOffset = 200;
let marginOffset = 20;
let minorDimension = yrOffset / 2 + marginOffset * 2;
let anchorPts = [];
let horizontal = true; // chart orientation
let width, height;

// date handling
const startDate = new Date(2017, 3, 1);
const month = (new Date).getMonth();
const currentYear = (new Date).getFullYear();
const endDate = month < 3 ? new Date(currentYear, 2, 31)
    : month < 6 ? new Date(currentYear, 5, 30)
    : month < 9 ? new Date(currentYear, 8, 30)
    : new Date(currentYear, 11, 31);
const numDays = d3.timeDay.count(startDate, endDate);

let days = data.map(d => d3.timeDay.count(startDate, d));

// define anchorPts to draw path
for (let i=0; i<years; i++) {
    anchorPts.push([i * yrOffset, marginOffset]);
    anchorPts.push([i * yrOffset, minorDimension - marginOffset]);
    anchorPts.push([i * yrOffset + yrOffset / 2, minorDimension - marginOffset]);
    anchorPts.push([i * yrOffset + yrOffset / 2, marginOffset]);
}
anchorPts.push([years * yrOffset, marginOffset]);
if (horizontal) { // horizontal direction
    anchorPts = anchorPts.map(d => [d[0] + marginOffset, d[1]]);
    width = years * yrOffset + marginOffset * 2;
    height = minorDimension;
} else { // vertical direction
    anchorPts = anchorPts.map(d => [d[1], d[0] + marginOffset]);
    width = minorDimension;
    height = years * yrOffset + marginOffset * 2;
}

// draw svg
let svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

let line = d3.line().curve(d3.curveNatural)
let path = svg.append("path")
    .attr("class", "init")
    .attr("d", line(anchorPts))

svg.selectAll(".anchors")
  .data(anchorPts)
  .join("circle")
    .attr("class", "anchors")
    .attr("cx", d => d[0])
    .attr("cy", d => d[1])
    .attr("visibility", "hidden")
    .attr("r", 5)

let p = path.node()
let pathLength = p.getTotalLength()

highlightStep(1)
path.attr("stroke-dasharray", `${pathLength} ${pathLength}`) // dashLength spaceLength
    .attr("stroke-dashoffset", pathLength) // offset in negative x direction
  .transition().duration(1000).ease(d3.easeLinear)
    .attr("stroke-dashoffset", 0) // no offset
    .on("end", drawPath);
