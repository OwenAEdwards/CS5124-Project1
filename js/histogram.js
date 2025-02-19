export function renderHistogram(computedData) {
  // Define margins and dimensions for the histogram
  const margin = { top: 20, right: 30, bottom: 50, left: 60 };
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  // Create the SVG container
  const svg = d3.select("#histogram").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Select the attribute to visualize (e.g., NumCivEmployed or JobDensity)
  const attribute = "JobDensity";  // In this case, we're visualizing JobDensity
  const data = computedData.map(d => d[attribute]);

  // Set up the X scale (linear scale based on data range)
  const x = d3.scaleLinear()
    .domain([0, d3.max(data)])
    .nice()
    .range([0, width]);

  // Create histogram bins based on the selected attribute
  const bins = d3.histogram()
    .domain(x.domain())
    .thresholds(x.ticks(20))(data);  // Adjust number of bins

  // Set up the Y scale (counts of data points in each bin)
  const y = d3.scaleLinear()
    .domain([0, d3.max(bins, d => d.length)])
    .nice()
    .range([height, 0]);

  // Append bars for the histogram
  svg.selectAll(".bar")
    .data(bins)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", 1)
    .attr("transform", d => `translate(${x(d.x0)},${y(d.length)})`)
    .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
    .attr("height", d => height - y(d.length));

  // Add X-axis to the histogram
  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  // Add Y-axis to the histogram
  svg.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(y));

  // Add X-axis label
  svg.append("text")
    .attr("class", "x-axis-label")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 10)
    .attr("text-anchor", "middle")
    .text(attribute);

  // Add Y-axis label
  svg.append("text")
    .attr("class", "y-axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 10)
    .attr("text-anchor", "middle")
    .text("Frequency");
}