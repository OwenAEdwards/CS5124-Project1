import data from './stateMap.js';
const { stateMap, statesWithSelfNamedCounties } = data;

export function filterJobsData(data, attributes, logLabel) {
  const seenStates = new Set();

  const filteredData = data.filter((d) => {
    const fullStateName = stateMap[d.State];

    // We only care about the specified attribute
    if (!attributes.has(d.Attribute)) {
      return false; // Skip if the attribute does not match
    }

    // Check if this is the first entry for the state (the state total)
    const isFirstEntryForState = d.County === fullStateName && attributes.has(d.Attribute);

    // If it's the first entry for the state and it's not a self-named county state, exclude it
    if (isFirstEntryForState && !statesWithSelfNamedCounties.includes(d.State)) {
      return false; // Exclude state total
    }

    // If the county is named after the state, we keep it (only for specific states)
    if (statesWithSelfNamedCounties.includes(d.State) && d.County === fullStateName) {
      if (seenStates.has(d.State)) {
        // This is the second occurrence (county-level), so we keep it
        seenStates.clear(); // We need to clear the seen states for the next attribute
        return true;
      } else {
        // First time seeing the state total, ignore it and mark state as seen
        seenStates.add(d.State);
        return false;
      }
    }

    // Otherwise, exclude counties where the county name matches the state or it's the United States
    return d.County !== fullStateName && 
           d.County !== "United States" && 
           d.State !== "PR";
  });

  console.log(`[${logLabel}] Filtered Data:`, filteredData);
  return filteredData;
}

export function filterPeopleData(data, attributes, logLabel) {
  const filteredData = [];

  data.forEach((d) => {
    const fullStateName = stateMap[d.State];

    // We only care about the specified attributes
    if (!attributes.has(d.Attribute)) {
      return;
    }

    // Check if this is the first entry for the state (state total)
    const isFirstEntryForState = d.County === fullStateName && attributes.has(d.Attribute);

    // If it's the first entry for the state and it's not a self-named county state, exclude it
    if (isFirstEntryForState && !statesWithSelfNamedCounties.includes(d.State)) {
      return;
    }

    // If the county is named after the state, handle it differently
    if (statesWithSelfNamedCounties.includes(d.State) && d.County === fullStateName) {
        // This is the second occurrence (county-level), so we keep it
        filteredData.push(d);
        return;
    }

    // Otherwise, exclude counties where the county name matches the state or it's the United States
    if (d.County !== fullStateName && d.County !== "United States" && d.State !== "PR") {
      filteredData.push(d);
    }
  });

  console.log(`[${logLabel}] Filtered Data:`, filteredData);
  return filteredData;
}
