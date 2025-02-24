import { renderHistogram } from "./histogram.js";
import { renderScatterplot } from "./scatterplot.js";
import PeopleChoroplethMap from './peopleChoroplethMap.js';
import JobsChoroplethMap from "./jobsChoroplethMap.js";
import { filterData } from "./filterData.js";

// Load CSV files using d3.csv, filtering out extra columns in Jobs.csv if needed
Promise.all([
  d3.csv("data/Jobs.csv"),
  d3.csv("data/People.csv"),
  d3.json("data/counties-10m.json")
]).then(([jobsData, peopleData, geoData]) => {
  // Call the function for jobsData and peopleData
  const filteredJobsData = filterData(jobsData, "NumCivLaborforce2021", "JobsData");
  const filteredPeopleData = filterData(peopleData, "TotalPop2020", "PeopleData");

  // Call visualization functions and classes, passing data
  renderHistogram(filteredPeopleData, "Population", "#peopleHistogram");
  renderHistogram(filteredJobsData, "Jobs", "#jobsHistogram");

  renderScatterplot(
    filteredPeopleData,
    filteredJobsData
  );

  // Log the created geoJsonData
  console.log("Geo Data:\n", geoData);

  // Create lookup maps for faster access
  const peopleMap = new Map(filteredPeopleData.map(d => [d.FIPS, +d.Value]));
  const jobsMap = new Map(filteredJobsData.map(d => [d.FIPS, +d.Value]));

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
}).catch(error => {
  console.error("Error loading CSV files:", error);
});
