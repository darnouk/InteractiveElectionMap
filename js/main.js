document.addEventListener("DOMContentLoaded", function () {
    const width = 1200; // Adjusted scale
    const height = 700;

    // Create the SVG container
    const svg = d3
        .select("#map")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const projection = d3
        .geoAlbersUsa()
        .translate([width / 2, height / 2])
        .scale(1500);

    const path = d3.geoPath().projection(projection);

    let year = 1976; // Default year

    // Close initial popup
    const closeButton = document.getElementById("closePopup");
    if (closeButton) {
        closeButton.addEventListener("click", function () {
            document.getElementById("popup").style.display = "none";
        });
    }

    // Load data
    Promise.all([
        d3.json("data/usa_states_outline.geojson"),
        d3.csv("data/election_data.csv")
    ]).then(([geojson, csv]) => {
        const electionData = csv.map(d => ({
            year: +d.year,
            state: d.state,
            candidate: d.candidate,
            party: d.party,
            candidatevotes: +d.candidatevotes,
            totalvotes: +d.totalvotes,
            winner: d.winner === "TRUE"
        }));

        // Populate the dropdown with available years
        const years = Array.from(new Set(electionData.map(d => d.year))); // Get unique years
        const yearSelector = d3.select("#yearSelector");

        years.forEach(yearOption => {
            yearSelector
                .append("option")
                .attr("value", yearOption)
                .text(yearOption);
        });

        // Set the default year in the dropdown
        yearSelector.property("value", year);

        // Draw the map
        drawMap(geojson, electionData);

        // Dropdown event
        d3.select("#yearSelector").on("change", function () {
            year = +this.value;
            drawMap(geojson, electionData);
        });
    });

    function drawMap(geojson, electionData) {
        const stateData = geojson.features.map(state => {
            const stateName = state.properties.NAME.toUpperCase();
            const results = electionData.filter(d => d.state === stateName && d.year === year);

            const winner = results.find(d => d.winner);
            if (winner) state.properties.winner = winner.party;

            return state;
        });

        const states = svg.selectAll("path").data(stateData);

        // Enter and update states
        states
            .enter()
            .append("path")
            .merge(states)
            .attr("d", path)
            .attr("fill", d => {
                if (d.properties.winner === "DEMOCRAT") return "#4a90e2";
                if (d.properties.winner === "REPUBLICAN") return "#d64a4a";
                return "#ccc";
            })
            .attr("stroke", "#888")
            .attr("stroke-width", 1)
            .on("mouseover", function (event, d) {
                d3.select(this).attr("stroke", "white").attr("stroke-width", 2);

                const stateName = d.properties.NAME;
                const stateData = electionData.filter(
                    entry => entry.state === stateName.toUpperCase() && entry.year === year
                );

                // Update dashboard with state and candidate info
                const stateInfo = d3.select("#stateName").text(stateName);

                const candidatesHtml = stateData
                    .map(candidate => {
                        // Format the vote count with commas
                        const formattedVotes = candidate.candidatevotes.toLocaleString();
                        return `<p><strong>${candidate.candidate}</strong>: ${formattedVotes} votes</p>`;
                    })
                    .join("");
                d3.select("#candidates").html(candidatesHtml);
            })
            .on("mouseout", function () {
                d3.select(this).attr("stroke", "#888").attr("stroke-width", 1);
                d3.select("#stateName").text("Hover over a state");
                d3.select("#candidates").html("");
            });

        states.exit().remove();
    }
});
