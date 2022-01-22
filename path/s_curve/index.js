const startDate = new Date(2017, 3, 1);
let years = 5;
const parseDate = d3.timeParse("%Y-%m-%d");
const formatDate = d3.timeFormat("%b %e, %Y");
let line = d3.line().curve(d3.curveNatural);
let c1 = d3.schemePRGn[11];
c1[0] = '#531a5d';
let c2 = d3.schemeSpectral[9];
let colors = c1.concat(c2);
let segmentLength = 400;
let horizontal = false; // chart orientation

function highlightStep(step) {
    d3.selectAll("#instructions li").classed("highlight", (d, i) => i == step-1);
}

function drawPath(path, numDays) {    
    let N = 4;
    let pieces = splitPath(N, path);
    arrayPts = [];
    pieces.map((d, i) => {
        let keep = d.segs.filter((seg, k) => k % N === 0) // dot spacing
        let pts = keep.map(d => ({id: i, seg: d}))
        arrayPts.push(pts)
    });
    let wayPts = [].concat(...arrayPts)

    startingCircles = drawStartingDates(path, numDays);
    drawSegments(pieces);

    let ppl = svg.selectAll(".mayniac")
      .data(startingCircles)
      .join("circle")
        .attr("class", "mayniac")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", 8)
        .attr("data-tippy-content", d => createTooltip(d))
        .style("fill", "black")
        .style("opacity", 0.5)

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

function splitPath(N, path) {
    let p = path.node();
    let pathLength = p.getTotalLength();

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

function drawStartingDates(path, numDays) {
    let p = path.node();
    let pathLength = p.getTotalLength();
    return mayData.map(d => {
        let day = d3.timeDay.count(startDate, d.HireDate);        
        let pt = p.getPointAtLength((numDays - day) * pathLength / numDays);
        d.x = pt.x;
        d.y = pt.y;
        return d;
    })
}

async function initChart(filename) {
    mayData = await d3.csv(filename, typeMay);
    
    // main section
    let margin = {top: 20, right: 20, bottom: 20, left: 20};
    let radius = segmentLength / 3.14;
    let yrOffset = radius * 4;
    let marginOffset = radius + 10;
    let leftOffset = 20;
    let anchorPts = [];
    let width, height;

    // date handling
    const month = (new Date).getMonth();
    const currentYear = (new Date).getFullYear();
    const endDate = month < 3 ? new Date(currentYear, 2, 31)
        : month < 6 ? new Date(currentYear, 5, 30)
        : month < 9 ? new Date(currentYear, 8, 30)
        : new Date(currentYear, 11, 31);
    const numDays = d3.timeDay.count(startDate, endDate);

    // define anchorPts to draw path
    for (let i=0; i<years; i++) {
        anchorPts.push([i * yrOffset, marginOffset]);
        anchorPts.push([i * yrOffset, segmentLength + marginOffset]);
        anchorPts.push([i * yrOffset + yrOffset / 4, segmentLength + marginOffset + radius])
        anchorPts.push([i * yrOffset + yrOffset / 2, segmentLength + marginOffset]);
        anchorPts.push([i * yrOffset + yrOffset / 2, marginOffset]);
        anchorPts.push([i * yrOffset + yrOffset * 3 / 4, marginOffset - radius])
    }
    anchorPts.push([years * yrOffset, marginOffset]);
    if (horizontal) { // horizontal direction
        anchorPts = anchorPts.map(d => [d[0] + leftOffset, d[1]]);
        width = years * yrOffset + marginOffset * 2;
        height = segmentLength + 2 * marginOffset;
    } else { // vertical direction
        anchorPts = anchorPts.map(d => [d[1], d[0] + leftOffset]);
        width = segmentLength + 2 * marginOffset;;
        height = years * yrOffset + marginOffset * 2;
    }

    // draw svg
    svg = d3.select("#chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

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

    let p = path.node();
    let pathLength = p.getTotalLength();

    highlightStep(1)
    path.attr("stroke-dasharray", `${pathLength} ${pathLength}`) // dashLength spaceLength
        .attr("stroke-dashoffset", pathLength) // offset in negative x direction
    .transition().duration(1000).ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0) // no offset
        .on("end", drawPath(path, numDays));

    addTooltips();
}

function typeMay(d) {
    d.Number = +d.Number;
    d.FirstName = d.FirstName;
    d.LastName = d.LastName;
    d.Location = d.Location;
    d.HireDate = parseDate(d.HireDate);
    d.AcceptedDate = parseDate(d.AcceptedDate);
    return d;
}

function addTooltips() {
    const mayniacTooltip = {
        allowHTML: true,
        followCursor: true,
        theme: 'mayniac',
    };
    tippy(".mayniac", mayniacTooltip);
}

function createTooltip(d) {
    return `<div>${formatDate(d.HireDate)}</div>
     <div>#${d.Number} - ${d.FirstName} ${d.LastName}</div>`
}


initChart('maynumber.csv');