// Paths to GeoJSON and Election Data
const geoJsonPath = "data/usa_states_outline.geojson";
const electionDataPath = "data/election_data.csv"; 

// Initialize SVG dimensions
const width = 1000;
const height = 600;

// Create SVG Container
const svg = d3.select("#map").append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", `0 0 ${width} ${height}`);

// Tooltip
const tooltip = d3.select("#tooltip");

// Load Data and Draw Map
Promise.all([
    d3.json(geoJsonPath),
    d3.csv(electionDataPath) 
]).then(([geoJson, electionData]) => {
    const projection = d3.geoAlbersUsa().fitSize([width, height], geoJson);
    const path = d3.geoPath().projection(projection);

    // Function to update map colors based on election results
    function updateMapColors(year) {
        svg.selectAll("path")
            .data(geoJson.features)
            .join("path")
            .attr("d", path)
            .attr("class", "state")
            .attr("fill", d => {
                const stateName = d.properties.NAME;
                const stateNameUpper = stateName.toUpperCase();

                // Filter data for the selected state, year, and winner (using "TRUE")
                const stateData = electionData.find(row => 
                    row.state === stateNameUpper && 
                    row.year == year && 
                    row.winner === "TRUE"  
                );

                if (stateData) {
                    return stateData.party_simplified === "DEMOCRAT" ? "blue" : "red"; 
                } else {
                    return "gray"; 
                }
            })
            .attr("stroke", "white")
            .attr("stroke-width", 0.5)
            .on("mouseover", function(event, d) { 
                tooltip.html(`<strong>${d.properties.NAME}</strong>`)
                        .style("left", `${event.pageX + 10}px`)
                        .style("top", `${event.pageY + 10}px`)
                        .classed("visible", true);
            })
            .on("mouseout", function() {
                tooltip.classed("visible", false);
            })
            .on("click", function (event, d) {
                const stateName = d.properties.NAME;
                const selectedYear = d3.select("#year-toggle").node().value;
                const stateNameUpper = stateName.toUpperCase();
                const stateData = electionData.filter(row => row.state === stateNameUpper && row.year == selectedYear);

                if (stateData.length > 0) {
                    const republicanData = stateData.find(row => row.party_simplified === "REPUBLICAN");
                    const democratData = stateData.find(row => row.party_simplified === "DEMOCRAT");

                    tooltip.html(`
                            <strong>${stateName}</strong><br>
                            ${republicanData.candidate}: ${republicanData.candidatevotes}<br>
                            ${democratData.candidate}: ${democratData.candidatevotes}
                        `)
                        .style("left", `${event.pageX + 10}px`)
                        .style("top", `${event.pageY + 10}px`)
                        .classed("visible", true);
                } else {
                    tooltip.html(`
                            <strong>${stateName}</strong><br>
                            No data available for ${selectedYear}
                        `)
                        .style("left", `${event.pageX + 10}px`)
                        .style("top", `${event.pageY + 10}px`)
                        .classed("visible", true);
                }
            });
    }
    // Bind data to map (initial drawing)
    updateMapColors(1976); // Start with 1976 data

    // Year Dropdown Change Event
    d3.select("#year-toggle").on("change", function () {
        const selectedYear = this.value;
        updateMapColors(selectedYear); // Update map on year change
    });

    // Close Tooltip on Click Outside
    d3.select("body").on("click", function (event) {
        if (!event.target.closest("#tooltip") && !event.target.closest("path")) {
            tooltip.classed("visible", false);
        }
    });
});