# Simple Project Simulator

This simple time estimator for projects takes a CSV file and runs a monte carlo simulation to help understand the project's future. It will give you projections of both time required and costs. It is inspired by ideas from [Joel Spolsky's piece of Evidence Based Estimates](https://www.joelonsoftware.com/2007/10/26/evidence-based-scheduling/) with my own tweaks and adjustments.

![Sample Time Projection Results](images/TimeEstimateSample.png?raw=true)

To get started locally run:
`npm install; npm start`

You can enter your list of tasks manually or by uploading a CSV file.

The CSV file should have a header row of:

`Task,Max,Min,Confidence,Cost`

The rows follow suit, providing a name for each task, the max number of hours estimated for the task, the min number of hours estimated, and the level of confidence (as a percentage) that the actual will fall within the range, and the hourly cost for that task. An example row for project setup estimated to take 2-5 hours with 90% confidence at $150/hour would look like:

`Setup,5,2,90,150`

There is a [sample file](src/data/sample.png) you can download to use as a template.

The project leverages [D3](https://d3js.org/) for the histogram.
