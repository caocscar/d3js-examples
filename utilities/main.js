// creates all charts
async function makeDashboard() {
    // parse the date / time
    parseDate = d3.timeParse("%m/%d/%y");
    formatDate = d3.timeFormat("%b %d %Y");
    
    DATA = await d3.csv('https://docs.google.com/spreadsheets/d/e/2PACX-1vT4Ct6soKGWLJqC5sBk3vL3lvmH2t2GfCBe0xUgewKgDJ14v21NX5bdZ0oJfZRYcc-Ac4SClwtwopUE/pub?gid=0&single=true&output=csv', type);
    CF = crossfilter(DATA);
    date = CF.dimension(d => d.date);
    dateGrp = date.group();
    year = CF.dimension(d => d.year);
    yearGrp = year.group();    
    month = CF.dimension(d => d.month);
    monthGrp = month.group();
    day = CF.dimension(d => d.day);
    dayGrp = day.group();
    weekday = CF.dimension(d => d.weekday);
    weekdayGrp = weekday.group();
    hour = CF.dimension(d => d.hour);
    hourGrp = hour.group();

    makeTimeSeries();
}

// read in data
function type(d) {      
  d.date = parseDate(d.date);
  d.year = d.date.getFullYear();
  d.month = d.date.getMonth();
  d.day = d.date.getDate();
  d.weekday = d.date.getDay();
  d.hour = +d.hour;
  d.usage = +d.usage;
  return d
}
  
