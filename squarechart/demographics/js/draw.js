var data = [];
var USER_SEX = "2",
    USER_RACESIMP = "1",
    USER_AGEGRP = "2";

var category_colors = {
        // TODO implement this based on what we did in class
        "married": "#5B7BE9",
        "children": "#E0D22E",
        "healthcare": "#2CCEF6",
        "college": "#FB7F23",
        "employed": "#D63CA3",
        "selfemp": "#c38014",
        "publictrans": "#E24062",
        "income_moremed": "#5BB923",
        "inpoverty": "#555",
        "isveteran": "#B190D0",
        "bornoutus": "#bcc832",
        "diffmovecog": "#ee7b9c",
        "diffhearvis": "#f299b3",
        "widowed": "#01d99f",
}

$(document).ready(function () {
    loadData();
    wireButtonClickEvents();
});

// Loads the CSV file
function loadData() {
    d3.csv("data/demographics.csv", (d) => {
    data = d;
    data.forEach((item) => {
      item.total = parseInt(item.total);
    });
        visualizeSquareChart(findDataItem());
    })
    // load the demographics.csv file
    // assign it to the data variable, and call the visualize function by first filtering the data
    // call the visualization function by first findingDataItem
}

// Finds the dataitem that corresponds to USER_SEX + USER_RACESIMP + USER_AGEGRP variable values
function findDataItem() {
    // you will find the SINGLE item in "data" array that corresponds to
    //the USER_SEX (sex), USER_RACESIMP (racesimp), and USER_AGEGRP(agegrp) variable values


    //HINT: uncomment and COMPLETE the below lines of code
    var item = data.filter(function (d) {
      return (d.sex == USER_SEX) && (d.racesimp == USER_RACESIMP) && (d.agegrp == USER_AGEGRP);
    });
    if (item.length == 1) {
       return item[0];
    }
    return null;
}



//Pass a single dataitem to this function by first calling findDataItem. visualizes square chart
function visualizeSquareChart(item) {
    // visualize the square plot per attribute in the category_color variable

    //HINT: you will iterate through the category_colors variable and draw a square chart for each item
    var fields = d3.keys(category_colors)
    fields.forEach((v, i) => {
      var item =findDataItem()
      var div = d3.select("#chart1").append("div")
                  .attr("id", "holder" + v)
                  .attr("class", "categoryBar")
                  .style("display", "inline-block");

      div.append("h6").html(v);


      svg = div.append("svg")
              .attr("width", 150)
              .attr("height", 150)


      rectWidth = 10
      rectHeight = 10

      rects = svg.selectAll(".square")
                 .data(d3.range(100))
                 .enter()
                 .append("rect")
                 .attr("class", "square")
                 .attr("fill", function(d, c){
                   // console.log(item[v]);
                   if (c < (100 - item[v])){
                        // console.log(item[v]);
                         return "rgb(224, 224, 224)";
                   }
                   else {
                         return category_colors[v];
                   }
                 })
                 .attr("x", (d, i) => rectWidth * (i % 10))
                 .attr("y", (d, i) => rectHeight * Math.floor(i / 10))
                 .attr("height", rectHeight)
                 .attr("width", rectWidth)
                 .attr("stroke","white");

    });

    // Update the count div whose id is "n" with item.total

    d3.select("#n").html(item.total);


}


//EXTRA CREDITS
function wireButtonClickEvents() {
//     // We have three groups of button, each sets one variable value.
//     //The first one is done for you. Try to implement it for the other two groups
//
//     //SEX
    d3.selectAll("#sex .button").on("click", function () {
        USER_SEX = d3.select(this).attr("data-val");
        d3.select("#sex .current").classed("current", false);
        d3.select(this).classed("current", true);
        $("#chart1").empty();

        // TODO: find the data item and invoke the visualization function
        visualizeSquareChart(findDataItem());
    });
    // RACE
    d3.selectAll("#racesimp .button").on("click", function () {
        USER_RACESIMP = d3.select(this).attr("data-val");
        d3.select("#racesimp .current").classed("current", false);
        d3.select(this).classed("current", true);
        $("#chart1").empty();

        visualizeSquareChart(findDataItem());
    });
    //AGEGROUP
    d3.selectAll("#agegrp .button").on("click", function () {
        USER_AGEGRP = d3.select(this).attr("data-val");
        d3.select("#agegrp .current").classed("current", false);
        d3.select(this).classed("current", true);
        $("#chart1").empty();

        visualizeSquareChart(findDataItem());

    });


}
