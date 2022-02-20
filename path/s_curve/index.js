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
let width, height;

const horizontal = false; // chart orientation

function drawFinalPath(path, numDays) {    
    let N = 4;
    let pieces = splitPath(N, path);
    arrayPts = [];
    pieces.map((d, i) => {
        let keep = d.segs.filter((seg, k) => k % N === 0) // dot spacing
        let pts = keep.map(d => ({id: i, seg: d}))
        arrayPts.push(pts)
    });
    let wayPts = [].concat(...arrayPts)
    drawSegments(pieces, path);
    drawStartingCircles(path, numDays);

    // draw waypoints
    // let dots = svg.selectAll(".waypoints")
    //   .data(wayPts)
    //   .join("circle")
    //     .attr("class", "waypoints")
    //     .attr("cx", d => d.seg[0])
    //     .attr("cy", d => d.seg[1])
    //     .attr("r", 2)
    //     .style("fill", d => colors[d.id])

    // // transition to final radius
    // highlightStep(3)
    // dots.transition()
    //     .delay((_, i) => i * 20) // delay in drawing the next dot
    //     .attr("r", 6)
    //     .on("end", (_, i) => {
    //         if (i === wayPts.length - 1) {
    //             drawSegments(pieces);
    //         };
    //     });
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

function drawSegments(pieces, path) {
    let p = path.node();
    let pathLength = p.getTotalLength();
    let lines = svg.selectAll("path.segment")
      .data(pieces)
      .join("path")
        .attr("class", "segment")
        .attr("d", d => line(d.segs))
        .style("stroke", (_, i) => colors[i])
        .style("stroke-width", 48)
        .attr("stroke-dasharray", `${pathLength} ${pathLength}`) // dashLength spaceLength
        .attr("stroke-dashoffset", pathLength) // offset in negative x direction

    // highlightStep(4);
    // transition segments
    const T = 150;
    lines.transition().duration(6 * T)
        .delay((_, i) => i * T)
        .attr("stroke-dashoffset", 0) // no offset
}

function drawStartingCircles(path, numDays) {
    // draw starting circles
    startingCircles = getStartingDates(path, numDays);
    let ppl = svg.selectAll(".mayniac")
      .data(startingCircles)
      .join("circle")
        .attr("class", "mayniac")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", 0)
        .attr("data-tippy-content", d => createTooltip(d.value))
        .style("fill", "black")
        .style("opacity", 0.5)

    // transition starting circles to appear
    ppl.transition()
      .delay((d, i) => d.delay * 3)
      .attr("r", 8)
}

function getStartingDates(path, numDays) {
    let p = path.node();
    let pathLength = p.getTotalLength();
    return sC.map(d => {
        let day = d3.timeDay.count(startDate, d.HireDate);        
        let pt = p.getPointAtLength((numDays - day) * pathLength / numDays);
        d.x = pt.x;
        d.y = pt.y;
        d.delay = numDays - day;
        return d;
    })
}

async function initChart(filename) {
    // load data
    mayData = await d3.csv(filename, typeMay); // array of objects
    startingCohort = d3.groups(mayData, d => d.HireDate);
    sC = startingCohort.map(d => ({HireDate: d[0], value: d[1]}));
    
    // constants
    let margin = {top: 20, right: 20, bottom: 20, left: 20};

    // date handling
    const month = (new Date).getMonth();
    const currentYear = (new Date).getFullYear();
    const endDate = month < 3 ? new Date(currentYear, 2, 31)
        : month < 6 ? new Date(currentYear, 5, 30)
        : month < 9 ? new Date(currentYear, 8, 30)
        : new Date(currentYear, 11, 31);
    const numDays = d3.timeDay.count(startDate, endDate);

    let anchorPts = defineAnchorPts()

    // construct svg
    svg = d3.select("#chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // draw anchor pts for path
    svg.selectAll(".anchors")
      .data(anchorPts)
      .join("circle")
        .attr("class", "anchors")
        .attr("cx", d => d[0])
        .attr("cy", d => d[1])
        .attr("visibility", "hidden")
        .attr("r", 5)

    // draw initial skinny path thru anchor pts
    let path = svg.append("path")
        .attr("class", "init")
        .attr("d", line(anchorPts))
        .attr("visibility", "hidden");

    // calculate some path length
    let p = path.node();
    let pathLength = p.getTotalLength();

    path.attr("stroke-dasharray", `${pathLength} ${pathLength}`) // dashLength spaceLength
        .attr("stroke-dashoffset", 0*pathLength) // offset in negative x direction

    drawFinalPath(path, numDays);
    addTooltips();
    addYearLabels();
}

function defineAnchorPts() {
    // define anchorPts to draw path
    let anchorPts = [];
    let radius = segmentLength / 3.14;
    let yrOffset = radius * 4;
    let marginOffset = radius + 10;
    let leftOffset = 20;

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
    return anchorPts;
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

function createTooltip(mayniacs) {
    let html = `<div>${formatDate(mayniacs[0].HireDate)}</div>`;
    mayniacs.forEach(d => {
        html += `<div>#${d.Number} - ${d.FirstName} ${d.LastName[0]}</div>`
    });
    return html;
}

function addYearLabels() {
    const years = ['2021', '2020', '2019', '2018', '2017'];
    if (!horizontal) {
        svg.selectAll('.years')
          .data(years)
          .join('text')
            .attr('class', 'years')
            .attr('x', 150)
            .attr('y', (_, i) => 400 + 510 * i)
            .attr('dy', '0.35em')
            .text(d => d);
    }
}

initChart('maynumber.csv');

function highlightStep(step) {
    d3.selectAll("#instructions li").classed("highlight", (d, i) => i == step-1);
}