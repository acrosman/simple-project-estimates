$(document).ready(function() {
  var data = null;
  // https://cmatskas.com/importing-csv-files-using-jquery-and-html5/
  // http://evanplaice.github.io/jquery-csv/examples/basic-usage.html
  // https://github.com/evanplaice/jquery-csv/

  // The event listener for the file upload
  $('#csvFileInput').change(upload);
  $('#startSimulationButton').click(runSimulation);
  $('#simulationResultsWrapper').hide();
  $('#simulationAreaWrapper').hide();

  // Method that checks that the browser supports the HTML5 File API
  function browserSupportFileUpload() {
    var isCompatible = false;
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      isCompatible = true;
    }
    return isCompatible;
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
          $.each(data, function(index, row){
            cells = "<td>" + row.Task; + "</td>/n";
              cells += "<td>" + row.Max; + "</td>/n";
            cells += "<td>" + row.Min; + "</td>/n";
            cells += "<td>" + row.Confidence; + "</td>/n";
            $('#rawData table').append("<tr>" + cells+ "</tr>");
          });
          $('#simulationAreaWrapper').show();
        } else {
          alert('No data to import!');
        }
      };
    }
  }

  function runSimulation(evt) {
    var passes = $('#simulationPasses').val();
    var times = [];
    $('#simulationResultsWrapper').show();
    for(var i = 0; i < passes; i++) {
      var time = 0;
      $.each(data, function(index, row) {
        time += generateEstimate(row.Min, row.Max, row.Confidence);
      });
      times.push(time);
      cells = "<td>" + i + "</td>\n";
      cells += "<td>" + time + "</td>\n";
      $('#simulationResultsWrapper table').append("<tr>" + cells + "</tr>");
    }
    var sum = times.reduce(function(a, b) { return a + b; });
    var avg = sum / times.length;
    var median = getMedian(times);
    var max = Math.max(times);
    var min = Math.min(times);
    $("#simulationAverage").html('Average Time: ' + avg);
    $("#simulationMedian").html('Median Time: ' + median);
    $("#simulationMax").html('Max Time: ' + max);
    $("#simulationMin").html('Min Time: ' + min);

    //var histogram = d3.histogram(times);

    //d3.select('#histoGram').append("svg");

  }

  function generateEstimate(min, max, confidence){
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

  function getRandom(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function getMedian(data) {
    var m = data.sort(function(a, b) {
        return a - b;
    });

    var middle = Math.floor((m.length - 1) / 2); // NB: operator precedence
    if (m.length % 2) {
        return m[middle];
    } else {
        return (m[middle] + m[middle + 1]) / 2.0;
    }
}

});
