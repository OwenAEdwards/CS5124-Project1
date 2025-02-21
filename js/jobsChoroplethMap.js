export default class JobsChoroplethMap {
  constructor(_config, _data) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 1000,
      containerHeight: _config.containerHeight || 500,
      margin: _config.margin || { top: 10, right: 10, bottom: 10, left: 10 },
      tooltipPadding: 10,
      legendBottom: 50,
      legendLeft: 50,
      legendRectHeight: 12,
      legendRectWidth: 150,
    };

    this.data = _data;
    this.us = _data;
    this.active = d3.select(null);

    this.initVis();
  }

  initVis() {
    let vis = this;

    // Calculate inner chart size
    vis.width =
      vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height =
      vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    // Define SVG
    vis.svg = d3
      .select(vis.config.parentElement)
      .append("svg")
      .attr("class", "center-container")
      .attr("width", vis.config.containerWidth)
      .attr("height", vis.config.containerHeight)
      .attr("viewBox", `0 0 ${vis.config.containerWidth} ${vis.config.containerHeight}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    // Background rect to capture clicks
    vis.svg
      .append("rect")
      .attr("class", "background center-container")
      .attr("width", vis.config.containerWidth)
      .attr("height", vis.config.containerHeight)
      .on("click", vis.clicked);

    // Projection setup
    vis.projection = d3
      .geoAlbersUsa()
      .fitSize(
        [
          vis.width - vis.config.margin.left - vis.config.margin.right,
          vis.height - vis.config.margin.top - vis.config.margin.bottom,
        ],
        topojson.feature(vis.us, vis.us.objects.counties)
      );

    vis.path = d3.geoPath().projection(vis.projection);

    // Get jobs values for color scale
    const jobsValues = vis.data.objects.counties.geometries
      .map((d) => d.properties.jobs)
      .filter((d) => d !== null && d !== undefined);

    // Color scale for jobs data
    vis.colorScale = d3
      .scaleLinear()
      .domain(d3.extent(jobsValues)) // Set domain from min to max jobs
      .range(["#cfe2f2", "#0d306b"]) // Color range for low and high values
      .interpolate(d3.interpolateHcl); // Smooth color transition

    // Add main group element
    vis.g = vis.svg
      .append("g")
      .attr("class", "center-container center-items us-state")
      .attr(
        "transform",
        `translate(${vis.config.margin.left},${vis.config.margin.top})`
      );

    // Create county paths
    const countyFeatures = topojson.feature(vis.us, vis.us.objects.counties).features;

    vis.counties = vis.g
      .append("g")
      .attr("id", "counties")
      .selectAll("path")
      .data(countyFeatures)
      .enter()
      .append("path")
      .attr("d", vis.path)
      .attr("class", "county-boundary")
      .attr("fill", (d) => {
        const countyJobs = d.properties.jobs;
        return countyJobs != null ? vis.colorScale(countyJobs) : "url(#lightstripe)"; // Striped pattern for missing data
      })
      .attr("class", (d) => (d.properties.jobs ? "active" : "inactive")); // Grayscale inactive counties

    // Tooltip handling
    vis.counties
      .on("mousemove", (event, d) => {
        const countyJobs = d.properties.jobs;
        const countyName = d.properties.name || "Unknown County";

        let tooltip = d3.select("#tooltip");
        if (tooltip.empty()) {
          tooltip = d3.select("body").append("div").attr("id", "tooltip").attr("class", "tooltip");
        }

        tooltip
          .style("display", "block")
          .style("left", `${event.pageX + vis.config.tooltipPadding}px`)
          .style("top", `${event.pageY + vis.config.tooltipPadding}px`)
          .html(`
            <div class="tooltip-title">${countyName}</div>
            <div><strong>Total Jobs:</strong> ${countyJobs ? countyJobs.toLocaleString() : "No data available"}</div>
          `);
      })
      .on("mouseleave", () => {
        d3.select("#tooltip").style("display", "none");
      });

    // Add state borders (for visual separation)
    vis.g
      .append("path")
      .datum(topojson.mesh(vis.us, vis.us.objects.states, (a, b) => a !== b))
      .attr("id", "state-borders")
      .attr("d", vis.path);
  }

  // Click handler for background interaction
  clicked() {
    console.log("Background clicked");
  }
}
