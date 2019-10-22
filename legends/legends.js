var width = 500;
var height = 95;
var svgw = 20;
var svgh = 20;

async function make_legends(filename) {
    const data = await d3.tsv(filename)
    legendVals = d3.set(data.map(d => d.COUNTY)).values()
    
    console.table(legendVals)
    
    var legendVals1 = d3.scaleOrdinal()
        .domain(legendVals)
        .range(["#1F77B4", "#FF7F0E", "#2CA02C"]);
    
    var legendVals2 = ["Queens", "Kings", "Bronx", "Manhattan", "Richmond"];
    var color = d3.schemeCategory10;
    
    var svgLegend3 = d3.select(".legend3")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        
    //D3 Vertical Legend//////////////////////////
    var legend3 = svgLegend3.selectAll('.legend3')
        .data(legendVals1.domain())
        .enter().append('g')
        .attr("class", "legends3")
        .attr("transform", (d,i) => "translate(0," + (i*20+5) + ")")
    
    legend3.append('rect')
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 10)
        .attr("height", 10)
        .style("fill", (d,i) => color[i])
    
    legend3.append('text')
        .attr("x", 20)
        .attr("y", 10)
        .text(d => d)
        .attr("class", "textselected")
        .style("text-anchor", "start")
        .style("font-size", 15)
    
/////////D3 Horizonal Legend 1///////////////////////////
    var svgLegend4 = d3.select(".legend4").append("svg")
        .attr("width", width)
        .attr("height", height - 50)
    
    var dataL = 0;
    var offset = 80;
    
    var legend4 = svgLegend4.selectAll('.legends4')
        .data(legendVals2)
        .enter().append('g')
        .attr("class", "legends4")
        .attr("transform", function (d, i) {
            if (i === 0) {
            dataL = d.length + offset 
            return "translate(0,0)"
        } else { 
            var newdataL = dataL
            dataL +=  d.length + offset
            return "translate(" + (newdataL) + ",0)"
        }
    })
    
    legend4.append('rect')
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 10)
        .attr("height", 10)
        .style("fill", (d,i) => color[i])
    
    legend4.append('text')
        .attr("x", 20)
        .attr("y", 10)
        .text(d => d)
        .attr("class", "textselected")
        .style("text-anchor", "start")
        .style("font-size", 15)
        
/////////D3 Horizonal Legend 2////////////////////////////////
    var legend5 = d3.select('.legend5').selectAll("legend")
        .data(legendVals)
    
    legend5.enter().append("div")
    .attr("class","legends5")
    
    var p = legend5.append("p").attr("class","country-name")
    p.append("span").attr("class","key-dot").style("background",(d,i) => color[i] ) 
    p.insert("text").text(d => d) 

///////////D3 Horizonal Legend 3/////////////////////////////
    var legend6 = d3.select('.legend6').selectAll("legend")
        .data(legendVals)
    
    legend6.enter().append("div")
    .attr("class","legends6")
    
    legend6.html(d =>d).style("color", (d,i) => color[i] )
    
//////////D3 Reusable Legend////////////////////////////

    d3.edge = {};
    d3.edge.reuselegend = function module() {
    function exports(_selection) {
        _selection.each(function (_data) {
            d3.select(this)
                .selectAll("legend").data(_data)
                .enter().append('div')
                    .attr("class", "legends7")
                    .html(d => d.toUpperCase())
                    .style("color", (d,i) => color[i])
            })
        }
        return exports;
    }

    var rlegend = d3.edge.reuselegend()
    //.datum must be used and not data...data will only return the first item
    d3.select(".legend7").datum(legendVals).call(rlegend)
}

make_legends('nyc.stats.tsv')