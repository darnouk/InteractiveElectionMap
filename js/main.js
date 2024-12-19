document.addEventListener("DOMContentLoaded", function () {
    const width = 1200;
    const height = 700;
    const pie = d3.pie().value(d => d.candidatevotes);
    const arc = d3.arc().outerRadius(100).innerRadius(0); // Controls the size of the pie chart
    const pieWidth = 200; // Width for the pie chart
    const pieHeight = 200; // Height for the pie chart

    // Create the SVG container for the map
    const svg = d3
        .select("#map")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Create the projection and path
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

    // Draw the map and update the dashboard
    function drawMap(geojson, electionData) {
        const stateData = geojson.features.map(state => {
            const stateName = state.properties.NAME.toUpperCase();
            const results = electionData.filter(d => d.state === stateName && d.year === year);

            const winner = results.find(d => d.winner);
            if (winner) state.properties.winner = winner.party;

            return state;
        });

        const states = svg.selectAll("path").data(stateData); // Bind data to the states

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
                // Show the popup with state info on hover
                const stateName = d.properties.NAME;
                const stateData = electionData.filter(
                    entry => entry.state === stateName.toUpperCase() && entry.year === year
                );

                // Update dashboard with state and candidate info
                const stateInfo = d3.select("#stateName").text(stateName);

                const candidatesHtml = stateData // Create a list of candidates and votes
                    .map(candidate => {
                        // Format the vote count with commas
                        const formattedVotes = candidate.candidatevotes.toLocaleString();
                        return `<p><strong>${candidate.candidate}</strong>: ${formattedVotes} votes</p>`;
                    })
                    .join("");
                d3.select("#candidates").html(candidatesHtml); // Update the dashboard with the candidate info

                // Pie Chart Update
                updatePieChart(stateData);
            })
            .on("mouseout", function () { // Reset the state color and clear the dashboard
                d3.select(this).attr("stroke", "#888").attr("stroke-width", 1);
                d3.select("#stateName").text("Hover over a state");
                d3.select("#candidates").html("");
                d3.select("#pieChart").html(""); // Clear the pie chart
            });

        states.exit().remove(); // Remove states that are no longer needed
    }

    // Pie Chart Drawing Function
    function updatePieChart(stateData) {
        const svgPie = d3.select("#pieChart").html(""); // Clear previous pie chart

        const pieData = pie(stateData);
        const pieSvg = svgPie
            // Create the SVG container for the pie chart
            .append("svg")
            .attr("width", pieWidth)
            .attr("height", pieHeight)
            .append("g")
            .attr("transform", `translate(${pieWidth / 2}, ${pieHeight / 2})`);

        const color = d3.scaleOrdinal()
            .domain(pieData.map(d => d.data.candidate))
            .range(["#4a90e2", "#d64a4a", "#f39c12", "#8e44ad"]);

        pieSvg // Add slices to the pie chart
            .selectAll("path")
            .data(pieData)
            .enter()
            .append("path")
            .attr("d", arc)
            .attr("fill", d => color(d.data.candidate))
            .attr("stroke", "white")
            .attr("stroke-width", 2);

        // Add labels to the pie chart
        pieSvg
            .selectAll("text")
            .data(pieData)
            .enter()
            .append("text")
            .attr("transform", function (d) {
                const [x, y] = arc.centroid(d);
                return `translate(${x}, ${y})`;
            })
            .text(d => ((d.data.candidatevotes / d.data.totalvotes) * 100).toFixed(1) + "%") // Only percentage
            .style("text-anchor", "middle")
            .style("fill", "white")
            .style("font-size", "16px");
    }
});
