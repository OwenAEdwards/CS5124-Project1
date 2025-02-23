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
    tooltip = d3.select("body").append("div")
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
    .text("Total Jobs");
}
