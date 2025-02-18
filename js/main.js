// Function to compute Job Density, excluding Puerto Rico
function computeJobDensity(jobsData, peopleData) {
  // Filter the datasets for the specific attributes you need and exclude PR
  const jobsFiltered = jobsData.filter(d => d.Attribute === "NumCivEmployed" && d.State !== "PR");
  const peopleFiltered = peopleData.filter(d => d.Attribute === "TotalPop2020" && d.State !== "PR");

  // Create a lookup map keyed by FIPS for each dataset
  const jobMap = new Map();
  jobsFiltered.forEach(d => {
    jobMap.set(d.FIPS, d);
  });

  const popMap = new Map();
  peopleFiltered.forEach(d => {
    popMap.set(d.FIPS, d);
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
  d3.csv("data/Jobs.csv", d => ({
    FIPS: d.FIPS,
    State: d.State,
    County: d.County,
    Attribute: d.Attribute,
    Value: d.Value
  })),
  d3.csv("data/People.csv")
]).then(([jobsData, peopleData]) => {
  // Compute the new dataset
  const computedData = computeJobDensity(jobsData, peopleData);

  // Convert the computed data into CSV format using D3
  const csvOutput = d3.csvFormat(computedData);
  console.log("Computed CSV Data:\n", csvOutput);

  // Optionally, trigger a download of the CSV
  // const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
  // const url = URL.createObjectURL(blob);
  // const a = document.createElement("a");
  // a.href = url;
  // a.download = "job_density.csv";
  // a.click();
}).catch(error => {
  console.error("Error loading CSV files:", error);
});
