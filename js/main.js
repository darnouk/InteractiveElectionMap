document.addEventListener("DOMContentLoaded", function () {
    const width = 1200; // Adjusted scale
    const height = 900;

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
            })
            .on("mouseout", function (event, d) {
                d3.select(this).attr("stroke", "#888").attr("stroke-width", 1);
            })
            .on("click", function (event, d) {
                const stateName = d.properties.NAME;
                const stateData = electionData.filter(
                    entry => entry.state === stateName.toUpperCase() && entry.year === year
                );

                const content = `<h2>${stateName}</h2>` +
                    stateData
                        .map(candidate => `<p>${candidate.candidate}: ${candidate.candidatevotes} votes</p>`)
                        .join("");

                showPopup(content);
            });

        states.exit().remove();
    }

    function showPopup(content) {
        let popup = d3.select("#infoPopup");
        if (popup.empty()) {
            popup = d3.select("body")
                .append("div")
                .attr("id", "infoPopup")
                .style("position", "absolute")
                .style("background", "white")
                .style("border", "1px solid #ccc")
                .style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.2)")
                .style("border-radius", "8px")
                .style("padding", "10px")
                .style("display", "none");
        }

        popup.html(content)
            .style("display", "block")
            .style("left", `${d3.event.pageX + 10}px`)
            .style("top", `${d3.event.pageY + 10}px`);
    }

    d3.select("body").on("click", function (event) {
        if (!event.target.closest("#infoPopup")) {
            d3.select("#infoPopup").style("display", "none");
        }
    });
});
