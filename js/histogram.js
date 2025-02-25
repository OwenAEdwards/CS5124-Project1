export function renderHistogram(_data, _attribute, _parent) {
  // Define margins and dimensions for the histogram
  const margin = { top: 20, right: 30, bottom: 0, left: 60 };
  const width = 800 - margin.left - margin.right;
  const height = 225 - margin.top - margin.bottom;

  // Create the SVG container
  const svg = d3.select(_parent).append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Select the attribute to visualize
  const attribute = _attribute;
  const data = _data.map(d => +d.Value);

  // Define min and max values
  const minValue = d3.min(data);
  const maxValue = d3.max(data) * 1.05;  // Add a 5% buffer for better spacing

  // Set up the X scale (linear)
  const x = d3.scaleLinear()
    .domain([minValue, maxValue])
    .nice()
    .range([0, width]);

  // Define number of bins (ensure small values don't get lumped into one bin)
  const numBins = Math.max(30, Math.sqrt(data.length));  // Dynamic bin count
  const binWidth = (maxValue - minValue) / numBins;

  // Create histogram bins
  const bins = d3.histogram()
    .domain(x.domain())
    .thresholds(d3.range(minValue, maxValue, binWidth))(data);

  // Set up the Y scale (frequency count)
  const y = d3.scaleLinear()
    .domain([0, d3.max(bins, d => d.length)])
    .nice()
    .range([height, 0]);

  // Create tooltip
  const tooltip = d3.select(_parent)
    .append("div")
    .style("position", "absolute")
    .style("background", "rgba(0, 0, 0, 0.8)")
    .style("color", "white")
    .style("padding", "6px 10px")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("opacity", 0);
  
  // Format numbers with commas
  const formatNumber = d3.format(",");

  // Append bars for the histogram
  svg.selectAll(".bar")
    .data(bins)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.x0))
    .attr("transform", d => `translate(${x(d.x0)},${y(d.length)})`)
    .attr("width", d => Math.max(1, x(d.x1) - x(d.x0) - 1))
    .attr("height", d => height - y(d.length))
    .style("fill", "steelblue")
    .style("cursor", "pointer")
    .on("mouseover", (event, d) => {
      d3.select(event.currentTarget).style("fill", "orange"); // Change bar color to orange on hover
      tooltip
        .style("opacity", 1)
        .html(`<strong>Range:</strong> ${formatNumber(Math.round(d.x0)) + " " + attribute} - ${formatNumber(Math.round(d.x1)) + " " + attribute}<br>
               <strong>Frequency:</strong> ${formatNumber(d.length)} Counties`)
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 30}px`);
    })
    .on("mousemove", event => {
      tooltip
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 30}px`);
    })
    .on("mouseout", () => {
      d3.select(event.currentTarget).style("fill", "steelblue"); // Revert bar color back to blue
      tooltip.style("opacity", 0);
    });


  // Add X-axis
  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  // Add Y-axis
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