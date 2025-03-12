<script>
	import { onMount } from "svelte";
	import { MapLibre, FullScreenControl, GeoJSONSource, LineLayer, Marker, FillLayer, Popup, CircleLayer, HeatmapLayer } from "svelte-maplibre-gl";

	let date = $state("2025-02-01");
	let geojson = $state({});

	async function loadData() {
		const YYYYMMDD = date.split("-").join("");
		geojson = await import(`./api/records/${YYYYMMDD}.json`);
		console.log(geojson);
	}

	onMount(async () => {
		await loadData();
	});

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
	let map = $state.raw();

	let heatmap = $state(false);
	let lineColor = $state("#ff00dd");
	let lineWidth = $state(1.5);
	let clickedName = $state("");
	let circleRadius = $state(15);
	let pointColor = $state("#00000033");
	let manual = $state(false);
	let opacity = $state(0.8);
	let radius = $state(15);
	let showHeatmap = $state(false);
	let showCounties = $state(true);
	let showMunicipalityUnits = $state(false);

	let zoom = $state(6.5);
	let center = $state([15.4749126, 49.8037633]);

	const markers = [];

	function zoomTo(evt) {
		let { lngLat } = evt;
		console.log(evt);

		map.flyTo({
			center: lngLat,
			zoom: 9,
			duration: 2000,
		});
	}

	// increase the size of the circle based on the zoom level
	function calculateSizeByZoom() {
		return Math.pow(2, zoom - 10) * 150;
	}
	const COLOR_SCALE = ["#fff", "#ffffb2", "#fd8d3c", "#e31a1c"];
	const colorScale = ["case", ["==", ["get", "risk"], 1], COLOR_SCALE[1], ["==", ["get", "risk"], 2], COLOR_SCALE[2], ["==", ["get", "risk"], 3], COLOR_SCALE[3], COLOR_SCALE[0]];

	function randomRisk() {
		const risks = ["low", "medium", "high"];
		return risks[Math.floor(Math.random() * risks.length)];
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

	let source;
</script>

<div class="container flex flex-col gap-4 mx-auto my-4">
	<h1 class="text-3xl font-bold text-white mb-2">ZDRAVÝ BUXUS – Mapa</h1>
	<h2 class="text-xl font-bold text-white mb-2">Riziko infekce Buxus spp. patogenem Cylindrocladium buxicola</h2>

	<p>Mapa zobrazuje riziko infekce zimostrázu (buxus) patogenem Cylindrocladium buxicola a jeho šíření na základě vyhodnocení naměřených meteorologických dat (teploty vzduchu a četnosti srážek) a hodnot optimálních pro vývoj patogenu.</p>

	<p>Stupnice pro vyhodnocení rizika je stanovena na základě laboratorních testů (Bartíková, 2020; Avenot et al. 2021 a Avenot et al. 2022) a zohledňuje optimální teploty pro vývoj patogena a dlouhodobé ovlhčení listů (min. 6 h).</p>

	<p>K zobrazení dat z jednotlivých meteostanic je využit kartogram (choropleth).<br />Jednotkou zeměpisné oblasti je obec.</p>

	<form class="grid grid-cols-1 justify-stretch gap-4 flex-wrap align-stretch">
		<div class="flex flex-1 gap-4 grow flex-wrap items-center">
			<button type="submit" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" onclick={prevDay}>Předchozí den</button>
			<label for="date" class="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Datum</label>
			<div class="relative flex-1">
				<div class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
					<svg class="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
						<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
					</svg>
				</div>
				<input
					type="date"
					id="date"
					class="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
					placeholder="YYYY-MM-DD"
					datepicker-format
					aria-label="Načíst data"
					required
					bind:value={date}
				/>
				<button type="submit" class="text-white absolute end-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" onclick={loadData}
					>Načíst Data</button
				>
			</div>
			<button type="submit" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" onclick={nextDay}>Další den</button>
		</div>
		<div class="flex gap-4 flex-1 grow">
			<div class="flex items-center mb-4 gap-8">
				<div>
					<input id="heatmap" type="checkbox" bind:checked={showHeatmap} class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
					<label for="heatmap" class="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">{showHeatmap ? "Skrýt heatmap" : "Zobrazit heatmap"} (Experimentální)</label>
				</div>
				<div>
					<input id="counties" type="checkbox" bind:checked={showCounties} class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
					<label for="counties" class="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">{showCounties ? "Skrýt okresy" : "Zobrazit okresy"}</label>
				</div>
				<div>
					<input id="municipalityUnits" type="checkbox" bind:checked={showMunicipalityUnits} class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
					<label for="municipalityUnits" class="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">{showMunicipalityUnits ? "Skrýt obce" : "Zobrazit obce"}</label>
				</div>
			</div>

			<!-- <button
				type="button"
				class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
				onclick={() => {
					manual = !manual;
				}}
			>
				{manual ? "Automatická" : "Manuální"} velikost
			</button> -->
		</div>
	</form>

	<!-- <div class="risk range flex justify-stretch">
		<div class="flex-1 text-center py-1 bg-[#ffffb2]">Nízké riziko</div>
		<div class="flex-1 text-center py-1 bg-[#fd8d3c]">Střední riziko</div>
		<div class="flex-1 text-center py-1 bg-[#e31a1c]">Vysoké riziko</div>
	</div> -->

	<!-- <p class="text-white">{zoom}</p> -->
	<MapLibre class="h-[75vh] min-h-[300px] border-8 border-slate-500" {style} {...initialState} bind:map bind:zoom bind:center>
		<div id="state-legend" class="legend">
			<h4>Legenda</h4>
			<div>
				<span style="background-color: #ffffb2"></span> Nízké riziko
			</div>
			<div>
				<span style="background-color: #fee0d2"></span> Střední riziko
			</div>
			<div>
				<span style="background-color: #fc9272"></span> Vysoké riziko
			</div>
		</div>
		<FullScreenControl position="top-left" />
		{#if showMunicipalityUnits}
			<GeoJSONSource data="/orp-simple-data-topo.geojson">
				<LineLayer
					layout={{ "line-cap": "round", "line-join": "round" }}
					paint={{
						"line-width": 2,
						"line-dasharray": [5, 2],
						"line-color": "#000000",
						"line-opacity": 0.3,
					}}
				/>
				<FillLayer
					paint={{
						"fill-color": "#000",
						"fill-opacity": 0.1,
					}}
					beforeLayerType="symbol"
					manageHoverState
					onclick={zoomTo}
				/>
			</GeoJSONSource>
		{/if}
		{#if showCounties}
			<GeoJSONSource data="okresy.geojson">
				<LineLayer
					layout={{ "line-cap": "round", "line-join": "round" }}
					paint={{
						"line-width": 2,
						"line-dasharray": [5, 2],
						"line-color": "#000000",
						"line-opacity": 0.3,
					}}
				/>
				<FillLayer
					paint={{
						"fill-color": "#000",
						"fill-opacity": 0.1,
					}}
					beforeLayerType="symbol"
					manageHoverState
					onclick={zoomTo}
				/>
			</GeoJSONSource>
		{/if}
		<GeoJSONSource data={geojson}>
			<Popup openOn="click" offset={[0, -10]}>
				<div class="text-lg font-bold">{clickedName}</div>
			</Popup>
			<CircleLayer
				metadata
				paint={{
					"circle-radius": manual ? radius : calculateSizeByZoom(),
					"circle-color": colorScale,
					"circle-opacity": opacity,
				}}
				layout={{
					visibility: "visible",
				}}
				onclick={zoomTo}
			/>
		</GeoJSONSource>
		{#if showHeatmap}
			<GeoJSONSource data={geojson}>
				<HeatmapLayer
					paint={{
						"heatmap-weight": 1,
						"heatmap-intensity": ["interpolate", ["exponential", 2], ["zoom"], 0, 0.9, 18, 10],
						"heatmap-color": ["interpolate", ["linear"], ["heatmap-density"], 0, "rgba(33,102,172,0)", 0.2, "rgb(103,169,207)", 0.4, "rgb(209,229,240)", 0.6, "rgb(253,219,199)", 0.7, "rgb(239,138,98)", 0.9, "rgb(178,24,43)", 1, "rgb(100,0,200)"],
						"heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 8, 18, 20],
						"heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 2, 1, 18, 0],
					}}
				/>
			</GeoJSONSource>
		{/if}

		{#each markers as { lngLat, label, name } (label)}
			<Marker {lngLat} onclick={() => (clickedName = name)} class="grid h-8 w-8 place-items-center rounded-full border border-gray-200 bg-red-300 text-black shadow-2xl focus:outline-2 focus:outline-black">
				<span>
					{label}
				</span>

				<Popup openOn="hover" offset={[0, -10]}>
					<div class="text-lg font-bold">{name}</div>
				</Popup>
			</Marker>
		{/each}
	</MapLibre>
	{#if source}
		<pre class="text-white">{JSON.stringify(source, null, 4)}</pre>
	{/if}
	<p style="max-width:100%;font-size:10px">
		DEDIKACE: Mapa byla vytvořena v rámci projektu SS05010079/ZDRAVÝ BUXUS – základ ekologicky udržitelné péče o historické zahrady a parky i veřejnou zeleň, který je spolufinancován se státní podporou Technologické agentury ČR v rámci programu <a
			class="text-blue-300 underline"
			href="https://tacr.gov.cz/program/program-prostredi-pro-zivot/">Prostředí pro život</a
		>.
	</p>
</div>

<style>
	.legend {
		background-color: #000;
		border-radius: 3px;
		bottom: 10px;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
		color: #fff;
		font:
			12px/20px "Helvetica Neue",
			Arial,
			Helvetica,
			sans-serif;
		padding: 10px;
		position: absolute;
		left: 10px;
		z-index: 1;
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
