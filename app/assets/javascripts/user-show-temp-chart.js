$(document).ready(function(){
  // todos for this file
  // make it OO
  drawChartAjaxCall();
});

function draw(response) {
      // Chart size
  var w = window.innerWidth,
      h = 450,
      // Date variables
      days = [ 'Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday' ],
      monthNames = [ "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
        "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER" ],
      abbreviatedMonthNames = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ],
      // d3 variables
      maxDataPointsForDots = 500,
      transitionDuration = 1000,
      svg = null,
      yAxisGroup = null,
      xAxisGroup = null,
      dataCirclesGroup = null,
      dataLinesGroup = null;

  if(/live_update/.test(document.URL)){
    transitionDuration = 0;
  }

  var data = response,
  violations = 0;
  // add usefull properties to the data objects
  data.forEach(function(obj){
    obj.date = new Date(obj.created_at);
    obj.isDay = obj.date.getHours() >= 6 && obj.date.getHours() <= 22;
    if(/live_update/.test(document.URL)){
      obj.violation = true;
    }
    if(obj.violation){ violations += 1; }
  });
  var margin = 40;
  var max = d3.max(data, function(d) { return Math.max( d.temp, d.outdoor_temp ) }) + 1;
  // checks whether or not there is an outdoor temp
  if ( d3.min(data, function(d) { return d.outdoor_temp }) ){
    var min = d3.min(data, function(d) { return Math.min( d.temp ) }) - 5;
  } else {
    var min = d3.min(data, function(d) { return Math.min( d.temp, d.outdoor_temp ) }) - 10;
  }
  var pointRadius = 4;
  var x = d3.time.scale().range([0, w - margin * 2]).domain([data[0].date, data[data.length - 1].date]);
  var y = d3.scale.linear().range([h - margin * 2, 0]).domain([min, max]);
  var xAxis = d3.svg.axis().scale(x).tickSize(h - margin * 2).tickPadding(0).ticks(data.length);
  var yAxis = d3.svg.axis().scale(y).orient('left').tickSize(-w + margin * 2).tickPadding(0).ticks(5);
  var t = null,
  strokeWidth = w / data.length;

  var svg = d3.select('#d3-chart').select('svg').select('g');
  function createSvg(){
    if (svg.empty()) {
      svg = d3.select('#d3-chart')
        .append('svg:svg')
        .attr('width', w)
        .attr('height', h)
        .attr('class', 'viz')
        .append('svg:g')
        .attr('transform', 'translate(' + margin + ',' + margin + ')');
    }
  }

  createSvg();

  function setT(){
    t = svg.transition().duration(transitionDuration);
  }

  setT()

  function addLineStlyingToXTicks(){
    var $lines = $(".xTick .tick line"),
        length = data.length,
        date,
        newText,
        $textEl;

    for(var i = 0; i < length; i++){
      if(data[i].isDay === false){
        $($lines[i]).attr(
          { 'stroke-width': strokeWidth, 'stroke': '#90ABB0' }
        );
        if(i === 0){
          $($lines[i]).attr({ 'stroke-width': strokeWidth * 1.9 });
        }
      }
      else {
        // add dates to bottom of graph
        if ( data[i].date.getHours() === 16 ) {
          date = data[i].date;
          newText = abbreviatedMonthNames[date.getMonth()] + " " 
            + date.getDate() + ", " + (date.getYear() + 1900);
          $textEl = $($(".xTick .tick text")[i]);
          $textEl.text(newText);
          $textEl.show();
          $textEl.attr({"x": -15, "y": 380});
        }
      }
    }
  }

// x ticks and labels gets placed first
  // x ticks and labels
  function setXAxisGroup(){
    if (!xAxisGroup) {
      xAxisGroup = svg.append('svg:g')
        .attr('class', 'xTick')
        .call(xAxis);
    }
    else {
      t.select('.xTick').call(xAxis);
    }
  }

  setXAxisGroup()
  addLineStlyingToXTicks();

// y ticks and labels gets placed second
  // y ticks and labels
  function setYAxisGroup() {
    if (!yAxisGroup) {
      yAxisGroup = svg.append('svg:g')
        .attr('class', 'yTick')
        .call(yAxis);
      // fixes x value for text
      $(".yTick .tick text").attr("x", "-5")
    }
    else {
      t.select('.yTick').call(yAxis);
    }
  }

  setYAxisGroup()

// y ticks and labels gets placed third
  // Draw the lines
  function setDataLinesGroup(){
    if (!dataLinesGroup) {
      dataLinesGroup = svg.append('svg:g');
    }
  }
  setDataLinesGroup()

  var dataLines = dataLinesGroup.selectAll('.data-line').data([data]);

  var line = d3.svg.line()
    // assign the X function to plot our line as we wish
    .x(function(d,i) {
      // verbose logging to show what's actually being done
      //console.log('Plotting X temp for date: ' + d.date + ' using index: ' + i + ' to be at: ' + x(d.date) + ' using our xScale.');
      // return the X coordinate where we want to plot this datapoint
      //return x(i);
      return x(d.date); 
    })
    .y(function(d) { 
      // verbose logging to show what's actually being done
      //console.log('Plotting Y temp for data temp: ' + d.temp + ' to be at: ' + y(d.temp) + " using our yScale.");
      // return the Y coordinate where we want to plot this datapoint
      //return y(d); 
      return y(d.temp); 
    })
    .interpolate("linear");

  var garea = d3.svg.area()
    .interpolate("linear")
    .x(function(d) { 
      // verbose logging to show what's actually being done
      return x(d.date); 
    })
    .y0(h - margin * 2)
    .y1(function(d) { 
      // verbose logging to show what's actually being done
      return y(d.outdoor_temp); 
    });

  dataLines
    .enter()
    .append('svg:path')
    .attr("class", "area");
    // .attr("d", garea(data));

  dataLines.enter().append('path')
    .attr('class', 'data-line')
    .style('opacity', 0.3)
    .attr("d", line(data))
    .transition()
    .delay(transitionDuration / 2)
    .duration(transitionDuration)
    .style('opacity', 1);
    // .attr('x1', function(d, i) { return (i > 0) ? xScale(data[i - 1].date) : xScale(d.date); })
    // .attr('y1', function(d, i) { return (i > 0) ? yScale(data[i - 1].temp) : yScale(d.temp); })
    // .attr('x2', function(d) { return xScale(d.date); })
    // .attr('y2', function(d) { return yScale(d.temp); });
    

  // dataLines.transition()
  //   .attr("d", line)
  //   .duration(transitionDuration)
  //   .style('opacity', 1)
  //   .attr("transform", function(d) {
  //     return "translate(" + x(d.date) + "," + y(d.temp) + ")"; 
  //   });

  dataLines.exit()
    .transition()
    .attr("d", line)
    .duration(transitionDuration)
    .attr("transform", function(d) {
     return "translate(" + x(d.date) + "," + y(0) + ")"; 
    })
    .style('opacity', 1e-6)
    .remove();

  d3.selectAll(".area").transition()
    .duration(transitionDuration)
    .attr("d", garea(data));

  // move the area to the back of the graph
  var fillArea = $(".area")
  $("#d3-chart svg > g").prepend(fillArea)

  // add number of violations to the legend
  $("#violations span").text($("#violations span")
    .text().replace(/\d+/, violations));


  if (violations) {
  // Draw the circles if there are any violations
    if (!dataCirclesGroup) {
      dataCirclesGroup = svg.append('svg:g');
    }

    var circles = dataCirclesGroup.selectAll('.data-point').data(data);

    circles.enter()
      .append('svg:circle')
      .attr('class', 'data-point')
      .style('opacity', 1)
      .attr('cx', function(d) { return x(d.date) })
      .attr('cy', function() { return y(0) })
      .attr('r', function(d) {
        return d.violation ? pointRadius : 0;
      })
      .transition()
      .duration(transitionDuration)
      .style('opacity', 1)
      .attr('cx', function(d) { return x(d.date) })
      .attr('cy', function(d) { return y(d.temp) });

    // circles
    //   .transition()
    //   .duration(transitionDuration)
    //   .attr('cx', function(d) { return x(d.date) })
    //   .attr('cy', function(d) { return y(d.temp) })
    //   .attr('r', function(d) { 
    //     return d.violation ? pointRadius : null
    //   })
    //   .style('opacity', 1);

    circles
      .exit()
      .transition()
      .duration(transitionDuration)
      // Leave the cx transition off. Allowing the points to fall where they lie is best.
      //.attr('cx', function(d, i) { return xScale(i) })
      .attr('cy', function() { return y(0) })
      .style("opacity", 1e-6)
      .remove();
  }

  function legalMinimumFor(reading){
    if(reading.isDay === true){
      return '68';
    }else{
      return '55';
    }
  }

  function getCivilianTime(reading){
    if (reading.getHours() > 12){
      return (reading.getHours() - 12) + ":"
        + (reading.getMinutes() >= 10 ?
          reading.getMinutes() : "0" + reading.getMinutes()) 
        + " PM";
    }else{
      return reading.getHours() + ":"
        + (reading.getMinutes() >= 10 ?
          reading.getMinutes() : "0" + reading.getMinutes()) 
        + " AM";
    }
  }

  // only add tooltips if it is not a live demo
  if(!/live_update/.test(document.URL)){
    $('svg circle').tipsy({ 
      gravity: 's',
      html: true,
      topOffset: 2.8,
      leftOffset: 0.3,
      opacity: 1,
      title: function() {
        var d = this.__data__;
        var pDate = d.date;
        return pDate.getDate() + ' '
          + monthNames[pDate.getMonth()] + ' '
          + pDate.getFullYear() + '<br>'
          + days[ pDate.getDay() ] + ' at '
          + getCivilianTime(pDate) + '<br>'
          + '<i>Temperature in Violation</i><br>'
          + '<br>Temperature in Apt: ' + d.temp + '°'
          + '<br>Temperature Outside: ' + d.outdoor_temp + '°'
          + '<br>Legal minimum: ' + legalMinimumFor(d) + '°';
      }
    });
  }
}

function drawChartBasedOnScreenSize(chartData){
  if ( $('#live-update') !== undefined ) {
    $('.temp-num').html(chartData[chartData.length - 1].temp + '°')
  }

  if (window.innerWidth < 450) {
    var quarterReadings = chartData.slice(119, 167);
    $("#d3-chart").html("")
    draw(quarterReadings);
  }else if(window.innerWidth < 720){
    var halfReadings = chartData.slice(71, 167);
    $("#d3-chart").html("")
    draw(halfReadings);
  }else if(window.innerWidth < 1080){
    var threeQuarterReadings = chartData.slice(23, 167);
    $("#d3-chart").html("")
    draw(threeQuarterReadings);
  }else{
    $("#d3-chart").html("")
    draw(chartData);
  }
}

function drawChartAjaxCall(){
  if($("#d3-chart").length > 0){
    if(/collaborations/.test(document.URL)){
      var URL = /\/users\/\d+\/collaborations\/\d+/.exec(document.URL)[0];
      // returns /user/11/collaborations/35
    } else if ( /live_update/.test(document.URL) ){
      var URL = /\/users\/\d+\/live_update/.exec(document.URL)[0];
      //returns /user/13/live_update
    } else {
      var URL = /\/users\/\d+/.exec(document.URL)[0];
    }
    $.ajax({
      url: URL,
      dataType: "JSON",
      success: function(response){
        if( response.length > 0 ){
          drawChartBasedOnScreenSize(response);
          var resizeTimer = 0;
          window.onresize = function(){
            if (resizeTimer){
              clearTimeout(resizeTimer);
            } 
            resizeTimer = setTimeout(function(){
              drawChartBasedOnScreenSize(response);
            }, 50);
          };
        }
      },
      error: function(response){
        console.log("error");
        console.log(response);
      }
    });
  }
}