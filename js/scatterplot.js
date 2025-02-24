export function renderScatterplot(peopleData, jobsData) {
  // Define margins and dimensions for the scatterplot
  const margin = { top: 20, right: 30, bottom: 50, left: 100 };
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  // Join jobsData and peopleData by FIPS code
const mergedData = peopleData.map(pd => {
  const jd = jobsData.find(jd => jd.FIPS === pd.FIPS);
  return jd ? {
    FIPS: pd.FIPS,
    County: pd.County || "Unknown County",
    State: pd.State || "Unknown State",
    TotalPop2020: +pd.Value, // Convert string to number
    JobDensity: +jd.Value    // Convert string to number
  } : null;
}).filter(d => d !== null); // Remove unmatched entries

  // Create the SVG container
  const svgScatter = d3.select("#scatterplot").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Set up the x-scale using TotalPop2020
  const xScatter = d3.scaleLinear()
    .domain([0, d3.max(mergedData, d => d.TotalPop2020)])
    .nice()
    .range([0, width]);

  // Set up the y-scale using JobDensity
  const yScatter = d3.scaleLinear()
    .domain([0, d3.max(mergedData, d => d.JobDensity)])
    .nice()
    .range([height, 0]);

  // Create a tooltip div (only if it doesn't exist)
  let tooltip = d3.select("#scatterplot-tooltip");
  if (tooltip.empty()) {
    tooltip = d3.select("body")
      .append("div")
      .attr("id", "scatterplot-tooltip")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("display", "none")
      .style("background", "rgba(0, 0, 0, 0.7)")
      .style("color", "#fff")
      .style("padding", "5px 10px")
      .style("border-radius", "5px")
      .style("font-size", "12px")
      .style("pointer-events", "none");
  }

  // Compute regression line (y = mx + b)
  function linearRegression(data) {
    const n = data.length;
    const sumX = d3.sum(data, d => d.TotalPop2020);
    const sumY = d3.sum(data, d => d.JobDensity);
    const sumXY = d3.sum(data, d => d.TotalPop2020 * d.JobDensity);
    const sumX2 = d3.sum(data, d => d.TotalPop2020 ** 2);

    const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX ** 2);
    const b = (sumY - m * sumX) / n;

    // Calculate R²
    const meanY = sumY / n;
    const ssTotal = d3.sum(data, d => (d.JobDensity - meanY) ** 2);
    const ssResidual = d3.sum(data, d => (d.JobDensity - (m * d.TotalPop2020 + b)) ** 2);
    const rSquared = 1 - ssResidual / ssTotal;

    return { m, b, rSquared };
  }

  const { m, b, rSquared } = linearRegression(mergedData);

  // Draw regression line
  const xMin = d3.min(mergedData, d => d.TotalPop2020);
  const xMax = d3.max(mergedData, d => d.TotalPop2020);
  const yMin = m * xMin + b;
  const yMax = m * xMax + b;

  svgScatter.append("line")
    .attr("x1", xScatter(xMin))
    .attr("y1", yScatter(yMin))
    .attr("x2", xScatter(xMax))
    .attr("y2", yScatter(yMax))
    .attr("stroke", "red")
    .attr("stroke-width", 2);

  // Create dots for each data point
  svgScatter.selectAll(".dot")
    .data(mergedData)
    .enter().append("circle")
    .attr("class", "dot")
    .attr("cx", d => xScatter(d.TotalPop2020))
    .attr("cy", d => yScatter(d.JobDensity))
    .attr("r", 5)
    .on("mouseover", (event, d) => {
      tooltip.style("display", "block")
        .html(`
          <strong>${d.County}, ${d.State}</strong><br>
          Population: ${d.TotalPop2020.toLocaleString()}<br>
          Total Jobs: ${d.JobDensity.toLocaleString()}
        `);
    })
    .on("mousemove", (event) => {
      tooltip.style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY + 10}px`);
    })
    .on("mouseout", () => {
      tooltip.style("display", "none");
    });

  // Display the regression equation
  svgScatter.append("text")
    .attr("x", width + margin.right - 260)  // Position to the right outside of the scatterplot
    .attr("y", margin.top + 100)
    .attr("fill", "black")
    .style("font-size", "12px")
    .text(`Jobs = ${m.toFixed(2)} * Population + ${b.toFixed(2)}`);

  // Display the R² value
  svgScatter.append("text")
    .attr("x", width + margin.right - 260)  // Same positioning for R²
    .attr("y", margin.top + 120)
    .attr("fill", "black")
    .style("font-size", "12px")
    .text(`R² = ${rSquared.toFixed(3)}`);

  // Display the "What does this mean?" text
  const whatDoesThisMeanText = svgScatter.append("text")
    .attr("x", width + margin.right - 260)  // Position to the right outside of the scatterplot
    .attr("y", margin.top + 140)
    .attr("fill", "blue")  // Blue color for the text
    .style("font-size", "14px")
    .style("cursor", "pointer")
    .text("What does this mean?");

  // Simple tooltip (initially hidden) for "What does this mean?" text
  let equationTooltip = d3.select("#equation-tooltip");
  if (equationTooltip.empty()) {
    equationTooltip = d3.select("body")
      .append("div")
      .attr("id", "equation-tooltip")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background", "rgba(0, 0, 0, 0.8)")
      .style("color", "#fff")
      .style("padding", "10px")
      .style("border-radius", "5px")
      .style("display", "none")
      .style("font-size", "12px")
      .style("width", "250px")
      .style("max-width", "90%")
      .style("pointer-events", "none")
      .html(`
        <strong>Regression Equation:</strong><br>
        The equation describes the relationship between population and total jobs. The slope (m) represents how much the total jobs increases for each unit increase in population. The intercept (b) is the value of total jobs when the population is zero.<br><br>
        <strong>R²:</strong><br>
        The R² value indicates how well the regression line fits the data. A value of 1 means a perfect fit, while a value closer to 0 suggests a weak relationship.
      `);
  }

  // Show tooltip on hover
  whatDoesThisMeanText
  .on("mouseover", function(event) {
    const bbox = this.getBoundingClientRect(); // Get the bounding box of the text element

    equationTooltip
      .style("left", `${bbox.left + window.scrollX}px`) // Account for scrolling
      .style("top", `${bbox.top + window.scrollY + 15}px`) // Position above the text
      .style("display", "block"); // Show the tooltip
  })
  .on("mouseout", () => equationTooltip.style("display", "none")); // Hide tooltip when mouse leaves

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
    .attr("y", -margin.left + 35)
    .attr("dy", "-0.5em")
    .attr("text-anchor", "middle")
    .text("Total Jobs");
}
