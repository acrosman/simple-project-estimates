$(document).ready(function() {
  var data = [];
  // https://cmatskas.com/importing-csv-files-using-jquery-and-html5/
  // http://evanplaice.github.io/jquery-csv/examples/basic-usage.html
  // https://github.com/evanplaice/jquery-csv/

  // The event listener for the file upload
  $('#csvFileInput').change(upload);
  $('#startSimulationButton').click(runSimulation);
  $('#simulationResultsWrapper').hide();
  $('#simulationAreaWrapper').hide();
  $('#addTaskBtn').click(addRowEvent);
  $('#resetBtn').click(dataResetEvent);

  // Method that checks that the browser supports the HTML5 File API
  function browserSupportFileUpload() {
    var isCompatible = false;
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      isCompatible = true;
    }
    return isCompatible;
  }

  function addRowEvent() {
    var row = {};
    row.Task = $('#taskNameInput').val();
    row.Min = $('#minInput').val();
    row.Max = $('#maxInput').val();
    row.Confidence = parseFloat($('#confidenceInput').val())/100.0 ;
    addTaskRow(row);
    data.push(row);
    $('#simulationAreaWrapper').show();
  }

  function dataResetEvent() {
    data = [];
    $('#rawData table tr.data').remove();
    $('#simulationAreaWrapper').hide();
  }

  // Method that reads and processes the selected file
  function upload(evt) {

    if (!browserSupportFileUpload()) {
      alert('The File APIs are not supported by this browser!');
    } else {

      var file = evt.target.files[0];
      var reader = new FileReader();
      reader.readAsText(file);
      reader.onerror = function() {
        alert('Unable to read ' + file.fileName);
      };

      reader.onload = function(event) {
        var csvData = event.target.result;
        data = $.csv.toObjects(csvData);
        if (data && data.length > 1) {
          $.each(data, function(index, row) {
            addTaskRow(row);
          });
          $('#simulationAreaWrapper').show();
        } else {
          alert('No data to import!');
        }
      };
    }
  }

  function addTaskRow(row) {
    var cells = "<td>" + row.Task; + "</td>/n";
    cells += "<td>" + row.Max; + "</td>/n";
    cells += "<td>" + row.Min; + "</td>/n";
    cells += "<td>" + row.Confidence; + "%</td>/n";
    $('#rawData table').append('<tr class="data">' + cells+ "</tr>");
  }

  function runSimulation(evt) {
    var passes = parseInt($('#simulationPasses').val());
    var upperbound = calculateUpperBound(data);
    var times = new Array(upperbound).fill(0);
    var min = -1;
    var max = 0;

    // Clear any existing displays
    $("#simulationAverage").html('');
    $("#simulationMedian").html('');
    $("#simulationMax").html('');
    $("#simulationMin").html('');
    $("#histoGram").html('');
    $('#simulationResultsWrapper').show();

    // Run the simulation.
    for(var i = 0; i < passes; i++) {
      var time = 0;
      $.each(data, function(index, row) {
        time += generateEstimate(row.Min, row.Max, row.Confidence);
      });
      times[time]++;
      if (time < min || min == -1) { min = time; }
      if (time > max) { max = time;}
    }
    var sums = times.map(function(value, index) {
      return value * index;
    });
    var sum = sums.reduce(function(a, b) { return a + b; });
    var avg = sum / passes;
    var median = getMedian(times);
    $("#simulationAverage").html('Average Time: ' + avg);
    $("#simulationMedian").html('Median Time: ' + median);
    $("#simulationMax").html('Max Time: ' + max);
    $("#simulationMin").html('Min Time: ' + min);

    // build histogram from times array
    var trimmed = times.filter(function(e, i){
      return (i > min && i < max);
    });
    buildHistogram(trimmed, min, max, median);

  }

  // Calculate the longest time the simulator may come up with.
  function calculateUpperBound(tasks){
    var total = 0;
    $.each(tasks, function(index, row){
      total += parseInt(row.Max) * 2;
    });
    return total;
  }

  // Does the estimate for one task. It picks a random number between min and
  // max confidence % of the time. If the number is outside the range, it has
  // an even chance of being between 0-min, or max and max *2.
  function generateEstimate(minimum, maximum, confidence) {
    var max = parseInt(maximum);
    var min = parseInt(minimum);
    var base = getRandom(1,1000);
    var boundry = confidence * 1000;
    var midBoundry = Math.floor((1000 - boundry)/2);
    var range = max - min + 1;

    if (base < boundry) {
      return (base % range) + min;
    }

    if (base < midBoundry) {
      return (base % min);
    }

    return (base % max) + max;

  }

  // Get a random number is a given range.
  function getRandom(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Calculates the median value for all times run during a series of simulations.
  function getMedian(data) {

    var m = [];
    $.each(data, function(index, value){
      next_set = new Array(value).fill(index);
      m.splice(0,0, ...next_set);
    });

    m.sort(function(a, b) {
        return a - b;
    });

    var middle = Math.floor((m.length - 1) / 2); // NB: operator precedence
    if (m.length % 2) {
        return m[middle];
    } else {
        return (m[middle] + m[middle + 1]) / 2.0;
    }
  }

  // Builds the histogram graph.
  function buildHistogram(list, min, max, median) {
    var minbin = min;
    var maxbin = max;
    var numbins = maxbin - minbin;
    var maxval = Math.max(...list);

    // whitespace on either side of the bars in units of MPG
    var binmargin = .2;
    var margin = {top: 10, right: 30, bottom: 50, left: 60};
    var width = 800 - margin.left - margin.right;
    var height = 500 - margin.top - margin.bottom;

    // Set the limits of the x axis
    var xmin = minbin - 1
    var xmax = maxbin + 1

    // This scale is for determining the widths of the histogram bars
    var x = d3.scale.linear()
      .domain([0, (xmax - xmin)])
      .range([0, width]);

    // Scale for the placement of the bars
    var x2 = d3.scale.linear()
      .domain([xmin, xmax])
      .range([0, width]);

    var y = d3.scale.linear()
      .domain([0, maxval])
      .range([height, 0]);

    var xAxis = d3.svg.axis()
      .scale(x2)
      .orient("bottom");
    var yAxis = d3.svg.axis()
      .scale(y)
      .ticks(8)
      .orient("left");

    // put the graph in the "mpg" div
    var svg = d3.select("#histoGram").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," +
        margin.top + ")");

    // set up the bars
    var bar = svg.selectAll(".bar")
      .data(list)
      .enter().append("g")
      .attr("class", "bar")
      .attr("transform", function(d, i) { return "translate(" +
        x2(i + minbin) + "," + y(d) + ")"; });

    // add rectangles of correct size at correct location
    bar.append("rect")
      .attr("x", x(binmargin))
      .attr("width", x( 2 * binmargin))
      .attr("height",  function(d) { return height - y(d); });

    // add the x axis and x-label
    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);
    svg.append("text")
      .attr("class", "xlabel")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom)
      .text("Hours");

    // add the y axis and y-label
    svg.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(0,0)")
      .call(yAxis);
    svg.append("text")
      .attr("class", "ylabel")
      .attr("y", 0 - margin.left) // x and y switched due to rotation
      .attr("x", 0 - (height / 2))
      .attr("dy", "1em")
      .attr("transform", "rotate(-90)")
      .style("text-anchor", "middle")
      .text("Frequency");
  }
});
