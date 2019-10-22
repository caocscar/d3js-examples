    var margin = {top: 20, right: 30, bottom: 20, left: 20},
    width = 700 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom,
    format = d3.timeFormat("%Y-%m-%d");

    var colorScale = d3.scaleThreshold()
                       .domain([1,2,3,4])
                       .range(colorbrewer.YlOrRd[5]);

    var years = d3.range(2014, 2019).reverse(),
        sizeByYear = height/years.length+1,
        sizeByDay = d3.min([sizeByYear/8,width/54]),
        sizeByMonth = width/12.5,
        day = function(d) { return (d.getDay() + 6) % 7; },
        week = d3.timeFormat('%W'),
        date = d3.timeFormat('%b %d');

    var svg = d3.select("#heatmap")
        .append('svg')
        .attr("class",'chart')
        .attr('width',width + margin.left + margin.right)
        .attr('height',height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    var year = svg.selectAll('.year')
        .data(years)
        .enter().append('g')
            .attr('class', 'year')
            .attr('transform', function(d,i) { return 'translate(30,' + i * sizeByYear + ')'; });


    year.append('text')
        .attr('class','year-title')
        .attr('transform','translate(-35,' + sizeByDay * 3.5 + ')rotate(-90)')
        .style('text-anchor','middle')
        .style('font-weight','bold')
        .text(function(d) { return d; });
    
    var rect = year.selectAll('.day')
        .data(function(d) { return d3.timeDays(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
        .enter().append('rect')
        .attr("class","day")
        .attr("width",sizeByDay)
        .attr("height",sizeByDay)
        .style("x",function(d) { return week(d) * sizeByDay; })
        .style("y",function(d) { return day(d) * sizeByDay; })
        .datum(format);

    year.selectAll('.month')
        .data(function (d) { 
            return d3.timeMonths(new Date(d, 0, 1), new Date(d + 1, 0, 1)); 
        })
        .enter().append('path')
        .attr("class","month")
        .attr("d",monthPath);



    var weekDays = ['Mon', 'Wed', 'Fri','Sun'],
        month = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];


	var titlesDays = d3.selectAll('.year')
	                .selectAll('.titles-day')
	                .data(weekDays)
	                .enter().append('g')
	                .attr('class', 'titles-day')
	                .attr('transform', function (d, i) {
	                    return 'translate(-15,' + (sizeByDay*(i+0.4)*2) + ')';
	                });

    titlesDays.append('text')
        .attr('class', function (d,i) { return weekDays[i]; })
        .style('text-anchor', 'middle')
        .text(function (d, i) { return weekDays[i]; });

    var titlesMonth = svg.selectAll(".year")
        .selectAll('.titles-month')
        .data(month)
      .enter().append("text")
        .text((d) => d)
        .attr("x", (d, i) => i * (sizeByMonth))
        .attr("y", 0)
        .style("text-anchor", "middle")
        .attr("transform", function(d,i){
            var year = d3.select(this.parentNode).datum();
            if (year == 2012){
                return"translate(" + sizeByMonth/1.2 + ", -7)";
            } else  if (year == 2013 || year == 2014){
                if (i !=0 && i!=11){
                    return"translate(" + sizeByMonth/1.5 + ", -7)";
                }
            } else if (year == 2015){
                if (i!=7 && i!=8 && i!=9 && i!=10 && i!=11){
                    return"translate(" + sizeByMonth/1.5 + ", -7)";                 
                } else {
                    return"translate(" + sizeByMonth/1.3 + ", -7)";                                 
                }
            } else if (year == 2016){
                if (i==2 || i==5 || i==7 || i==8 || i==9 || i==10 || i==11){
                    return"translate(" + sizeByMonth/1.2 + ", -7)";                 
                } else {
                    return"translate(" + sizeByMonth/1.4 + ", -7)";                                 
                }               
            } 
            
            return"translate(" + sizeByMonth/1.4 + ", -7)";                                 
            
        });



	// Append Div for tooltip to SVG
	var tooltipDiv = d3.select("body")
	            .append("div")
	            .attr("class", "tooltip")
	            .style("display", "none");

	d3.csv("static/data/calendar.csv").then(function(csv) {

		csv.forEach(function(d) {
			d.count= +d.count;
		});


		var data = d3.nest()
		.key(function(d) { return d.date; })
		.rollup(function(d) { return d[0].count; })
		.map(csv);

        rect.filter(function(d) {return data.has(d); })
        .style("fill", function(d) {return colorScale(data.get(d)); })
        .on("mouseover",function(d){

            d3.select(this).attr("opacity",0.6);

            tooltipDiv.transition()
               .duration(200)
               .style("display", null);
            tooltipDiv.html("<p>" + d + ": " + data.get(d) + "</p>")
               .style("left", (d3.event.pageX+10 ) + "px")
               .style("top", (d3.event.pageY-20) + "px");
          })
        .on("mouseout",function(){
            d3.select(this).attr("opacity",1);

            tooltipDiv.transition()
                   .duration(500)
                   .style("display", "none");
        });


		var legendSVG = d3.select("#legend")
		                  .append("svg")
		                  .attr("width",200)
		                  .attr("height",200);


		legendSVG.append("g")
		         .attr("class", "legend")
		         .attr("transform", "translate(0,30)");

		var legendOptions = d3.legendColor()
		  .labelFormat(d3.format(".0f"))
		  .title("Count per Day")
		  .labels(d3.legendHelpers.thresholdLabels)
		  .titleWidth(200)
		  .scale(colorScale);


		legendSVG.select(".legend")
		.call(legendOptions);

	});


    function monthPath(t0) {
        var t1 = new Date(t0.getFullYear(), 
            t0.getMonth() + 1, 0),
            d0 = +day(t0), w0 = +week(t0),
            d1 = +day(t1), w1 = +week(t1);

        return 'M' + (w0 + 1) * sizeByDay + ',' + d0 * sizeByDay + 'H' + w0 * sizeByDay + 'V' + 7 * sizeByDay + 'H' + w1 * sizeByDay + 'V' + (d1 + 1) * sizeByDay + 'H' + (w1 + 1) * sizeByDay + 'V' + 0 + 'H' + (w0 + 1) * sizeByDay + 'Z';
    }