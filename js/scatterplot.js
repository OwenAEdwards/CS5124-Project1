export function renderScatterplot(computedData) {
  // Define margins and dimensions for the scatterplot
  const margin = { top: 20, right: 30, bottom: 50, left: 60 };
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  // Create the SVG container
  const svgScatter = d3.select("#scatterplot").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Set up the x-scale using TotalPop2020
  const xScatter = d3.scaleLinear()
    .domain([0, d3.max(computedData, d => d.TotalPop2020)])
    .nice()
    .range([0, width]);

  // Set up the y-scale using JobDensity
  const yScatter = d3.scaleLinear()
    .domain([0, d3.max(computedData, d => d.JobDensity)])
    .nice()
    .range([height, 0]);

  // Create dots for each data point
  svgScatter.selectAll(".dot")
    .data(computedData)
    .enter().append("circle")
    .attr("class", "dot")
    .attr("cx", d => xScatter(d.TotalPop2020))
    .attr("cy", d => yScatter(d.JobDensity))
    .attr("r", 5);

  // Add the x-axis
  svgScatter.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScatter));
  
  // Add the y-axis
  svgScatter.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(yScatter));
  
  // Add x-axis label
  svgScatter.append("text")
    .attr("class", "x-axis-label")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 10)
    .attr("text-anchor", "middle")
    .text("Total Population 2020");
  
  // Add y-axis label
  svgScatter.append("text")
    .attr("class", "y-axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 20)
    .attr("dy", "-0.5em")
    .attr("text-anchor", "middle")
    .text("Job Density");
}
