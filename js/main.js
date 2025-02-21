import { renderHistogram } from "./histogram.js";
import { renderScatterplot } from "./scatterplot.js";
import PeopleChoroplethMap from './peopleChoroplethMap.js';
import JobsChoroplethMap from "./jobsChoroplethMap.js";

// Function to compute Job Density, excluding Puerto Rico
function computeJobDensity(jobsData, peopleData) {
  // Filter the datasets for the specific attributes you need and exclude PR
  const jobsFiltered = jobsData.filter(d => d.Attribute === "NumCivEmployed" && d.State !== "PR");
  const peopleFiltered = peopleData.filter(d => d.Attribute === "TotalPop2020" && d.State !== "PR");

  // Create a lookup map keyed by FIPS for each dataset
  const jobMap = new Map();
  jobsFiltered.forEach(d => {
    jobMap.set(String(d.FIPS), d);
  });

  const popMap = new Map();
  peopleFiltered.forEach(d => {
    popMap.set(String(d.FIPS), d);
  });

  // Merge the data based on FIPS and compute job density (jobs per capita)
  const mergedData = [];
  jobMap.forEach((jobRecord, fips) => {
    const popRecord = popMap.get(fips);
    if (popRecord) {
      // Convert the string values to numbers
      const numJobs = +jobRecord.Value;
      const totalPop = +popRecord.Value;
      // Avoid division by zero
      const jobDensity = totalPop !== 0 ? numJobs / totalPop : 0;

      mergedData.push({
        FIPS: fips,
        State: jobRecord.State,    // assuming State is consistent across datasets
        County: jobRecord.County,   // assuming County is consistent as well
        NumCivEmployed: numJobs,
        TotalPop2020: totalPop,
        JobDensity: jobDensity
      });
    }
  });

  return mergedData;
}

// Load CSV files using d3.csv, filtering out extra columns in Jobs.csv if needed
Promise.all([
  d3.csv("data/Jobs.csv"),
  d3.csv("data/People.csv"),
  d3.json("data/counties-10m.json")
]).then(([jobsData, peopleData, geoData]) => {
  // Compute the new dataset
  const computedData = computeJobDensity(jobsData, peopleData);

  // Convert the computed data into CSV format using D3
  const csvOutput = d3.csvFormat(computedData);
  console.log("Computed CSV Data:\n", csvOutput);

  // Call visualization functions and classes, passing data
  renderHistogram(computedData);

  renderScatterplot(computedData);

  // Log the created geoJsonData
  console.log("Geo Data:\n", geoData);

  // Combine both datasets by adding the population density to the TopoJSON file
  geoData.objects.counties.geometries.forEach(d => {
    // console.log(d);
    for (let i = 0; i < peopleData.length; i++) {
      if (String(d.id) === peopleData[i].FIPS && peopleData[i].Attribute === "TotalPop2020") {
        d.properties.pop = +peopleData[i].Value;
      }
    }
  });

  const peopleChoroplethMap = new PeopleChoroplethMap({
    parentElement: "#peopleChoroplethMap"
  }, geoData);

  // Combine both datasets by adding the population density to the TopoJSON file
  geoData.objects.counties.geometries.forEach(d => {
    // console.log(d);
    for (let i = 0; i < jobsData.length; i++) {
      if (String(d.id) === jobsData[i].FIPS && jobsData[i].Attribute === "NumCivEmployed") {
        d.properties.jobs = +jobsData[i].Value;
      }
    }
  });

  const jobsChoroplethMap = new JobsChoroplethMap({
    parentElement: "#jobsChoroplethMap"
  }, geoData);
}).catch(error => {
  console.error("Error loading CSV files:", error);
});
