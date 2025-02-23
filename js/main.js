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
  const filteredJobsData = filterData(jobsData, "NumCivEmployed", "JobsData");
  const filteredPeopleData = filterData(peopleData, "TotalPop2020", "PeopleData");

  // Call visualization functions and classes, passing data
  renderHistogram(filteredPeopleData, "TotalPop2020", "#peopleHistogram");
  renderHistogram(filteredJobsData, "NumCivEmployed", "#jobsHistogram");

  renderScatterplot(
    filteredPeopleData,
    filteredJobsData
  );

  // Log the created geoJsonData
  console.log("Geo Data:\n", geoData);

  // Combine both datasets by adding the population density to the TopoJSON file
  geoData.objects.counties.geometries.forEach(d => {
    for (let i = 0; i < filteredPeopleData.length; i++) {
      if (String(d.id) === filteredPeopleData[i].FIPS) {
        d.properties.pop = +filteredPeopleData[i].Value;
      }
    }
  });

  const peopleChoroplethMap = new PeopleChoroplethMap({
    parentElement: "#peopleChoroplethMap"
  }, geoData);

  // Combine both datasets by adding the population density to the TopoJSON file
  geoData.objects.counties.geometries.forEach(d => {
    // console.log(d);
    for (let i = 0; i < filteredJobsData.length; i++) {
      if (String(d.id) === filteredJobsData[i].FIPS) {
        d.properties.jobs = +filteredJobsData[i].Value;
      }
    }
  });

  const jobsChoroplethMap = new JobsChoroplethMap({
    parentElement: "#jobsChoroplethMap"
  }, geoData);
}).catch(error => {
  console.error("Error loading CSV files:", error);
});
