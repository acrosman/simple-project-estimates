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
        time += getRandom(row.Min, row.Max);
      });
      times.push(time);
      cells = "<td>" + i + "</td>\n";
      cells += "<td>" + time + "</td>\n";
      $('#simulationResultsWrapper table').append("<tr>" + cells + "</tr>");
    }
    var sum = times.reduce(function(a, b) { return a + b; });
    var avg = sum / times.length;
    $("#simulationAverage").html('Average Time: ' + avg);
  }

  function getRandom(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

});
