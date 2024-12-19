document.addEventListener("DOMContentLoaded", () => {
    // Close popup functionality
    const popup = document.getElementById("popup");
    const closePopup = document.getElementById("closePopup");
    closePopup.addEventListener("click", () => {
        popup.style.display = "none";
    });

    const mapContainer = d3.select("#map");
    const width = mapContainer.node().offsetWidth;
    const height = mapContainer.node().offsetHeight;

    // Create an SVG for the map
    const svg = mapContainer.append("svg")
        .attr("width", width)
        .attr("height", height);

    const projection = d3.geoAlbersUsa().translate([width / 2, height / 2]).scale(1000);
    const path = d3.geoPath().projection(projection);

    // Load GeoJSON and election data
    Promise.all([
        d3.json("data/usa_states_outline.geojson"),
        d3.csv("data/election_data.csv")
    ]).then(([geoData, electionData]) => {
        const states = geoData.features;

        // Add states to the map
        svg.selectAll("path")
            .data(states)
            .enter().append("path")
            .attr("d", path)
            .attr("fill", "#ccc")
            .attr("stroke", "#333")
            .attr("stroke-width", 0.5);

        // Populate dropdown
        const years = [...new Set(electionData.map(d => d.year))];
        const yearSelector = document.getElementById("yearSelector");
        years.forEach(year => {
            const option = document.createElement("option");
            option.value = year;
            option.textContent = year;
            yearSelector.appendChild(option);
        });

        // Default to 1976
        updateMap(1976);

        yearSelector.addEventListener("change", (e) => {
            updateMap(+e.target.value);
        });

        function updateMap(year) {
            const yearData = electionData.filter(d => +d.year === year);

            // Update state colors based on election results
            states.forEach(state => {
                const stateData = yearData.find(d => d.state === state.properties.NAME.toUpperCase());
                state.properties.winner = stateData?.party || "UNKNOWN";
            });

            svg.selectAll("path")
                .data(states)
                .transition().duration(500)
                .attr("fill", d => {
                    if (d.properties.winner === "DEMOCRAT") return "#4a90e2";
                    if (d.properties.winner === "REPUBLICAN") return "#d64a4a";
                    return "#ccc";
                });
        }
    });
});
