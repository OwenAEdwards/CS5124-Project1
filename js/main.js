import { renderHistogram } from "./histogram.js";
import { renderScatterplot } from "./scatterplot.js";
import PeopleChoroplethMap from './peopleChoroplethMap.js';
import JobsChoroplethMap from "./jobsChoroplethMap.js";
import { filterJobsData, filterPeopleData } from './filterData.js';

// Load CSV files using d3.csv, filtering out extra columns in Jobs.csv if needed
Promise.all([
  d3.csv("data/Jobs.csv"),
  d3.csv("data/People.csv"),
  d3.json("data/counties-10m.json")
]).then(([jobsData, peopleData, geoData]) => {
  const jobsAttributes = new Set([
    "NumCivLaborforce2007", "NumCivLaborForce2008", "NumCivLaborForce2009", 
    "NumCivLaborforce2010", "NumCivLaborForce2011", "NumCivLaborForce2012", 
    "NumCivLaborforce2013", "NumCivLaborforce2014", "NumCivLaborforce2015", 
    "NumCivLaborforce2016", "NumCivLaborforce2017", "NumCivLaborforce2018", 
    "NumCivLaborforce2019", "NumCivLaborForce2020", "NumCivLaborforce2021"
  ]);
  const peopleAttributes = new Set([
    "TotalPopEst2010", "TotalPopEst2011", "TotalPopEst2012", 
    "TotalPopEst2013", "TotalPopEst2014", "TotalPopEst2015", 
    "TotalPopEst2016", "TotalPopEst2017", "TotalPopEst2018", 
    "TotalPopEst2019", "TotalPop2020"
  ]);

  // Call the function for jobsData and peopleData
  const filteredJobsData = filterJobsData(jobsData, jobsAttributes, "JobsData");
  const filteredPeopleData = filterPeopleData(peopleData, peopleAttributes, "PeopleData");

  // Default attributes
  let selectedJobsAttr = "NumCivLaborforce2021";
  let selectedPeopleAttr = "TotalPop2020";

  function updateVisualizations() {
    // Filter to only include entries with the default attribute
    let selectedJobsData = filteredJobsData.filter(d => d.Attribute === selectedJobsAttr);
    let selectedPeopleData = filteredPeopleData.filter(d => d.Attribute === selectedPeopleAttr);

    // Clear previous visualizations before rendering new ones
    d3.select("#peopleHistogram").selectAll("*").remove();
    d3.select("#jobsHistogram").selectAll("*").remove();
    d3.select("#scatterplot").selectAll("*").remove();
    d3.select("#peopleChoroplethMap").selectAll("*").remove();
    d3.select("#jobsChoroplethMap").selectAll("*").remove();

    // Extract the year from the jobs attribute using a regex
    const jobsYear = selectedJobsAttr.match(/\d{4}$/)[0]; // This gets the last 4 digits (the year)

    // Extract the year from the people attribute using a regex
    const peopleYear = selectedPeopleAttr.match(/\d{4}$/)[0]; // This gets the last 4 digits (the year)

    // Update titles dynamically based on selected year for Histograms
    d3.select("#peopleHistogramTitle")
    .text(`${peopleYear} Population Histogram`);

    d3.select("#jobsHistogramTitle")
    .text(`${jobsYear} Job Histogram`);

    // Update titles dynamically based on selected year for Choropleth Maps
    d3.select("#peopleChoroplethMapTitle")
    .text(`${peopleYear} Population Distribution`);

    d3.select("#jobsChoroplethMapTitle")
    .text(`${jobsYear} Job Concentration`);

    // Call visualization functions and classes, passing data
    renderHistogram(selectedPeopleData, "Population", "#peopleHistogram");
    renderHistogram(selectedJobsData, "Jobs", "#jobsHistogram");

    renderScatterplot(
      selectedPeopleData,
      selectedJobsData
    );

    // Log the created geoJsonData
    console.log("Geo Data:\n", geoData);

    // Create lookup maps for faster access
    const peopleMap = new Map(selectedPeopleData.map(d => [d.FIPS, +d.Value]));
    const jobsMap = new Map(selectedJobsData.map(d => [d.FIPS, +d.Value]));

    // Iterate through counties and add the corresponding values
    geoData.objects.counties.geometries.forEach(d => {
      const fips = String(d.id);
      
      // Assign population data if available
      if (peopleMap.has(fips)) {
        d.properties.pop = peopleMap.get(fips);
      }

      // Assign jobs data if available
      if (jobsMap.has(fips)) {
        d.properties.jobs = jobsMap.get(fips);
      }
    });

    const peopleChoroplethMap = new PeopleChoroplethMap({
      parentElement: "#peopleChoroplethMap"
    }, geoData);

    const jobsChoroplethMap = new JobsChoroplethMap({
      parentElement: "#jobsChoroplethMap"
    }, geoData);
  }

  // Initial rendering
  updateVisualizations();

  // Event listener for radio button changes
  document.getElementById("labor-force-dropdown").addEventListener("change", (event) => {
    selectedJobsAttr = event.target.value;
    console.log("Selected Jobs Attribute:", selectedJobsAttr);
    updateVisualizations();
  });

  document.getElementById("population-dropdown").addEventListener("change", (event) => {
    selectedPeopleAttr = event.target.value;
    console.log("Selected Population Attribute:", selectedPeopleAttr);
    updateVisualizations();
  });
}).catch(error => {
  console.error("Error loading CSV files:", error);
});
