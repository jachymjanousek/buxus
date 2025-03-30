<script>
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { debounce } from "$lib/debounce";
    import {
        MapLibre,
        FullScreenControl,
        GeoJSONSource,
        LineLayer,
        FillLayer,
    } from "svelte-maplibre-gl";

    let searchParam = $page.url.searchParams.get("q") ?? "";

    let today = new Date();
    let yesterday = new Date()
    yesterday.setDate(today.getDate() - 1);
    let yesterdayISO = yesterday.toISOString().split("T")[0];
    let date = $state(yesterdayISO);
    let map = $state.raw();
    let zoom = $state(6.5);
    let center = $state([15.4749126, 49.8037633]);

    let search = $state(searchParam);
    let searchSuggestions = $state([]);
    if(searchParam?.length > 0) searchLocation(searchParam);

    const weatherData = [
        {
            WSI: "0-20000-0-11414",
            humidity: true,
            temperature: 25,
            risk: 1,
        },
        {
            WSI: "0-20000-0-11415",
            humidity: true,
            temperature: 26,
            risk: 2,
        },
        {
            WSI: "0-20000-0-11416",
            humidity: true,
            temperature: 27,
            risk: 3,
        },
    ];

    const mapLayers = $state([
        {
            id: "Obce",
            type: "geojson",
            source: "geodata/obce-stanice-psc.geojson",
            visible: true,
            fillColor: "#000000",
            fillOpacity: 0.5,
            level: 9,
        },
        {
            id: "orp",
            type: "topojson",
            source: "geodata/orp-simple.json",
            visible: false,
            fillColor: "#00ff00",
            fillOpacity: 0.5,
            level: 8,
        },
        {
            id: "regiony",
            type: "topojson",
            source: "geodata/regiony-simple.json",
            visible: false,
            fillColor: "#0000ff",
            fillOpacity: 0.5,
            level: 7,
        },
        {
            id: "cr",
            type: "topojson",
            source: "geodata/cr-simple.json",
            visible: false,
            fillColor: "#ffff00",
            fillOpacity: 0.5,
            level: 6,
        },
    ]);

    const style = {
        version: 8,
        sources: {
            osm: {
                type: "raster",
                tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
                tileSize: 256,
                attribution: "&copy; OpenStreetMap Contributors",
                maxzoom: 16,
            },
        },
        layers: [
            {
                id: "osm",
                type: "raster",
                source: "osm", // This must match the source key above
            },
        ],
    };

    const initialState = {
        center: [15.4749126, 49.8037633],
        zoom: 6.5,
    };

    async function loadData() {
        const YYYYMMDD = date.split("-").join("");
        // geojson = await import(`./api/records/${YYYYMMDD}.json`);
        // console.log(geojson);
    }

    onMount(async () => {
        await loadData();
    });

    function disableMapRotation() {
        map.dragRotate.disable();
        map.touchZoomRotate.disableRotation();
    }

    function zoomToLevel(level = 9) {
        return function (lat, lng) {
            map.flyTo({
                center: [lng, lat],
                zoom: level,
                duration: 1000,
            });
        };
    }

    function handleLayerClick(level) {
        return function (event) {
            const { lngLat } = event;
            return zoomToLevel(level)(lngLat.lat, lngLat.lng);
        };
    }

    // increase the radius of the circle based on the zoom level
    function calculateRadiusByZoom() {
        return Math.pow(2, zoom - 10) * 150;
    }

    const COLOR_SCALE = ["#fff", "#ffffb2", "#fd8d3c", "#e31a1c"];
    const colorScale = [
        "case",
        ["==", ["get", "risk"], 1],
        COLOR_SCALE[1],
        ["==", ["get", "risk"], 2],
        COLOR_SCALE[2],
        ["==", ["get", "risk"], 3],
        COLOR_SCALE[3],
        COLOR_SCALE[0],
    ];

    function randomRisk() {
        const risks = ["low", "medium", "high"];
        return risks[Math.floor(Math.random() * risks.length)];
    }

    async function searchLocation(searchString) {
        const response = await fetch(
            "/search?q=" + encodeURIComponent(searchString),
        );
        const data = await response.json();
        console.log(data);
        parseSearchSuggestions(data);
        if (searchSuggestions.length == 1) {
            search = searchSuggestions[0].name;
            zoomToLevel(9.5)(
                searchSuggestions[0].lat,
                searchSuggestions[0].lon,
            );

            searchSuggestions = [];
        }
    }

    async function handleSearchSubmit(event) {
        console.log("handleSearchSubmit");
        event.preventDefault();
        if (!search || search?.length < 2) return;
        debounce(await searchLocation(search), 500);
    }

    function handleSuggestionClick(suggestion) {
        console.log("handleSuggestionClick", suggestion);
        search = suggestion.name;
        searchSuggestions = [];
        zoomToLevel(9)(suggestion.lat, suggestion.lon);
    }

    function parseSearchSuggestions(data) {
        const suggestions = data.map((item) => ({
            name: item.display_name,
            lat: item.lat,
            lon: item.lon,
        }));
        searchSuggestions = suggestions;
    }

    async function prevDay() {
        date = new Date(date);
        date.setDate(date.getDate() - 1);
        date = date.toISOString().split("T")[0];
        console.log(date);

        await loadData();
    }

    async function nextDay() {
        console.log(date);
        date = new Date(date);
        date.setDate(date.getDate() + 1);
        date = date.toISOString().split("T")[0];
        console.log(date);
        await loadData();
    }
</script>

<div class="container flex flex-col gap-4 mx-auto my-4">
    <h1 class="text-3xl font-bold mb-2">ZDRAVÝ BUXUS – Mapa</h1>

    <form
        class="grid grid-cols-1 justify-stretch gap-4 flex-wrap align-stretch"
    >
        <div class="flex gap-2 flex-wrap switcher" style="--threshold:30rem;">
            <button
                type="submit"
                class="text-white bg-black hover:bg-neutral-800 focus:ring-4 focus:outline-none focus:ring-neutral-300 font-medium rounded-lg text-sm px-4 py-2"
                onclick={prevDay}>Předchozí den</button
            >
            <div class="relative flex-1 !grow-4">
                <div
                    class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none min-w-6/12"
                >
                    <svg
                        class="w-4 h-4 text-gray-500"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 20 20"
                    >
                        <path
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                        />
                    </svg>
                </div>
                <input
                    type="date"
                    id="date"
                    class="block w-full p-4 ps-10 text-sm text-gray-900 rounded-lg border border-black"
                    placeholder="YYYY-MM-DD"
                    datepicker-format
                    aria-label="Načíst data"
                    required
                    bind:value={date}
                    max={yesterdayISO}
                />
                <button
                    type="submit"
                    class="text-white absolute end-2.5 bottom-2.5 bg-black hover:bg-neutral-800 focus:ring-4 focus:outline-none focus:ring-neutral-300 font-medium rounded-lg text-sm px-4 py-2"
                    onclick={loadData}>Načíst Data</button
                >
            </div>
            <button
                type="submit"
                class="text-white bg-black hover:bg-neutral-800 focus:ring-4 focus:outline-none focus:ring-neutral-300 font-medium rounded-lg text-sm px-4 py-2
                disabled:opacity-50 cursor-not-allowed"
                disabled={date == yesterdayISO}
                onclick={nextDay}>Další den</button
            >
        </div>
    </form>

    <!-- <div class="risk range flex justify-stretch">
		<div class="flex-1 text-center py-1 bg-[#ffffb2]">Nízké riziko</div>
		<div class="flex-1 text-center py-1 bg-[#fd8d3c]">Střední riziko</div>
		<div class="flex-1 text-center py-1 bg-[#e31a1c]">Vysoké riziko</div>
	</div> -->

    <!-- <p class="text-white">{zoom}</p> -->
    <MapLibre
        class="h-[75vh] min-h-[300px]"
        {style}
        {...initialState}
        bind:map
        bind:zoom
        bind:center
    >
        <!-- use directive is not available on component -->
        <div use:disableMapRotation></div>

        <form class="search-form" onsubmit={handleSearchSubmit}>
            <div>
                <input
                    type="search"
                    id="location-search"
                    name="q"
                    placeholder="Zadejte adresu, město, obec nebo PSČ"
                    list="searchSuggestions"
                    bind:value={search}
                />
                <button
                    type="submit"
                    class="text-white bg-neutral-700 hover:bg-neutral-800 focus:ring-4 focus:outline-none focus:ring-neutral-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-neutral-600 dark:hover:bg-neutral-700 dark:focus:ring-neutral-800"
                    >Hledat</button
                >
                {#if searchSuggestions.length > 0}
                    <div id="searchSuggestions">
                        {#each searchSuggestions as suggestion, index (index)}
                            <div
                                class="suggestion"
                                value={suggestion.name}
                                onclick={() =>
                                    handleSuggestionClick(suggestion)}
                            >
                                {suggestion.name}
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        </form>

        <div id="state-legend" class="legend">
            <h4>Legenda kartogramu</h4>
            <div>
                <span style="background-color: {COLOR_SCALE[1]}"></span> Nízké riziko
            </div>
            <div>
                <span style="background-color: {COLOR_SCALE[2]}"></span> Střední
                riziko
            </div>
            <div>
                <span style="background-color: {COLOR_SCALE[3]}"></span> Vysoké riziko
            </div>
        </div>
        <FullScreenControl position="top-right" />

        <!-- Map Layers -->
        {#each mapLayers as { id, source, visible, level }, index (id)}
            <!-- {#if visible} -->
            <GeoJSONSource data={source}>
                <FillLayer
                    paint={{
                        "fill-color": COLOR_SCALE[0],
                        "fill-opacity": 0.1,
                    }}
                    beforeLayerType="symbol"
                    manageHoverState
                    onclick={handleLayerClick(level + 0.5)}
                    minzoom={level - 1}
                />
                <LineLayer
                    layout={{ "line-cap": "round", "line-join": "round" }}
                    paint={{
                        "line-width": 1 + index,
                        "line-color": "#000000",
                        "line-opacity": 0.3,
                    }}
                    minzoom={level - 1}
                />
            </GeoJSONSource>
            <!-- {/if} -->
        {/each}

        <!-- {#each markers as { lngLat, label, name } (label)}
            <Marker
                {lngLat}
                onclick={() => (clickedName = name)}
                class="grid h-8 w-8 place-items-center rounded-full border border-gray-200 bg-red-300 text-black shadow-2xl focus:outline-2 focus:outline-black"
            >
                <span>
                    {label}
                </span>

                <Popup openOn="hover" offset={[0, -10]}>
                    <div class="text-lg font-bold">{name}</div>
                </Popup>
            </Marker>
        {/each} -->
    </MapLibre>

    <section class="grid grid-cols-1 gap-4">
        <h2 class="text-xl font-bold mb-2">
            Riziko infekce Buxus spp. patogenem <i>Cylindrocladium buxicola</i>
        </h2>

        <p>
            Mapa zobrazuje riziko infekce zimostrázu (Buxus) patogenem <i
                >Cylindrocladium buxicola</i
            > a jeho šíření na základě vyhodnocení naměřených meteorologických dat
            (teploty vzduchu a četnosti srážek) a hodnot optimálních pro vývoj patogenu.
        </p>

        <p>
            Stupnice pro vyhodnocení rizika je stanovena na základě
            laboratorních testů (Bartíková, 2020; Avenot et al. 2021 a Avenot et
            al. 2022) a zohledňuje optimální teploty pro vývoj patogena a
            dlouhodobé ovlhčení listů (min. 6 h).
        </p>

        <table class="w-full border max-w-fit">
            <thead>
                <tr class="border bg-gray-300">
                    <th class="px-4 py-2">TEPLOTA (°C)</th>
                    <th class="px-4 py-2">RIZIKO</th>
                    <th class="px-4 py-2">BAREVNÉ OZNAČENÍ</th>
                </tr>
            </thead>
            <tbody>
                <tr class="border even:bg-gray-200 odd:bg-white">
                    <td class="px-4 py-2">&lt; 14,9 °C</td>
                    <td class="px-4 py-2">velmi nízké</td>
                    <td class="px-4 py-2 flex items-center"
                        ><span class="w-3 h-3 rounded-full bg-[#ffffb2] mr-2"
                        ></span>žlutá</td
                    >
                </tr>
                <tr class="border even:bg-gray-200 odd:bg-white">
                    <td class="px-4 py-2">15–19,9 °C</td>
                    <td class="px-4 py-2">střední</td>
                    <td class="px-4 py-2 flex items-center"
                        ><span class="w-3 h-3 rounded-full bg-[#fd8d3c] mr-2"
                        ></span>oranžová</td
                    >
                </tr>
                <tr class="border even:bg-gray-200 odd:bg-white">
                    <td class="px-4 py-2">20–24 °C</td>
                    <td class="px-4 py-2">vysoké</td>
                    <td class="px-4 py-2 flex items-center"
                        ><span class="w-3 h-3 rounded-full bg-[#e31a1c] mr-2"
                        ></span>červená</td
                    >
                </tr>
                <tr class="border even:bg-gray-200 odd:bg-white">
                    <td class="px-4 py-2">24,1–28 °C</td>
                    <td class="px-4 py-2">střední</td>
                    <td class="px-4 py-2 flex items-center"
                        ><span class="w-3 h-3 rounded-full bg-[#fd8d3c] mr-2"
                        ></span>oranžová</td
                    >
                </tr>
                <tr class="border even:bg-gray-200 odd:bg-white">
                    <td class="px-4 py-2">&gt; 28,1 °C</td>
                    <td class="px-4 py-2">velmi nízké</td>
                    <td class="px-4 py-2 flex items-center"
                        ><span class="w-3 h-3 rounded-full bg-[#ffffb2] mr-2"
                        ></span>žlutá</td
                    >
                </tr>
            </tbody>
        </table>

        <p>
            K zobrazení dat z jednotlivých meteostanic je využit kartogram
            (choropleth).<br />Jednotkou zeměpisné oblasti je obec.
        </p>

        <p style="max-width:100%;font-size:10px">
            DEDIKACE: Mapa byla vytvořena v rámci projektu SS05010079/ZDRAVÝ
            BUXUS – základ ekologicky udržitelné péče o historické zahrady a
            parky i veřejnou zeleň, který je spolufinancován se státní podporou
            Technologické agentury ČR v rámci programu <a
                class="text-neutral-700 underline"
                href="https://tacr.gov.cz/program/program-prostredi-pro-zivot/"
                >Prostředí pro život</a
            >.
        </p>
    </section>
</div>

<style>
    .search-form {
        position: absolute;
        display: flex;
        top: 10px;
        left: 10px;
        align-items: center;
        justify-content: center;
        margin-bottom: 20px;
        z-index: 1;
    }

    .search-form input {
        padding: 8px 12px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 14px;
        margin-right: 10px;
        background: rgba(255, 255, 255, 1);
        border: 1px solid #ccc;
        color: #000;
    }

    #searchSuggestions {
        position: absolute;
        width: 100%;
        top: 100%;
        left: 0;
        margin-top: 5px;
        border-radius: 4px;
        border: 1px solid #ccc;
        background: #fff;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        z-index: 2;
    }

    #searchSuggestions .suggestion {
        padding: 5px 10px;
        border-bottom: 1px solid #eee;
        cursor: pointer;
        color: #000;
    }

    #searchSuggestions .suggestion:hover {
        background-color: #f0f0f0;
    }

    #searchSuggestions .suggestion.active {
        background-color: #007bff;
        color: #fff;
    }

    .legend {
        position: absolute;
        left: 10px;
        padding: 10px;
        bottom: 10px;
        border-radius: 3px;
        color: #fff;
        background-color: #000;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        z-index: 1;
        font:
            12px/20px "Helvetica Neue",
            Arial,
            Helvetica,
            sans-serif;
    }

    .legend h4 {
        margin: 0 0 10px;
    }

    .legend div span {
        border-radius: 50%;
        display: inline-block;
        height: 10px;
        margin-right: 5px;
        width: 10px;
    }
</style>
